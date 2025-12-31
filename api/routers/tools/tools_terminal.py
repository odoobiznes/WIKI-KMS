"""
KMS Tools - Terminal endpoints
"""

from fastapi import APIRouter
from pathlib import Path
import os
import logging

from .tools_base import (
    ToolOpenRequest, ToolOpenResponse,
    get_object_path, get_full_path,
    check_port_open, check_url_accessible
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/terminal/open", response_model=ToolOpenResponse)
def open_terminal(request: ToolOpenRequest):
    """
    Open web terminal for a project

    Terminal opens in the project directory or specified subfolder.
    Credentials: devops / kms2025
    """
    logger.info(f"🖥️  TERMINAL OPEN REQUEST: object_id={request.object_id}, folder={request.folder}")

    try:
        # Check if ttyd service is running
        logger.debug("Checking ttyd service status...")
        port_open = check_port_open("localhost", 7681)
        logger.info(f"  ttyd port 7681: {'AVAILABLE' if port_open else 'NOT AVAILABLE'}")

        name, file_path, category_slug = get_object_path(request.object_id)
        logger.debug(f"Terminal: Retrieved object info - name={name}, file_path={file_path}, category={category_slug}")

        full_path = get_full_path(file_path)
        logger.debug(f"Terminal: Full path resolved - {full_path}")
        logger.debug(f"Terminal: Path exists check: {os.path.exists(full_path)}")
        logger.debug(f"Terminal: Path is directory: {os.path.isdir(full_path)}")

        # Add subfolder if specified
        if request.folder:
            full_path = str(Path(full_path) / request.folder)
            logger.debug(f"Terminal: Subfolder added - {full_path}")
            logger.debug(f"Terminal: Subfolder exists: {os.path.exists(full_path)}")

        # ttyd URL with project path
        # We'll use a wrapper that injects cd command via JavaScript
        encoded_path = full_path.replace("/", "%2F")
        terminal_url = f"https://kms.it-enterprise.solutions/terminal-wrapper.html?cd={encoded_path}"
        logger.debug(f"Terminal: Generated URL - {terminal_url} (will cd to {full_path})")

        # Verify URL is accessible
        accessible, status, msg = check_url_accessible(terminal_url)
        logger.info(f"  Terminal URL accessibility: {msg} (status={status})")

        response = ToolOpenResponse(
            url=terminal_url,
            tool_name="Web Terminal",
            project_name=name,
            project_path=full_path
        )

        logger.info(f"✓ Terminal opened successfully for '{name}' at {full_path}")
        logger.debug(f"  Response: {response.model_dump()}")
        return response
    except Exception as e:
        logger.error(f"✗ Terminal open failed: {type(e).__name__}: {str(e)}", exc_info=True)
        raise

