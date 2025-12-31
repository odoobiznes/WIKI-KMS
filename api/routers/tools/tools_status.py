"""
KMS Tools - Status endpoint
"""

from fastapi import APIRouter
import subprocess
import logging

from .tools_base import check_port_open, check_command_exists

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/status")
def get_tools_status():
    """Get status of all integrated tools"""
    logger.info("📊 TOOLS STATUS REQUEST")

    def check_service(service_name: str) -> dict:
        logger.debug(f"Checking service: {service_name}")
        try:
            result = subprocess.run(
                ["systemctl", "is-active", service_name],
                capture_output=True,
                text=True,
                timeout=5
            )
            is_active = result.stdout.strip() == "active"
            status = "running" if is_active else "stopped"
            logger.debug(f"Service {service_name}: {status}")
            return {"service": service_name, "status": status}
        except Exception as e:
            logger.warning(f"Failed to check service {service_name}: {e}")
            return {"service": service_name, "status": "unknown"}

    def check_editor_installed(command: str, editor_name: str) -> dict:
        logger.debug(f"Checking if {editor_name} is installed...")
        exists, path = check_command_exists(command)
        status = {
            "installed": exists,
            "path": path if exists else None,
            "status": "available" if exists else "not installed"
        }
        logger.debug(f"{editor_name}: {status}")
        return status

    # Check port availability
    port_7681 = check_port_open("localhost", 7681)
    port_8082 = check_port_open("localhost", 8082)
    port_8443 = check_port_open("localhost", 8443)
    logger.info(f"  Ports: ttyd(7681)={'OPEN' if port_7681 else 'CLOSED'}, filebrowser(8082)={'OPEN' if port_8082 else 'CLOSED'}, code-server(8443)={'OPEN' if port_8443 else 'CLOSED'}")

    tools_status = {
        "tools": [
            {
                "name": "Web Terminal",
                "service": check_service("kms-tools-ttyd"),
                "port": 7681,
                "port_open": port_7681,
                "url": "/tools/terminal/",
                "type": "web"
            },
            {
                "name": "File Browser",
                "service": check_service("kms-tools-filebrowser"),
                "port": 8082,
                "port_open": port_8082,
                "url": "/tools/files/",
                "type": "web"
            },
            {
                "name": "VS Code (code-server)",
                "service": check_service("kms-tools-code-server"),
                "port": 8443,
                "port_open": port_8443,
                "url": "/tools/vscode/",
                "type": "web"
            },
            {
                "name": "Windsurf Editor",
                "editor": check_editor_installed("windsurf", "Windsurf"),
                "port": None,
                "url": "/api/tools/windsurf/open",
                "type": "desktop"
            },
            {
                "name": "Cursor Editor",
                "editor": check_editor_installed("cursor", "Cursor"),
                "port": None,
                "url": "/api/tools/cursor/open",
                "type": "desktop"
            },
            {
                "name": "Zed Editor",
                "editor": check_editor_installed("zed", "Zed"),
                "port": None,
                "url": "/api/tools/zed/open",
                "type": "desktop"
            },
            {
                "name": "Claude AI",
                "service": {"service": "claude-api", "status": "api-based"},
                "port": None,
                "url": "/api/tools/claude/chat",
                "type": "api"
            }
        ]
    }

    logger.info("✓ Tools status check completed")
    return tools_status

