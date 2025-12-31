"""
KMS Tools - Import endpoints
"""

from fastapi import APIRouter, HTTPException, Form, File, UploadFile
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path
import os
import subprocess
import shutil
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class ImportRequest(BaseModel):
    source_type: str  # "folder", "sftp", "github", "gitlab", "git", "network_drive", "smb", "nfs"
    source_path: str
    target_path: str
    github_repo: Optional[str] = None
    github_branch: Optional[str] = None
    gitlab_repo: Optional[str] = None
    gitlab_branch: Optional[str] = None
    gitlab_token: Optional[str] = None
    git_url: Optional[str] = None
    sftp_host: Optional[str] = None
    sftp_port: Optional[int] = None
    sftp_user: Optional[str] = None
    sftp_password: Optional[str] = None
    sftp_path: Optional[str] = None
    network_drive_path: Optional[str] = None
    network_drive_user: Optional[str] = None
    network_drive_password: Optional[str] = None
    smb_share: Optional[str] = None
    smb_user: Optional[str] = None
    smb_password: Optional[str] = None
    nfs_path: Optional[str] = None


@router.post("/import/upload")
async def import_upload_files(
    target_path: str = Form(...),
    files: List[UploadFile] = File(...)
):
    """
    Upload files from local computer (browser) to server
    """
    try:
        logger.info(f"Upload import request: {len(files)} files -> {target_path}")

        target_dir = Path(target_path).resolve()

        # Ensure target directory exists
        if not target_dir.exists():
            try:
                target_dir.mkdir(parents=True, exist_ok=True)
            except PermissionError:
                logger.info(f"Permission denied, creating directory with sudo: {target_dir}")
                result = subprocess.run(
                    ['sudo', 'mkdir', '-p', str(target_dir)],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                if result.returncode != 0:
                    raise HTTPException(status_code=500, detail=f"Failed to create target directory: {result.stderr}")

        if not target_dir.is_dir():
            raise HTTPException(status_code=400, detail=f"Target path is not a directory: {target_dir}")

        uploaded_files = []
        total_size = 0

        for file in files:
            file_path = file.filename

            # Normalize path separators
            if '/' in file_path or '\\' in file_path:
                file_path = file_path.replace('\\', '/')
                if file_path.startswith('/'):
                    file_path = file_path[1:]

            # Create full target path
            target_file = target_dir / file_path

            # Ensure parent directory exists
            try:
                target_file.parent.mkdir(parents=True, exist_ok=True)
            except PermissionError:
                subprocess.run(
                    ['sudo', 'mkdir', '-p', str(target_file.parent)],
                    capture_output=True,
                    text=True,
                    timeout=10
                )

            # Read file content
            content = await file.read()
            file_size = len(content)
            total_size += file_size

            # Write file
            try:
                with open(target_file, 'wb') as f:
                    f.write(content)
            except PermissionError:
                import tempfile
                with tempfile.NamedTemporaryFile(delete=False) as tmp:
                    tmp.write(content)
                    tmp_path = tmp.name

                result = subprocess.run(
                    ['sudo', 'cp', tmp_path, str(target_file)],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                os.unlink(tmp_path)

                if result.returncode != 0:
                    raise HTTPException(status_code=500, detail=f"Failed to write file: {result.stderr}")

            uploaded_files.append({
                "path": str(target_file),
                "size": file_size
            })

            logger.debug(f"Uploaded: {file_path} -> {target_file} ({file_size} bytes)")

        logger.info(f"Successfully uploaded {len(uploaded_files)} files ({total_size} bytes total)")

        return {
            "success": True,
            "message": f"Uploaded {len(uploaded_files)} files to {target_path}",
            "files_count": len(uploaded_files),
            "total_size": total_size,
            "files": uploaded_files
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading files: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error uploading files: {str(e)}")


@router.post("/import")
def import_project(request: ImportRequest):
    """
    Import project from various sources (folder, SFTP, GitHub, GitLab, Git)
    """
    try:
        logger.info(f"Import request: {request.source_type} -> {request.target_path}")

        target_path = Path(request.target_path).resolve()

        # Ensure target directory exists
        if not target_path.exists():
            target_path.mkdir(parents=True, exist_ok=True)

        if not target_path.is_dir():
            raise HTTPException(status_code=400, detail=f"Target path is not a directory: {target_path}")

        if request.source_type == "folder":
            source_path = Path(request.source_path).resolve()
            if not source_path.exists():
                raise HTTPException(status_code=404, detail=f"Source path does not exist: {source_path}")

            if source_path.is_dir():
                for item in source_path.iterdir():
                    dest = target_path / item.name
                    if item.is_dir():
                        shutil.copytree(item, dest, dirs_exist_ok=True)
                    else:
                        shutil.copy2(item, dest)
            else:
                shutil.copy2(source_path, target_path / source_path.name)

            return {"success": True, "message": f"Imported from {source_path} to {target_path}"}

        elif request.source_type in ["github", "gitlab", "git"]:
            repo_url = None
            if request.source_type == "github":
                repo_url = f"https://github.com/{request.github_repo}.git"
                branch = request.github_branch or "main"
            elif request.source_type == "gitlab":
                if request.gitlab_repo.startswith("http"):
                    repo_url = request.gitlab_repo
                else:
                    repo_url = f"https://gitlab.com/{request.gitlab_repo}.git"
                branch = request.gitlab_branch or "main"
                if request.gitlab_token:
                    repo_url = repo_url.replace("://", f"://oauth2:{request.gitlab_token}@")
            else:
                repo_url = request.git_url
                branch = "main"

            if not repo_url:
                raise HTTPException(status_code=400, detail="Repository URL is required")

            clone_cmd = ["git", "clone", "-b", branch, repo_url, str(target_path)]
            result = subprocess.run(clone_cmd, capture_output=True, text=True, timeout=300)

            if result.returncode != 0:
                raise HTTPException(status_code=500, detail=f"Git clone failed: {result.stderr}")

            return {"success": True, "message": f"Cloned {repo_url} to {target_path}"}

        elif request.source_type in ["network_drive", "smb"]:
            source_path = request.network_drive_path or request.smb_share
            if not source_path:
                raise HTTPException(status_code=400, detail="Network drive path is required")

            mount_point = Path("/tmp/kms_network_mount") / Path(source_path).name
            mount_point.mkdir(parents=True, exist_ok=True)

            try:
                mount_cmd = ["sudo", "mount", "-t", "cifs", source_path, str(mount_point)]
                if request.smb_user or request.network_drive_user:
                    user = request.smb_user or request.network_drive_user
                    password = request.smb_password or request.network_drive_password
                    mount_cmd.extend(["-o", f"username={user},password={password}"])

                mount_result = subprocess.run(mount_cmd, capture_output=True, text=True, timeout=30)

                if mount_result.returncode != 0:
                    raise HTTPException(status_code=500, detail=f"Failed to mount network drive: {mount_result.stderr}")

                source_dir = mount_point
                if request.source_path and request.source_path != source_path:
                    source_dir = mount_point / request.source_path.lstrip("/")

                if source_dir.exists() and source_dir.is_dir():
                    for item in source_dir.iterdir():
                        dest = target_path / item.name
                        if item.is_dir():
                            shutil.copytree(item, dest, dirs_exist_ok=True)
                        else:
                            shutil.copy2(item, dest)
                else:
                    raise HTTPException(status_code=404, detail=f"Source path does not exist: {source_dir}")
            finally:
                try:
                    subprocess.run(["sudo", "umount", str(mount_point)], timeout=10)
                except:
                    pass

            return {"success": True, "message": f"Imported from network drive {source_path} to {target_path}"}

        elif request.source_type == "nfs":
            if not request.nfs_path:
                raise HTTPException(status_code=400, detail="NFS path is required (format: server:/path)")

            mount_point = Path("/tmp/kms_nfs_mount") / Path(request.nfs_path.split(":")[-1]).name
            mount_point.mkdir(parents=True, exist_ok=True)

            try:
                mount_result = subprocess.run(
                    ["sudo", "mount", "-t", "nfs", request.nfs_path, str(mount_point)],
                    capture_output=True,
                    text=True,
                    timeout=30
                )

                if mount_result.returncode != 0:
                    raise HTTPException(status_code=500, detail=f"Failed to mount NFS: {mount_result.stderr}")

                source_dir = mount_point
                if request.source_path:
                    source_dir = mount_point / request.source_path.lstrip("/")

                if source_dir.exists() and source_dir.is_dir():
                    for item in source_dir.iterdir():
                        dest = target_path / item.name
                        if item.is_dir():
                            shutil.copytree(item, dest, dirs_exist_ok=True)
                        else:
                            shutil.copy2(item, dest)
                else:
                    raise HTTPException(status_code=404, detail=f"Source path does not exist: {source_dir}")
            finally:
                try:
                    subprocess.run(["sudo", "umount", str(mount_point)], timeout=10)
                except:
                    pass

            return {"success": True, "message": f"Imported from NFS {request.nfs_path} to {target_path}"}

        elif request.source_type == "sftp":
            try:
                import paramiko
            except ImportError:
                raise HTTPException(status_code=503, detail="SFTP support requires paramiko library")

            transport = paramiko.Transport((request.sftp_host, request.sftp_port or 22))
            transport.connect(username=request.sftp_user, password=request.sftp_password)
            sftp = paramiko.SFTPClient.from_transport(transport)

            try:
                def download_dir(remote_path, local_path):
                    for item in sftp.listdir_attr(remote_path):
                        remote_item = f"{remote_path}/{item.filename}"
                        local_item = local_path / item.filename

                        if item.st_mode & 0o040000:
                            local_item.mkdir(exist_ok=True)
                            download_dir(remote_item, local_item)
                        else:
                            sftp.get(remote_item, str(local_item))

                download_dir(request.sftp_path, target_path)
            finally:
                sftp.close()
                transport.close()

            return {"success": True, "message": f"Imported from SFTP {request.sftp_host}{request.sftp_path} to {target_path}"}

        else:
            raise HTTPException(status_code=400, detail=f"Unknown source type: {request.source_type}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing project: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error importing project: {str(e)}")

