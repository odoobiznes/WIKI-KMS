"""
KMS Tools Router - API endpoints for integrated development tools
Provides access to:
- Web Terminal (ttyd)
- File Browser
- VS Code (code-server)
- Windsurf Editor
- Cursor Editor
- Claude AI

This package has been refactored into smaller modules for better maintainability.
"""

from fastapi import APIRouter
import logging

logger = logging.getLogger(__name__)
logger.info("=" * 80)
logger.info("Tools Router Initializing (modular version)")
logger.info("=" * 80)

# Create main router
router = APIRouter(prefix="/tools", tags=["tools"])

# Import all sub-routers
from .tools_terminal import router as terminal_router
from .tools_files import router as files_router
from .tools_git import router as git_router
from .tools_import import router as import_router
from .tools_export import router as export_router
from .tools_editors import router as editors_router
from .tools_ai import router as ai_router
from .tools_status import router as status_router
from .tools_github_sync import router as github_sync_router
from .tools_local_tunnel import router as local_tunnel_router

# Include all sub-routers
router.include_router(terminal_router)
router.include_router(files_router)
router.include_router(git_router)
router.include_router(import_router)
router.include_router(export_router)
router.include_router(editors_router)
router.include_router(ai_router)
router.include_router(status_router)
router.include_router(github_sync_router)
router.include_router(local_tunnel_router)

logger.info("Tools router initialized successfully with all sub-modules")

# Export models for external use
from .tools_base import (
    ToolOpenRequest,
    ToolOpenResponse,
    ClaudeChatRequest,
    ClaudeChatResponse,
    get_object_path,
    get_full_path,
    check_port_open,
    check_url_accessible,
    check_command_exists
)

__all__ = [
    'router',
    'ToolOpenRequest',
    'ToolOpenResponse',
    'ClaudeChatRequest',
    'ClaudeChatResponse',
    'get_object_path',
    'get_full_path',
    'check_port_open',
    'check_url_accessible',
    'check_command_exists'
]

