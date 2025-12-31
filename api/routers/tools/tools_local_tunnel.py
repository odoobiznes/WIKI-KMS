"""
KMS Tools - Local PC Tunnel endpoints
Allows connecting to local PC via SSH reverse tunnel for remote development
"""

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime
import asyncio
import json
import logging
import secrets
import hashlib

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory storage for active tunnels (in production, use Redis)
active_tunnels: Dict[str, dict] = {}

class TunnelRegistration(BaseModel):
    """Request to register a new tunnel from local PC"""
    machine_name: str
    machine_os: str  # windows, linux, macos
    username: str
    client_token: str  # Pre-shared token for authentication
    capabilities: List[str] = []  # terminal, cursor, windsurf, claude

class TunnelInfo(BaseModel):
    """Information about an active tunnel"""
    tunnel_id: str
    machine_name: str
    machine_os: str
    username: str
    connected_at: str
    capabilities: List[str]
    last_heartbeat: str

class LocalCommandRequest(BaseModel):
    """Request to execute command on local PC"""
    tunnel_id: str
    command: str
    working_dir: Optional[str] = None
    timeout: int = 30

class LocalToolRequest(BaseModel):
    """Request to open tool on local PC"""
    tunnel_id: str
    tool: str  # cursor, windsurf, claude, terminal
    project_path: Optional[str] = None
    
# WebSocket connections for each tunnel
tunnel_connections: Dict[str, WebSocket] = {}


def generate_tunnel_id() -> str:
    """Generate unique tunnel ID"""
    return secrets.token_urlsafe(16)


def verify_client_token(token: str) -> bool:
    """Verify client token (in production, check against database)"""
    # Simple hash verification - in production use proper auth
    valid_hash = hashlib.sha256(b"kms-local-tunnel-2025").hexdigest()
    provided_hash = hashlib.sha256(token.encode()).hexdigest()
    # For now, accept token "kms-local-tunnel-2025"
    return token == "kms-local-tunnel-2025"


@router.post("/local/register")
def register_tunnel(request: TunnelRegistration):
    """
    Register a new tunnel from local PC client
    Called by the local client when it connects
    """
    logger.info(f"🔌 TUNNEL REGISTER REQUEST: machine={request.machine_name}, os={request.machine_os}")
    
    if not verify_client_token(request.client_token):
        logger.warning(f"  Invalid client token from {request.machine_name}")
        raise HTTPException(status_code=401, detail="Invalid client token")
    
    tunnel_id = generate_tunnel_id()
    now = datetime.now().isoformat()
    
    tunnel_info = {
        "tunnel_id": tunnel_id,
        "machine_name": request.machine_name,
        "machine_os": request.machine_os,
        "username": request.username,
        "capabilities": request.capabilities,
        "connected_at": now,
        "last_heartbeat": now,
        "status": "registered"
    }
    
    active_tunnels[tunnel_id] = tunnel_info
    logger.info(f"✓ Tunnel registered: {tunnel_id} for {request.machine_name}")
    
    return {
        "success": True,
        "tunnel_id": tunnel_id,
        "websocket_url": f"wss://kms.it-enterprise.solutions/api/tools/local/ws/{tunnel_id}",
        "message": f"Tunnel registered. Connect via WebSocket to complete setup."
    }


@router.get("/local/tunnels")
def list_tunnels():
    """List all active tunnels"""
    tunnels = []
    for tid, info in active_tunnels.items():
        tunnels.append(TunnelInfo(
            tunnel_id=tid,
            machine_name=info["machine_name"],
            machine_os=info["machine_os"],
            username=info["username"],
            connected_at=info["connected_at"],
            capabilities=info["capabilities"],
            last_heartbeat=info["last_heartbeat"]
        ))
    return {"tunnels": tunnels}


@router.get("/local/tunnel/{tunnel_id}")
def get_tunnel(tunnel_id: str):
    """Get info about specific tunnel"""
    if tunnel_id not in active_tunnels:
        raise HTTPException(status_code=404, detail="Tunnel not found")
    
    info = active_tunnels[tunnel_id]
    return TunnelInfo(
        tunnel_id=tunnel_id,
        machine_name=info["machine_name"],
        machine_os=info["machine_os"],
        username=info["username"],
        connected_at=info["connected_at"],
        capabilities=info["capabilities"],
        last_heartbeat=info["last_heartbeat"]
    )


@router.delete("/local/tunnel/{tunnel_id}")
def disconnect_tunnel(tunnel_id: str):
    """Disconnect a tunnel"""
    if tunnel_id not in active_tunnels:
        raise HTTPException(status_code=404, detail="Tunnel not found")
    
    # Close WebSocket if connected
    if tunnel_id in tunnel_connections:
        # Will be closed by the websocket handler
        del tunnel_connections[tunnel_id]
    
    del active_tunnels[tunnel_id]
    logger.info(f"🔌 Tunnel disconnected: {tunnel_id}")
    
    return {"success": True, "message": "Tunnel disconnected"}


@router.post("/local/execute")
async def execute_local_command(request: LocalCommandRequest):
    """
    Execute command on local PC via tunnel
    """
    logger.info(f"🖥️  LOCAL COMMAND REQUEST: tunnel={request.tunnel_id}, cmd={request.command[:50]}...")
    
    if request.tunnel_id not in active_tunnels:
        raise HTTPException(status_code=404, detail="Tunnel not found")
    
    if request.tunnel_id not in tunnel_connections:
        raise HTTPException(status_code=503, detail="Tunnel not connected (WebSocket)")
    
    ws = tunnel_connections[request.tunnel_id]
    
    try:
        # Send command to local client
        await ws.send_json({
            "type": "execute",
            "command": request.command,
            "working_dir": request.working_dir,
            "timeout": request.timeout
        })
        
        # Wait for response (with timeout)
        response = await asyncio.wait_for(
            ws.receive_json(),
            timeout=request.timeout + 5
        )
        
        return response
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Command execution timed out")
    except Exception as e:
        logger.error(f"Error executing local command: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/local/tool/open")
async def open_local_tool(request: LocalToolRequest):
    """
    Open a development tool on local PC
    Supports: cursor, windsurf, claude, terminal
    """
    logger.info(f"🔧 LOCAL TOOL REQUEST: tunnel={request.tunnel_id}, tool={request.tool}")
    
    if request.tunnel_id not in active_tunnels:
        raise HTTPException(status_code=404, detail="Tunnel not found")
    
    tunnel_info = active_tunnels[request.tunnel_id]
    
    if request.tool not in tunnel_info["capabilities"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Tool '{request.tool}' not available on this machine. Available: {tunnel_info['capabilities']}"
        )
    
    if request.tunnel_id not in tunnel_connections:
        raise HTTPException(status_code=503, detail="Tunnel not connected (WebSocket)")
    
    ws = tunnel_connections[request.tunnel_id]
    
    try:
        # Send tool open request to local client
        await ws.send_json({
            "type": "open_tool",
            "tool": request.tool,
            "project_path": request.project_path
        })
        
        # Wait for confirmation
        response = await asyncio.wait_for(
            ws.receive_json(),
            timeout=30
        )
        
        return response
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Tool open request timed out")
    except Exception as e:
        logger.error(f"Error opening local tool: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/local/ws/{tunnel_id}")
async def tunnel_websocket(websocket: WebSocket, tunnel_id: str):
    """
    WebSocket connection for tunnel communication
    Local client connects here after registration
    """
    if tunnel_id not in active_tunnels:
        await websocket.close(code=4004, reason="Tunnel not registered")
        return
    
    await websocket.accept()
    tunnel_connections[tunnel_id] = websocket
    active_tunnels[tunnel_id]["status"] = "connected"
    
    logger.info(f"🔗 WebSocket connected for tunnel: {tunnel_id}")
    
    try:
        while True:
            # Handle incoming messages from local client
            data = await websocket.receive_json()
            
            if data.get("type") == "heartbeat":
                active_tunnels[tunnel_id]["last_heartbeat"] = datetime.now().isoformat()
                await websocket.send_json({"type": "heartbeat_ack"})
            
            elif data.get("type") == "capabilities_update":
                active_tunnels[tunnel_id]["capabilities"] = data.get("capabilities", [])
            
            elif data.get("type") == "disconnect":
                break
                
    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket disconnected for tunnel: {tunnel_id}")
    except Exception as e:
        logger.error(f"WebSocket error for tunnel {tunnel_id}: {e}")
    finally:
        if tunnel_id in tunnel_connections:
            del tunnel_connections[tunnel_id]
        if tunnel_id in active_tunnels:
            active_tunnels[tunnel_id]["status"] = "disconnected"


@router.get("/local/client-script")
def get_client_script():
    """
    Get the client script for local PC
    Returns Python script that user runs on their local machine
    """
    script = '''#!/usr/bin/env python3
"""
KMS Local Tunnel Client
Run this on your local PC to connect to KMS for remote development

Usage:
    python kms-local-client.py

Requirements:
    pip install websockets requests
"""

import asyncio
import json
import os
import platform
import subprocess
import sys
import shutil
from pathlib import Path

try:
    import websockets
    import requests
except ImportError:
    print("Installing required packages...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets", "requests"])
    import websockets
    import requests

# Configuration
KMS_SERVER = "https://kms.it-enterprise.solutions"
CLIENT_TOKEN = "kms-local-tunnel-2025"

def get_machine_info():
    """Get information about the local machine"""
    return {
        "machine_name": platform.node(),
        "machine_os": platform.system().lower(),
        "username": os.getenv("USER") or os.getenv("USERNAME", "unknown"),
    }

def detect_capabilities():
    """Detect available development tools"""
    capabilities = ["terminal"]
    
    # Check for Cursor
    if shutil.which("cursor") or Path("/usr/local/bin/cursor").exists():
        capabilities.append("cursor")
    if platform.system() == "Windows":
        cursor_win = Path(os.getenv("LOCALAPPDATA", "")) / "Programs" / "cursor" / "Cursor.exe"
        if cursor_win.exists():
            capabilities.append("cursor")
    
    # Check for Windsurf
    if shutil.which("windsurf") or Path("/usr/local/bin/windsurf").exists():
        capabilities.append("windsurf")
    
    # Check for Claude CLI
    if shutil.which("claude"):
        capabilities.append("claude")
    
    return list(set(capabilities))

def execute_command(command, working_dir=None, timeout=30):
    """Execute a command locally"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=working_dir,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return {
            "success": True,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Command timed out"}
    except Exception as e:
        return {"success": False, "error": str(e)}

def open_tool(tool, project_path=None):
    """Open a development tool"""
    system = platform.system().lower()
    
    commands = {
        "cursor": {
            "linux": f"cursor {project_path}" if project_path else "cursor",
            "darwin": f"open -a Cursor {project_path}" if project_path else "open -a Cursor",
            "windows": f"cursor.exe {project_path}" if project_path else "cursor.exe"
        },
        "windsurf": {
            "linux": f"windsurf {project_path}" if project_path else "windsurf",
            "darwin": f"open -a Windsurf {project_path}" if project_path else "open -a Windsurf",
            "windows": f"windsurf.exe {project_path}" if project_path else "windsurf.exe"
        },
        "claude": {
            "linux": f"claude {project_path}" if project_path else "claude",
            "darwin": f"claude {project_path}" if project_path else "claude",
            "windows": f"claude.exe {project_path}" if project_path else "claude.exe"
        },
        "terminal": {
            "linux": f"gnome-terminal --working-directory={project_path}" if project_path else "gnome-terminal",
            "darwin": f'open -a Terminal "{project_path}"' if project_path else "open -a Terminal",
            "windows": f'start cmd /K "cd /d {project_path}"' if project_path else "start cmd"
        }
    }
    
    if tool not in commands:
        return {"success": False, "error": f"Unknown tool: {tool}"}
    
    cmd = commands[tool].get(system)
    if not cmd:
        return {"success": False, "error": f"Tool {tool} not supported on {system}"}
    
    try:
        subprocess.Popen(cmd, shell=True, start_new_session=True)
        return {"success": True, "message": f"{tool} opened successfully"}
    except Exception as e:
        return {"success": False, "error": str(e)}

async def main():
    """Main client loop"""
    print("=" * 50)
    print("KMS Local Tunnel Client")
    print("=" * 50)
    
    machine_info = get_machine_info()
    capabilities = detect_capabilities()
    
    print(f"Machine: {machine_info['machine_name']}")
    print(f"OS: {machine_info['machine_os']}")
    print(f"User: {machine_info['username']}")
    print(f"Capabilities: {', '.join(capabilities)}")
    print()
    
    # Register tunnel
    print("Registering tunnel...")
    try:
        response = requests.post(
            f"{KMS_SERVER}/api/tools/local/register",
            json={
                **machine_info,
                "client_token": CLIENT_TOKEN,
                "capabilities": capabilities
            },
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Failed to register: {e}")
        return
    
    tunnel_id = data["tunnel_id"]
    ws_url = data["websocket_url"]
    
    print(f"Tunnel ID: {tunnel_id}")
    print(f"Connecting to WebSocket...")
    print()
    
    # Connect WebSocket
    try:
        async with websockets.connect(ws_url.replace("https://", "wss://")) as ws:
            print("✓ Connected! You can now use KMS tools remotely.")
            print("  Press Ctrl+C to disconnect.")
            print()
            
            # Start heartbeat task
            async def heartbeat():
                while True:
                    await asyncio.sleep(30)
                    await ws.send(json.dumps({"type": "heartbeat"}))
            
            heartbeat_task = asyncio.create_task(heartbeat())
            
            try:
                while True:
                    msg = await ws.recv()
                    data = json.loads(msg)
                    
                    if data.get("type") == "heartbeat_ack":
                        continue
                    
                    elif data.get("type") == "execute":
                        result = execute_command(
                            data["command"],
                            data.get("working_dir"),
                            data.get("timeout", 30)
                        )
                        await ws.send(json.dumps(result))
                    
                    elif data.get("type") == "open_tool":
                        result = open_tool(
                            data["tool"],
                            data.get("project_path")
                        )
                        await ws.send(json.dumps(result))
                        
            except asyncio.CancelledError:
                pass
            finally:
                heartbeat_task.cancel()
                
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\\nDisconnected.")
'''
    return {
        "script": script,
        "filename": "kms-local-client.py",
        "instructions": [
            "1. Uložte tento skript na svůj lokální počítač jako 'kms-local-client.py'",
            "2. Nainstalujte závislosti: pip install websockets requests",
            "3. Spusťte: python kms-local-client.py",
            "4. Skript se připojí ke KMS serveru a umožní vzdálený přístup",
            "5. V KMS rozhraní uvidíte svůj počítač v seznamu připojených tunelů"
        ]
    }

