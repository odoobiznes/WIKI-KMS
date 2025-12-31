"""
KMS Tools - Editor endpoints (VS Code, Windsurf, Cursor)
"""

from fastapi import APIRouter, HTTPException
from pathlib import Path
import os
import subprocess
import time
import logging

from .tools_base import (
    ToolOpenRequest, ToolOpenResponse,
    get_object_path, get_full_path,
    check_port_open, check_url_accessible, check_command_exists
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/vscode/open", response_model=ToolOpenResponse)
def open_vscode(request: ToolOpenRequest):
    """
    Open VS Code (code-server) for a project
    """
    logger.info(f"💻 VS CODE OPEN REQUEST: object_id={request.object_id}, folder={request.folder}")

    try:
        # Check if code-server service is running
        port_open = check_port_open("localhost", 8443)
        logger.info(f"  code-server port 8443: {'AVAILABLE' if port_open else 'NOT AVAILABLE'}")

        name, file_path, category_slug = get_object_path(request.object_id)
        full_path = get_full_path(file_path)

        if request.folder:
            full_path = str(Path(full_path) / request.folder)

        vscode_url = f"https://kms.it-enterprise.solutions/tools/vscode/?folder={full_path}"

        accessible, status, msg = check_url_accessible(vscode_url)
        logger.info(f"  VSCode URL accessibility: {msg} (status={status})")

        response = ToolOpenResponse(
            url=vscode_url,
            tool_name="VS Code",
            project_name=name,
            project_path=full_path
        )

        logger.info(f"✓ VS Code opened successfully for '{name}' at {full_path}")
        return response
    except Exception as e:
        logger.error(f"✗ VS Code open failed: {type(e).__name__}: {str(e)}", exc_info=True)
        raise


@router.post("/windsurf/open", response_model=ToolOpenResponse)
def open_windsurf(request: ToolOpenRequest):
    """
    Open Windsurf Editor for a project
    """
    logger.info(f"🌊 WINDSURF OPEN REQUEST: object_id={request.object_id}, folder={request.folder}")

    try:
        exists, windsurf_path = check_command_exists("windsurf")
        logger.info(f"  Windsurf command: {'FOUND at ' + windsurf_path if exists else 'NOT FOUND'}")

        if not exists:
            raise HTTPException(status_code=503, detail="Windsurf editor is not installed")

        name, file_path, category_slug = get_object_path(request.object_id)
        full_path = get_full_path(file_path)

        if request.folder:
            full_path = str(Path(full_path) / request.folder)

        # Setup environment for GUI application
        env = os.environ.copy()
        display = ":10"
        xdg_runtime_dir = "/run/user/1000"

        if os.path.exists("/tmp/.X11-unix/X10"):
            display = ":10"
        elif os.path.exists("/tmp/.X11-unix/X0"):
            display = ":0"

        env["DISPLAY"] = display
        env["XDG_RUNTIME_DIR"] = xdg_runtime_dir

        try:
            result = subprocess.Popen(
                [windsurf_path, full_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=env,
                start_new_session=True
            )
            logger.info(f"  Windsurf launched successfully (PID: {result.pid})")

            time.sleep(0.5)
            poll_result = result.poll()
            if poll_result is not None:
                stderr_output = result.stderr.read().decode('utf-8', errors='replace')
                logger.error(f"  Windsurf process exited immediately with code {poll_result}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Windsurf crashed immediately (exit code {poll_result})"
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"  Failed to launch Windsurf: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to launch Windsurf: {str(e)}")

        response = ToolOpenResponse(
            url=f"windsurf://open?path={full_path}",
            tool_name="Windsurf Editor",
            project_name=name,
            project_path=full_path
        )

        logger.info(f"✓ Windsurf opened successfully for '{name}' at {full_path}")
        return response
    except Exception as e:
        logger.error(f"✗ Windsurf open failed: {type(e).__name__}: {str(e)}", exc_info=True)
        raise


@router.post("/cursor/open", response_model=ToolOpenResponse)
def open_cursor(request: ToolOpenRequest):
    """
    Open Cursor Editor for a project
    """
    logger.info(f"🎯 CURSOR OPEN REQUEST: object_id={request.object_id}, folder={request.folder}")

    try:
        exists, cursor_path = check_command_exists("cursor")
        logger.info(f"  Cursor command: {'FOUND at ' + cursor_path if exists else 'NOT FOUND'}")

        if not exists:
            raise HTTPException(status_code=503, detail="Cursor editor is not installed")

        name, file_path, category_slug = get_object_path(request.object_id)
        full_path = get_full_path(file_path)

        if request.folder:
            full_path = str(Path(full_path) / request.folder)

        # Setup environment for GUI application
        env = os.environ.copy()
        display = ":10"
        xdg_runtime_dir = "/run/user/1000"

        if os.path.exists("/tmp/.X11-unix/X10"):
            display = ":10"
        elif os.path.exists("/tmp/.X11-unix/X0"):
            display = ":0"

        env["DISPLAY"] = display
        env["XDG_RUNTIME_DIR"] = xdg_runtime_dir

        try:
            result = subprocess.Popen(
                [cursor_path, full_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=env,
                start_new_session=True
            )
            logger.info(f"  Cursor launched successfully (PID: {result.pid})")

            time.sleep(0.5)
            poll_result = result.poll()
            if poll_result is not None:
                stderr_output = result.stderr.read().decode('utf-8', errors='replace')
                logger.error(f"  Cursor process exited immediately with code {poll_result}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Cursor crashed immediately (exit code {poll_result})"
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"  Failed to launch Cursor: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to launch Cursor: {str(e)}")

        response = ToolOpenResponse(
            url=f"cursor://open?path={full_path}",
            tool_name="Cursor Editor",
            project_name=name,
            project_path=full_path
        )

        logger.info(f"✓ Cursor opened successfully for '{name}' at {full_path}")
        return response
    except Exception as e:
        logger.error(f"✗ Cursor open failed: {type(e).__name__}: {str(e)}", exc_info=True)
        raise

