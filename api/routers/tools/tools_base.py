"""
KMS Tools - Base module with helper functions and models
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fastapi import HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import logging
import subprocess
import socket
import requests

# Configure logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

from database import get_db_cursor


# === Pydantic Models ===

class ToolOpenRequest(BaseModel):
    """Request to open a tool for a specific object"""
    object_id: int
    folder: Optional[str] = None  # Optional subfolder (plany, instrukce, code, docs)


class ToolOpenResponse(BaseModel):
    """Response with URL to open tool"""
    url: str
    tool_name: str
    project_name: str
    project_path: str


class ClaudeChatRequest(BaseModel):
    """Request to chat with Claude AI"""
    object_id: int
    message: str
    include_context: bool = True
    api_key: Optional[str] = None  # API key from frontend (optional, falls back to env var)


class ClaudeChatResponse(BaseModel):
    """Response from Claude AI"""
    response: str
    project_name: str
    context_files_count: int


# === Enhanced Helper Functions for Debugging ===

def log_environment():
    """Log relevant environment variables for debugging"""
    logger.debug("=== ENVIRONMENT VARIABLES ===")
    env_vars = ['PATH', 'HOME', 'USER', 'DISPLAY', 'XDG_RUNTIME_DIR', 'ANTHROPIC_API_KEY']
    for var in env_vars:
        value = os.environ.get(var, 'NOT SET')
        if var == 'ANTHROPIC_API_KEY' and value != 'NOT SET':
            value = f"{value[:10]}..." if len(value) > 10 else "***"
        logger.debug(f"  {var}={value}")


def check_port_open(host: str, port: int, timeout: float = 2.0) -> bool:
    """Check if a port is open and accepting connections"""
    logger.debug(f"Checking port: {host}:{port}")
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        is_open = result == 0
        logger.debug(f"  Port {host}:{port} is {'OPEN' if is_open else 'CLOSED'} (result={result})")
        return is_open
    except Exception as e:
        logger.warning(f"  Port check failed for {host}:{port}: {e}")
        return False


def check_url_accessible(url: str, timeout: float = 3.0) -> tuple[bool, int, str]:
    """Check if a URL is accessible"""
    logger.debug(f"Checking URL accessibility: {url}")
    try:
        response = requests.get(url, timeout=timeout, allow_redirects=True, verify=False)
        logger.debug(f"  URL {url} returned status {response.status_code}")
        return True, response.status_code, "OK"
    except requests.exceptions.Timeout:
        logger.warning(f"  URL {url} timed out after {timeout}s")
        return False, 0, "Timeout"
    except requests.exceptions.ConnectionError as e:
        logger.warning(f"  URL {url} connection failed: {e}")
        return False, 0, f"Connection error: {e}"
    except Exception as e:
        logger.warning(f"  URL {url} check failed: {e}")
        return False, 0, f"Error: {e}"


def check_command_exists(command: str) -> tuple[bool, str]:
    """Check if a command exists in PATH"""
    logger.debug(f"Checking if command exists: {command}")
    try:
        result = subprocess.run(
            ["which", command],
            capture_output=True,
            text=True,
            timeout=2
        )
        exists = result.returncode == 0
        path = result.stdout.strip() if exists else ""
        logger.debug(f"  Command '{command}' {'found at ' + path if exists else 'NOT FOUND'}")
        return exists, path
    except Exception as e:
        logger.warning(f"  Failed to check command '{command}': {e}")
        return False, ""


def get_object_path(object_id: int) -> tuple[str, str, str]:
    """Get object name and file path from database"""
    logger.debug(f"get_object_path: Looking up object_id={object_id}")
    try:
        with get_db_cursor() as (cur, conn):
            cur.execute("""
                SELECT o.name, o.file_path, o.metadata, c.slug
                FROM objects o
                JOIN categories c ON o.category_id = c.id
                WHERE o.id = %s
            """, (object_id,))

            result = cur.fetchone()
            if not result:
                logger.warning(f"get_object_path: Object {object_id} not found in database")
                raise HTTPException(status_code=404, detail=f"Object {object_id} not found")

            # Check if metadata contains folder_path, use it if available
            file_path = result['file_path']
            metadata = result.get('metadata')
            if metadata:
                if isinstance(metadata, str):
                    import json
                    try:
                        metadata = json.loads(metadata)
                    except:
                        metadata = {}

                if isinstance(metadata, dict) and metadata.get('folder_path'):
                    # Use folder_path from metadata if it exists
                    folder_path = metadata['folder_path']
                    logger.debug(f"get_object_path: Using folder_path from metadata: {folder_path}")
                    # Return folder_path as-is (it's already absolute)
                    return (result['name'], folder_path, result['slug'])

            logger.debug(f"get_object_path: Found object - name={result['name']}, path={result['file_path']}, slug={result['slug']}")
            return (result['name'], result['file_path'], result['slug'])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"get_object_path: Database error for object_id={object_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


def get_full_path(file_path: str) -> str:
    """Convert relative file path to absolute path, or return absolute path as-is"""
    logger.debug(f"get_full_path: Converting path={file_path}")

    # Check if path is already absolute
    if os.path.isabs(file_path):
        full_path = Path(file_path)
        logger.debug(f"get_full_path: Path is already absolute: {full_path}")
    else:
        # Relative path - prepend base path
        base_path = Path("/opt/kms")
        full_path = base_path / file_path
        logger.debug(f"get_full_path: Converted relative path to: {full_path}")

    if not full_path.exists():
        logger.error(f"get_full_path: Path does not exist: {full_path}")
        logger.debug(f"get_full_path: Checking if parent exists: {full_path.parent.exists()}")
        logger.debug(f"get_full_path: Listing parent directory: {list(full_path.parent.iterdir()) if full_path.parent.exists() else 'parent does not exist'}")
        raise HTTPException(
            status_code=404,
            detail=f"Project path does not exist: {full_path}"
        )

    logger.info(f"get_full_path: Valid path found: {full_path}")
    return str(full_path)


# Log environment on module load
log_environment()
