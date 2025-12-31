"""
KMS Tools - Git operations endpoints
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
import os
import subprocess
import logging

from .tools_base import get_object_path, get_full_path

logger = logging.getLogger(__name__)
router = APIRouter()


class GitOperationRequest(BaseModel):
    object_id: int
    operation: str  # "pull", "push", "commit", "status"
    message: Optional[str] = None  # For commit
    branch: Optional[str] = None  # For push/pull
    remote: Optional[str] = None  # Remote name (default: origin)


@router.post("/git/operation")
def git_operation(request: GitOperationRequest):
    """
    Perform Git operations (pull, push, commit, status)
    """
    try:
        logger.info(f"Git operation: {request.operation} for object_id={request.object_id}")

        # Get project path
        name, file_path, category_slug = get_object_path(request.object_id)
        full_path = get_full_path(file_path)

        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail=f"Project path does not exist: {full_path}")

        # Check if it's a git repository, if not initialize it
        git_dir = Path(full_path) / ".git"
        if not git_dir.exists():
            logger.info(f"Initializing Git repository in {full_path}")
            init_result = subprocess.run(
                ["git", "-C", str(full_path), "init"],
                capture_output=True,
                text=True,
                timeout=30
            )
            if init_result.returncode != 0:
                raise HTTPException(status_code=500, detail=f"Failed to initialize Git repository: {init_result.stderr}")

            # Create initial commit
            add_result = subprocess.run(
                ["git", "-C", str(full_path), "add", "."],
                capture_output=True,
                text=True,
                timeout=60
            )
            if add_result.returncode == 0:
                subprocess.run(
                    ["git", "-C", str(full_path), "commit", "-m", "Initial commit"],
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                logger.info(f"Git repository initialized and initial commit created")

        result = None
        output = ""
        error = ""

        if request.operation == "status":
            result = subprocess.run(
                ["git", "-C", str(full_path), "status", "--porcelain", "-b"],
                capture_output=True,
                text=True,
                timeout=30
            )
            output = result.stdout
            error = result.stderr

        elif request.operation == "pull":
            branch = request.branch or "main"
            remote = request.remote or "origin"
            result = subprocess.run(
                ["git", "-C", str(full_path), "pull", remote, branch],
                capture_output=True,
                text=True,
                timeout=300
            )
            output = result.stdout
            error = result.stderr

        elif request.operation == "push":
            branch = request.branch or "main"
            remote = request.remote or "origin"
            result = subprocess.run(
                ["git", "-C", str(full_path), "push", remote, branch],
                capture_output=True,
                text=True,
                timeout=300
            )
            output = result.stdout
            error = result.stderr

        elif request.operation == "commit":
            if not request.message:
                raise HTTPException(status_code=400, detail="Commit message is required")

            # First add all changes
            add_result = subprocess.run(
                ["git", "-C", str(full_path), "add", "-A"],
                capture_output=True,
                text=True,
                timeout=60
            )

            if add_result.returncode != 0:
                raise HTTPException(status_code=500, detail=f"Git add failed: {add_result.stderr}")

            # Then commit
            result = subprocess.run(
                ["git", "-C", str(full_path), "commit", "-m", request.message],
                capture_output=True,
                text=True,
                timeout=60
            )
            output = result.stdout
            error = result.stderr

        else:
            raise HTTPException(status_code=400, detail=f"Unknown Git operation: {request.operation}")

        if result and result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Git {request.operation} failed: {error or output}")

        return {
            "success": True,
            "operation": request.operation,
            "output": output,
            "message": f"Git {request.operation} completed successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error performing Git operation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error performing Git operation: {str(e)}")

