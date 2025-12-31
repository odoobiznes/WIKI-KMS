"""
KMS Tools - File browser and file operations endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse, Response
from pathlib import Path
import os
import subprocess
import mimetypes
import logging

from .tools_base import (
    ToolOpenRequest, ToolOpenResponse,
    get_object_path, get_full_path,
    check_port_open, check_url_accessible
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/files/open", response_model=ToolOpenResponse)
def open_file_browser(request: ToolOpenRequest):
    """
    Open file browser for a project

    Allows upload, download, preview, and basic file editing.
    """
    logger.info(f"📁 FILE BROWSER OPEN REQUEST: object_id={request.object_id}, folder={request.folder}")

    try:
        # Check if filebrowser service is running
        logger.debug("Checking filebrowser service status...")
        port_open = check_port_open("localhost", 8082)
        logger.info(f"  filebrowser port 8082: {'AVAILABLE' if port_open else 'NOT AVAILABLE'}")

        name, file_path, category_slug = get_object_path(request.object_id)
        logger.debug(f"FileBrowser: Retrieved object info - name={name}, file_path={file_path}, category={category_slug}")

        full_path = get_full_path(file_path)
        logger.debug(f"FileBrowser: Full path resolved - {full_path}")
        logger.debug(f"FileBrowser: Path exists: {os.path.exists(full_path)}")

        # Add subfolder if specified
        if request.folder:
            full_path = str(Path(full_path) / request.folder)
            logger.debug(f"FileBrowser: Subfolder added - {full_path}")
            logger.debug(f"FileBrowser: Subfolder exists: {os.path.exists(full_path)}")

        # FileBrowser URL (will be proxied through Nginx)
        # Encode path for URL
        encoded_path = file_path.replace("/", "%2F")
        files_url = f"https://kms.it-enterprise.solutions/tools/files/?path={encoded_path}"
        logger.debug(f"FileBrowser: Generated URL - {files_url}")

        # Verify URL is accessible
        accessible, status, msg = check_url_accessible(files_url)
        logger.info(f"  FileBrowser URL accessibility: {msg} (status={status})")

        response = ToolOpenResponse(
            url=files_url,
            tool_name="File Browser",
            project_name=name,
            project_path=full_path
        )

        logger.info(f"✓ File Browser opened successfully for '{name}' at {full_path}")
        logger.debug(f"  Response: {response.model_dump()}")
        return response
    except Exception as e:
        logger.error(f"✗ File Browser open failed: {type(e).__name__}: {str(e)}", exc_info=True)
        raise


@router.get("/files/list")
def list_files(
    path: str = Query(..., description="Path to folder to list"),
    allow_any: bool = Query(False, description="Allow any path (not just /opt/kms)"),
    use_sudo: bool = Query(False, description="Use sudo for file operations")
):
    """
    List files and directories in a given path
    """
    try:
        # Convert use_sudo to boolean if it's a string
        if isinstance(use_sudo, str):
            use_sudo = use_sudo.lower() in ('true', '1', 'yes', 'on')

        logger.debug(f"Listing files for path: {path}, allow_any: {allow_any}, use_sudo: {use_sudo}")

        full_path = Path(path).resolve()

        # Security: By default only allow paths within /opt/kms, unless allow_any is True
        if not allow_any and not use_sudo:
            kms_base = Path("/opt/kms").resolve()
            if not str(full_path).startswith(str(kms_base)):
                logger.warning(f"Path {full_path} is not within {kms_base}")
                raise HTTPException(status_code=403, detail=f"Path must be within /opt/kms. Got: {full_path}. Use allow_any=true to access other paths.")

        # If use_sudo is True, use sudo to list files
        if use_sudo:
            try:
                result = subprocess.run(
                    ['sudo', 'ls', '-la', str(full_path)],
                    capture_output=True,
                    text=True,
                    timeout=10
                )

                if result.returncode != 0:
                    logger.warning(f"Sudo ls failed: {result.stderr}")
                    use_sudo = False
                else:
                    # Parse ls output
                    files = []
                    lines = result.stdout.strip().split('\n')
                    for line in lines[1:]:  # Skip first line (total)
                        parts = line.split()
                        if len(parts) < 9:
                            continue
                        name = ' '.join(parts[8:])  # Handle names with spaces
                        is_dir = parts[0].startswith('d')
                        item_path = full_path / name

                        try:
                            stat_result = subprocess.run(
                                ['sudo', 'stat', '-c', '%s %Y', str(item_path)],
                                capture_output=True,
                                text=True,
                                timeout=5
                            )
                            if stat_result.returncode == 0:
                                size_str, mtime_str = stat_result.stdout.strip().split()
                                size = int(size_str) if not is_dir else None
                                mtime = float(mtime_str)
                            else:
                                size = None
                                mtime = 0

                            files.append({
                                "name": name,
                                "path": str(item_path),
                                "type": "directory" if is_dir else "file",
                                "size": size,
                                "modified": mtime
                            })
                        except Exception as e:
                            logger.debug(f"Skipping {name} due to error: {e}")
                            continue

                    files.sort(key=lambda x: (x["type"] != "directory", x["name"].lower()))
                    logger.info(f"Successfully listed {len(files)} items from {full_path} using sudo")
                    return {"files": files, "path": str(full_path)}
            except subprocess.TimeoutExpired:
                logger.warning("Sudo command timed out, falling back to regular method")
                use_sudo = False
            except Exception as e:
                logger.warning(f"Sudo failed: {e}, falling back to regular method")
                use_sudo = False

        # Regular method (without sudo)
        try:
            logger.debug(f"Resolved path: {full_path}")
            logger.debug(f"Path exists: {full_path.exists()}")
            logger.debug(f"Path is_dir: {full_path.is_dir() if full_path.exists() else 'N/A'}")

            if not full_path.exists():
                logger.warning(f"Path does not exist: {full_path}")
                raise HTTPException(status_code=404, detail=f"Path does not exist: {full_path}")

            if not full_path.is_dir():
                logger.warning(f"Path is not a directory: {full_path}")
                raise HTTPException(status_code=400, detail=f"Path must be a directory: {full_path}")

            files = []
            for item in sorted(full_path.iterdir()):
                try:
                    stat = item.stat()
                    files.append({
                        "name": item.name,
                        "path": str(item),
                        "type": "directory" if item.is_dir() else "file",
                        "size": stat.st_size if item.is_file() else None,
                        "modified": stat.st_mtime
                    })
                except (OSError, PermissionError) as e:
                    logger.debug(f"Skipping {item.name} due to access error: {e}")
                    continue

            logger.info(f"Successfully listed {len(files)} items from {full_path}")
            return {"files": files, "path": str(full_path)}
        except (OSError, PermissionError) as e:
            logger.error(f"Permission denied accessing {full_path}: {e}")
            raise HTTPException(status_code=403, detail=f"Permission denied: {e}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing files: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error listing files: {str(e)}")


@router.get("/files/download")
def download_file(
    path: str = Query(..., description="Path to file to download"),
    allow_any: bool = Query(False, description="Allow any path (not just /opt/kms)"),
    use_sudo: bool = Query(False, description="Use sudo for file operations")
):
    """
    Download or read a file from the server
    """
    try:
        logger.debug(f"Downloading file: {path}, allow_any: {allow_any}, use_sudo: {use_sudo}")

        full_path = Path(path).resolve()

        # Security check
        if not allow_any and not use_sudo:
            kms_base = Path("/opt/kms").resolve()
            if not str(full_path).startswith(str(kms_base)):
                raise HTTPException(status_code=403, detail=f"Path must be within /opt/kms.")

        # Check if file exists
        file_exists = full_path.is_file() if not use_sudo else False
        if use_sudo:
            try:
                result = subprocess.run(
                    ['sudo', 'test', '-f', str(full_path)],
                    capture_output=True,
                    timeout=5
                )
                file_exists = (result.returncode == 0)
            except Exception:
                file_exists = False

        if not file_exists:
            raise HTTPException(status_code=404, detail=f"File not found: {full_path}")

        # Determine MIME type
        mime_type, _ = mimetypes.guess_type(str(full_path))
        if not mime_type:
            mime_type = 'application/octet-stream'

        # Check if it's a text file
        text_extensions = {'.txt', '.json', '.xml', '.html', '.css', '.js', '.py', '.md', '.yml', '.yaml', '.sh', '.sql', '.log', '.conf', '.ini', '.env', '.gitignore', '.dockerfile', '.dockerignore'}
        is_text_file = full_path.suffix.lower() in text_extensions or mime_type.startswith('text/')

        if is_text_file:
            try:
                if use_sudo:
                    result = subprocess.run(
                        ['sudo', 'cat', str(full_path)],
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    if result.returncode != 0:
                        raise HTTPException(status_code=500, detail=f"Error reading file: {result.stderr}")
                    content = result.stdout
                else:
                    with open(full_path, 'r', encoding='utf-8', errors='replace') as f:
                        content = f.read()

                return Response(
                    content=content,
                    media_type=mime_type,
                    headers={"Content-Disposition": f'inline; filename="{full_path.name}"'}
                )
            except UnicodeDecodeError:
                # Handle binary
                pass

        # Binary files
        return FileResponse(
            str(full_path),
            media_type=mime_type,
            filename=full_path.name,
            headers={"Content-Disposition": f'attachment; filename="{full_path.name}"'}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")


@router.post("/files/create-folder")
def create_folder(
    path: str = Query(..., description="Path to new folder to create"),
    allow_any: bool = Query(False, description="Allow any path (not just /opt/kms)"),
    use_sudo: bool = Query(False, description="Use sudo for folder creation")
):
    """
    Create a new folder at the specified path
    """
    try:
        logger.debug(f"Creating folder: {path}, allow_any: {allow_any}, use_sudo: {use_sudo}")

        full_path = Path(path).resolve()

        # Security check
        if not allow_any:
            kms_base = Path("/opt/kms").resolve()
            if not str(full_path).startswith(str(kms_base)):
                raise HTTPException(status_code=403, detail=f"Path must be within /opt/kms.")

        # Check if folder already exists
        if full_path.exists():
            if full_path.is_dir():
                return {"path": str(full_path), "created": False, "message": "Folder already exists"}
            else:
                raise HTTPException(status_code=400, detail=f"Path exists but is not a directory")

        # Create folder
        if use_sudo:
            result = subprocess.run(
                ['sudo', 'mkdir', '-p', str(full_path)],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode != 0:
                raise HTTPException(status_code=500, detail=f"Failed to create folder: {result.stderr}")
        else:
            try:
                full_path.mkdir(parents=True, exist_ok=False)
            except PermissionError:
                # Auto-retry with sudo
                result = subprocess.run(
                    ['sudo', 'mkdir', '-p', str(full_path)],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                if result.returncode != 0:
                    raise HTTPException(status_code=500, detail=f"Failed to create folder: {result.stderr}")

        logger.info(f"Successfully created folder: {full_path}")
        return {"path": str(full_path), "created": True, "message": "Folder created successfully"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating folder: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error creating folder: {str(e)}")

