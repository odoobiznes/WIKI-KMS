"""
KMS Tools - Export and Sync endpoints
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
import os
import subprocess
import shutil
import zipfile
import tempfile
from datetime import datetime
import logging

from .tools_base import get_object_path, get_full_path

logger = logging.getLogger(__name__)
router = APIRouter()


class ExportRequest(BaseModel):
    object_id: int
    source_path: str
    local_folder: str
    github_private: bool = True
    github_public: bool = True


class SynchRequest(BaseModel):
    object_id: int
    server_path: str
    local_folder: str
    github_private: bool = True
    github_public: bool = True


def create_backup_and_commit_push(full_path: str, github_private: bool, github_public: bool):
    """
    Helper function to create backup, commit and push to selected GitHub repositories
    """
    try:
        # 1. Create backup
        backup_dir = Path(full_path).parent / f".backups"
        backup_dir.mkdir(exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{Path(full_path).name}_backup_{timestamp}"
        backup_path = backup_dir / backup_name

        logger.info(f"Creating backup: {backup_path}")
        shutil.copytree(full_path, backup_path, ignore=shutil.ignore_patterns('.git', '.backups', '__pycache__', '*.pyc'))
        logger.info(f"Backup created: {backup_path}")

        # 2. Check if it's a git repository
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
                logger.warning(f"Failed to initialize Git repository: {init_result.stderr}")
                return {"backup_created": True, "git_operations": False, "git_initialized": False}

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

        # 3. Add all changes
        add_result = subprocess.run(
            ["git", "-C", str(full_path), "add", "-A"],
            capture_output=True,
            text=True,
            timeout=60
        )
        if add_result.returncode != 0:
            logger.warning(f"Git add failed: {add_result.stderr}")
            return {"backup_created": True, "git_operations": False}

        # 4. Commit
        commit_message = f"Auto backup and sync - {timestamp}"
        commit_result = subprocess.run(
            ["git", "-C", str(full_path), "commit", "-m", commit_message],
            capture_output=True,
            text=True,
            timeout=60
        )
        if commit_result.returncode != 0:
            logger.warning(f"Git commit failed (may be no changes): {commit_result.stderr}")

        # 5. Push to selected remotes
        pushed_remotes = []
        if github_private:
            try:
                push_result = subprocess.run(
                    ["git", "-C", str(full_path), "push", "odooobiznes", "main"],
                    capture_output=True,
                    text=True,
                    timeout=300
                )
                if push_result.returncode == 0:
                    pushed_remotes.append("odooobiznes (private)")
                else:
                    logger.warning(f"Push to odooobiznes failed: {push_result.stderr}")
            except Exception as e:
                logger.warning(f"Error pushing to odooobiznes: {e}")

        if github_public:
            try:
                push_result = subprocess.run(
                    ["git", "-C", str(full_path), "push", "it-enterpr", "main"],
                    capture_output=True,
                    text=True,
                    timeout=300
                )
                if push_result.returncode == 0:
                    pushed_remotes.append("it-enterpr (public)")
                else:
                    logger.warning(f"Push to it-enterpr failed: {push_result.stderr}")
            except Exception as e:
                logger.warning(f"Error pushing to it-enterpr: {e}")

        return {
            "backup_created": True,
            "backup_path": str(backup_path),
            "git_operations": True,
            "committed": commit_result.returncode == 0,
            "pushed_remotes": pushed_remotes
        }

    except Exception as e:
        logger.error(f"Error in backup/commit/push: {e}", exc_info=True)
        return {"backup_created": False, "error": str(e)}


@router.post("/export")
def export_project(request: ExportRequest):
    """
    Export project from server to local computer
    """
    try:
        logger.info(f"Export request: object_id={request.object_id}, source_path={request.source_path}")

        # Get project path
        name, file_path, category_slug = get_object_path(request.object_id)
        full_path = get_full_path(request.source_path)

        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail=f"Source path does not exist: {full_path}")

        # 1. Create backup, commit and push
        backup_result = create_backup_and_commit_push(
            full_path,
            request.github_private,
            request.github_public
        )
        logger.info(f"Backup/commit/push result: {backup_result}")

        # 2. Create zip archive
        temp_dir = tempfile.mkdtemp()
        zip_filename = f"{Path(full_path).name}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        zip_path = Path(temp_dir) / zip_filename

        logger.info(f"Creating zip archive: {zip_path}")
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(full_path):
                # Skip .git and .backups
                dirs[:] = [d for d in dirs if d not in ['.git', '.backups', '__pycache__']]
                for file in files:
                    if file.endswith('.pyc'):
                        continue
                    file_path = Path(root) / file
                    arcname = file_path.relative_to(full_path)
                    zipf.write(file_path, arcname)

        logger.info(f"Zip archive created: {zip_path}")

        # Return file for download
        return FileResponse(
            str(zip_path),
            media_type="application/zip",
            filename=zip_filename,
            headers={"Content-Disposition": f'attachment; filename="{zip_filename}"'}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error exporting project: {str(e)}")


@router.post("/synch")
def synch_project(request: SynchRequest):
    """
    Synchronize project between server and local computer
    """
    try:
        logger.info(f"Synch request: object_id={request.object_id}, server_path={request.server_path}")

        # Get project path
        name, file_path, category_slug = get_object_path(request.object_id)
        full_path = get_full_path(request.server_path)

        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail=f"Server path does not exist: {full_path}")

        # 1. Create backup, commit and push
        backup_result = create_backup_and_commit_push(
            full_path,
            request.github_private,
            request.github_public
        )
        logger.info(f"Backup/commit/push result: {backup_result}")

        # 2. Return sync info
        return {
            "success": True,
            "message": "Backup, commit and push completed. Use file browser to manually sync files.",
            "backup_result": backup_result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error synchronizing project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error synchronizing project: {str(e)}")

