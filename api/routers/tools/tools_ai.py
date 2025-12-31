"""
KMS Tools - Claude AI endpoints
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fastapi import APIRouter
import logging

from .tools_base import (
    ClaudeChatRequest, ClaudeChatResponse,
    get_object_path, get_full_path
)
from routers.tools_claude import chat_with_claude

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/claude/chat", response_model=ClaudeChatResponse)
async def claude_chat(request: ClaudeChatRequest):
    """
    Chat with Claude AI with project context
    """
    logger.info(f"🤖 CLAUDE CHAT REQUEST: object_id={request.object_id}, include_context={request.include_context}")
    logger.debug(f"Claude: Message preview - {request.message[:100]}...")

    try:
        name, file_path, category_slug = get_object_path(request.object_id)
        full_path = get_full_path(file_path)

        logger.debug(f"Claude: Calling chat_with_claude...")
        response_text, context_files_count = await chat_with_claude(
            project_name=name,
            project_path=full_path,
            user_message=request.message,
            include_context=request.include_context
        )

        logger.info(f"✓ Claude chat completed successfully - {context_files_count} files in context")

        return ClaudeChatResponse(
            response=response_text,
            project_name=name,
            context_files_count=context_files_count
        )
    except Exception as e:
        logger.error(f"✗ Claude chat failed: {type(e).__name__}: {str(e)}", exc_info=True)
        raise


@router.get("/claude/models")
def list_claude_models():
    """List available Claude models"""
    return {
        "models": [
            {
                "id": "claude-sonnet-4-5-20250929",
                "name": "Claude Sonnet 4.5",
                "description": "Latest Sonnet model, fastest",
                "max_tokens": 200000
            },
            {
                "id": "claude-opus-4-5-20251101",
                "name": "Claude Opus 4.5",
                "description": "Most capable model",
                "max_tokens": 200000
            }
        ]
    }

