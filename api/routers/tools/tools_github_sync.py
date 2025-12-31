"""
KMS Tools - GitHub Dual Sync endpoints
Synchronizes projects to both odoobiznes (private) and client (public) GitHub repositories
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path
import os
import subprocess
import logging

from .tools_base import get_object_path, get_full_path

logger = logging.getLogger(__name__)
router = APIRouter()


# GitHub configuration
GITHUB_PRIVATE_REMOTE = "odooobiznes"  # Private GitHub (odoobiznes)
GITHUB_PUBLIC_REMOTE = "it-enterpr"    # Public GitHub (it-enterpr)
GITHUB_USER_EMAIL = "dev@it-enterprise.cz"
GITHUB_USER_NAME = "it-enterpr"


class GitHubSyncRequest(BaseModel):
    object_id: int
    sync_to_private: bool = True       # Sync to odoobiznes (private)
    sync_to_public: bool = True        # Sync to it-enterpr (public)
    client_remote_url: Optional[str] = None  # Optional client's GitHub URL
    commit_message: Optional[str] = None
    branch: str = "main"


class GitHubRemoteConfig(BaseModel):
    remote_name: str
    remote_url: str
    is_private: bool = False


class GitHubSyncResponse(BaseModel):
    success: bool
    message: str
    results: dict


def run_git_command(project_path: str, args: list, timeout: int = 300) -> tuple[bool, str, str]:
    """Run a git command in the project directory"""
    try:
        result = subprocess.run(
            ["git", "-C", project_path] + args,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Command timed out"
    except Exception as e:
        return False, "", str(e)


def ensure_git_repo(project_path: str) -> tuple[bool, str]:
    """Ensure the project is a git repository"""
    git_dir = Path(project_path) / ".git"
    
    if not git_dir.exists():
        logger.info(f"Initializing git repository in {project_path}")
        success, stdout, stderr = run_git_command(project_path, ["init"])
        if not success:
            return False, f"Failed to initialize git: {stderr}"
        
        # Configure user
        run_git_command(project_path, ["config", "user.email", GITHUB_USER_EMAIL])
        run_git_command(project_path, ["config", "user.name", GITHUB_USER_NAME])
        
        # Initial commit
        run_git_command(project_path, ["add", "."])
        run_git_command(project_path, ["commit", "-m", "Initial commit"])
        
        return True, "Git repository initialized"
    
    return True, "Git repository exists"


def configure_remote(project_path: str, remote_name: str, remote_url: str) -> tuple[bool, str]:
    """Configure a git remote"""
    # Check if remote exists
    success, stdout, stderr = run_git_command(project_path, ["remote", "get-url", remote_name])
    
    if success:
        # Remote exists, update URL
        success, stdout, stderr = run_git_command(project_path, ["remote", "set-url", remote_name, remote_url])
        return success, f"Updated remote {remote_name}" if success else f"Failed to update remote: {stderr}"
    else:
        # Remote doesn't exist, add it
        success, stdout, stderr = run_git_command(project_path, ["remote", "add", remote_name, remote_url])
        return success, f"Added remote {remote_name}" if success else f"Failed to add remote: {stderr}"


def sync_to_remote(project_path: str, remote_name: str, branch: str = "main") -> tuple[bool, str]:
    """Sync (push) to a remote repository"""
    logger.info(f"Syncing to {remote_name}/{branch}")
    
    # Try to push
    success, stdout, stderr = run_git_command(project_path, ["push", "-u", remote_name, branch])
    
    if not success:
        # If push fails, try to set upstream and push again
        logger.warning(f"Push failed, trying with force: {stderr}")
        success, stdout, stderr = run_git_command(
            project_path, 
            ["push", "--set-upstream", remote_name, branch, "--force"]
        )
    
    return success, stdout if success else stderr


@router.post("/github/sync", response_model=GitHubSyncResponse)
def github_sync(request: GitHubSyncRequest):
    """
    Synchronize project to GitHub repositories
    
    This endpoint:
    1. Ensures the project is a git repository
    2. Commits any uncommitted changes
    3. Pushes to odoobiznes (private) if requested
    4. Pushes to it-enterpr (public) if requested
    5. Pushes to client's remote if provided
    """
    logger.info(f"GitHub sync request for object_id={request.object_id}")
    
    try:
        # Get project path
        name, file_path, category_slug = get_object_path(request.object_id)
        full_path = get_full_path(file_path)
        
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail=f"Project path does not exist: {full_path}")
        
        results = {
            "git_init": None,
            "commit": None,
            "private_sync": None,
            "public_sync": None,
            "client_sync": None
        }
        
        # 1. Ensure git repository
        success, msg = ensure_git_repo(full_path)
        results["git_init"] = {"success": success, "message": msg}
        if not success:
            raise HTTPException(status_code=500, detail=f"Git initialization failed: {msg}")
        
        # 2. Add and commit changes
        run_git_command(full_path, ["add", "-A"])
        commit_msg = request.commit_message or f"Auto sync - {name}"
        success, stdout, stderr = run_git_command(full_path, ["commit", "-m", commit_msg])
        
        if success:
            results["commit"] = {"success": True, "message": "Changes committed"}
        else:
            # No changes to commit is not an error
            if "nothing to commit" in stderr or "nothing to commit" in stdout:
                results["commit"] = {"success": True, "message": "No changes to commit"}
            else:
                results["commit"] = {"success": False, "message": stderr}
        
        # 3. Sync to private GitHub (odoobiznes)
        if request.sync_to_private:
            private_url = f"git@github.com:odoobiznes/{name}.git"
            configure_remote(full_path, GITHUB_PRIVATE_REMOTE, private_url)
            success, msg = sync_to_remote(full_path, GITHUB_PRIVATE_REMOTE, request.branch)
            results["private_sync"] = {
                "success": success,
                "remote": GITHUB_PRIVATE_REMOTE,
                "url": private_url,
                "message": msg
            }
        
        # 4. Sync to public GitHub (it-enterpr)
        if request.sync_to_public:
            public_url = f"git@github.com:it-enterpr/{name}.git"
            configure_remote(full_path, GITHUB_PUBLIC_REMOTE, public_url)
            success, msg = sync_to_remote(full_path, GITHUB_PUBLIC_REMOTE, request.branch)
            results["public_sync"] = {
                "success": success,
                "remote": GITHUB_PUBLIC_REMOTE,
                "url": public_url,
                "message": msg
            }
        
        # 5. Sync to client's remote if provided
        if request.client_remote_url:
            client_remote_name = "client"
            configure_remote(full_path, client_remote_name, request.client_remote_url)
            success, msg = sync_to_remote(full_path, client_remote_name, request.branch)
            results["client_sync"] = {
                "success": success,
                "remote": client_remote_name,
                "url": request.client_remote_url,
                "message": msg
            }
        
        # Determine overall success
        sync_results = [
            results.get("private_sync", {}).get("success", True),
            results.get("public_sync", {}).get("success", True),
            results.get("client_sync", {}).get("success", True) if request.client_remote_url else True
        ]
        overall_success = all(sync_results)
        
        return GitHubSyncResponse(
            success=overall_success,
            message="Sync completed successfully" if overall_success else "Some sync operations failed",
            results=results
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"GitHub sync error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"GitHub sync failed: {str(e)}")


@router.get("/github/remotes/{object_id}")
def get_remotes(object_id: int):
    """
    Get configured git remotes for a project
    """
    try:
        name, file_path, category_slug = get_object_path(object_id)
        full_path = get_full_path(file_path)
        
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail=f"Project path does not exist")
        
        git_dir = Path(full_path) / ".git"
        if not git_dir.exists():
            return {"remotes": [], "message": "Not a git repository"}
        
        success, stdout, stderr = run_git_command(full_path, ["remote", "-v"])
        
        if not success:
            return {"remotes": [], "message": stderr}
        
        # Parse remotes
        remotes = {}
        for line in stdout.strip().split('\n'):
            if line:
                parts = line.split()
                if len(parts) >= 2:
                    name = parts[0]
                    url = parts[1]
                    remotes[name] = url
        
        return {
            "remotes": [{"name": k, "url": v} for k, v in remotes.items()],
            "project_path": full_path
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting remotes: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/github/configure-remote")
def configure_remote_endpoint(
    object_id: int,
    remote_name: str,
    remote_url: str
):
    """
    Configure a git remote for a project
    """
    try:
        name, file_path, category_slug = get_object_path(object_id)
        full_path = get_full_path(file_path)
        
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail=f"Project path does not exist")
        
        # Ensure git repo
        ensure_git_repo(full_path)
        
        # Configure remote
        success, msg = configure_remote(full_path, remote_name, remote_url)
        
        return {
            "success": success,
            "message": msg,
            "remote_name": remote_name,
            "remote_url": remote_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error configuring remote: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/github/pull/{object_id}")
def github_pull(object_id: int, remote: str = "origin", branch: str = "main"):
    """
    Pull changes from a remote repository
    """
    try:
        name, file_path, category_slug = get_object_path(object_id)
        full_path = get_full_path(file_path)
        
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail=f"Project path does not exist")
        
        success, stdout, stderr = run_git_command(full_path, ["pull", remote, branch])
        
        return {
            "success": success,
            "message": stdout if success else stderr,
            "remote": remote,
            "branch": branch
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error pulling: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

