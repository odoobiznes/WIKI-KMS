"""
KMS Tools - AI endpoints (Claude, OpenAI, Gemini, etc.)
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging
import httpx

from .tools_base import (
    ClaudeChatRequest, ClaudeChatResponse,
    get_object_path, get_full_path
)
from routers.tools_claude import chat_with_claude

logger = logging.getLogger(__name__)
router = APIRouter(tags=["ai"])


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
            include_context=request.include_context,
            api_key=request.api_key
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
                "id": "claude-opus-4-5-20251101",
                "name": "Claude Opus 4.5",
                "description": "Most capable model, latest Opus",
                "max_tokens": 200000
            },
            {
                "id": "claude-sonnet-4-5-20250929",
                "name": "Claude Sonnet 4.5",
                "description": "Latest Sonnet model, fastest and recommended",
                "max_tokens": 200000
            },
            {
                "id": "claude-haiku-4-5-20251001",
                "name": "Claude Haiku 4.5",
                "description": "Latest Haiku model, fastest and most affordable",
                "max_tokens": 200000
            },
            {
                "id": "claude-opus-4-1-20250805",
                "name": "Claude Opus 4.1",
                "description": "Previous Opus version",
                "max_tokens": 200000
            },
            {
                "id": "claude-opus-4-20250514",
                "name": "Claude Opus 4",
                "description": "Opus 4 base version",
                "max_tokens": 200000
            },
            {
                "id": "claude-sonnet-4-20250514",
                "name": "Claude Sonnet 4",
                "description": "Sonnet 4 base version",
                "max_tokens": 200000
            },
            {
                "id": "claude-3-7-sonnet-20250219",
                "name": "Claude Sonnet 3.7",
                "description": "Sonnet 3.7 version",
                "max_tokens": 200000
            },
            {
                "id": "claude-3-5-haiku-20241022",
                "name": "Claude Haiku 3.5",
                "description": "Haiku 3.5 version",
                "max_tokens": 200000
            },
            {
                "id": "claude-3-haiku-20240307",
                "name": "Claude Haiku 3",
                "description": "Haiku 3 base version",
                "max_tokens": 200000
            }
        ]
    }


# Pydantic models for AI endpoints
class AITestRequest(BaseModel):
    provider: str
    api_key: str
    model: Optional[str] = None


class AIGenerateRequest(BaseModel):
    provider: str
    api_key: str
    model: str
    prompt: str


class AIGenerateResponse(BaseModel):
    content: str
    model: str
    provider: str


@router.post("/ai/test")
async def test_ai_connection(request: AITestRequest):
    """Test AI provider connection"""
    try:
        if request.provider == 'openai':
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {request.api_key}"},
                    timeout=10.0
                )
                if response.status_code == 200:
                    return {"success": True, "message": "OpenAI connection successful"}
                else:
                    return {"success": False, "message": f"OpenAI API error: {response.status_code}"}

        elif request.provider == 'claude':
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": request.api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": request.model or "claude-sonnet-4-5-20250929",
                        "max_tokens": 10,
                        "messages": [{"role": "user", "content": "test"}]
                    },
                    timeout=10.0
                )
                if response.status_code == 200:
                    return {"success": True, "message": "Claude connection successful"}
                else:
                    return {"success": False, "message": f"Claude API error: {response.status_code}"}

        elif request.provider == 'gemini':
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://generativelanguage.googleapis.com/v1/models?key={request.api_key}",
                    timeout=10.0
                )
                if response.status_code == 200:
                    return {"success": True, "message": "Gemini connection successful"}
                else:
                    return {"success": False, "message": f"Gemini API error: {response.status_code}"}

        else:
            return {"success": False, "message": f"Unknown provider: {request.provider}"}

    except Exception as e:
        logger.error(f"AI test error: {e}", exc_info=True)
        return {"success": False, "message": str(e)}


@router.post("/ai/generate", response_model=AIGenerateResponse)
async def generate_with_ai(request: AIGenerateRequest):
    """Generate content using AI provider"""
    try:
        # Debug logging
        logger.info(f"AI Generate request: provider={request.provider}, model={request.model}, api_key_length={len(request.api_key) if request.api_key else 0}, api_key_prefix={request.api_key[:20] + '...' if request.api_key and len(request.api_key) > 20 else request.api_key}")

        if request.provider == 'openai':
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {request.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": request.model,
                        "messages": [{"role": "user", "content": request.prompt}],
                        "temperature": 0.7
                    },
                    timeout=60.0
                )
                if response.status_code == 200:
                    data = response.json()
                    content = data['choices'][0]['message']['content']
                    return AIGenerateResponse(
                        content=content,
                        model=request.model,
                        provider=request.provider
                    )
                else:
                    error_data = response.json() if response.content else {}
                    error_message = error_data.get('error', {}).get('message', 'OpenAI API error')
                    logger.error(f"OpenAI API error: {error_message}, Status: {response.status_code}")
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=error_message
                    )

        elif request.provider == 'claude':
            # Validate API key
            if not request.api_key or not request.api_key.strip():
                raise HTTPException(
                    status_code=400,
                    detail="Claude API key is required"
                )

            async with httpx.AsyncClient() as client:
                logger.info(f"Calling Claude API with model={request.model}, api_key_prefix={request.api_key[:20] + '...'}")
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": request.api_key.strip(),
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": request.model,
                        "max_tokens": 4096,
                        "messages": [{"role": "user", "content": request.prompt}]
                    },
                    timeout=60.0
                )
                logger.info(f"Claude API response: status={response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    content = data['content'][0]['text']
                    return AIGenerateResponse(
                        content=content,
                        model=request.model,
                        provider=request.provider
                    )
                else:
                    error_data = response.json() if response.content else {}
                    error_message = error_data.get('error', {}).get('message', f'Claude API error: {response.status_code}')
                    logger.error(f"Claude API error: {error_message}, status={response.status_code}, response={error_data}")
                    error_data = response.json() if response.content else {}
                    error_message = error_data.get('error', {}).get('message', 'Claude API error')
                    logger.error(f"Claude API error: {error_message}, Status: {response.status_code}")
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=error_message
                    )

        elif request.provider == 'gemini':
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1/models/{request.model}:generateContent?key={request.api_key}",
                    json={
                        "contents": [{"parts": [{"text": request.prompt}]}]
                    },
                    timeout=60.0
                )
                if response.status_code == 200:
                    data = response.json()
                    content = data['candidates'][0]['content']['parts'][0]['text']
                    return AIGenerateResponse(
                        content=content,
                        model=request.model,
                        provider=request.provider
                    )
                else:
                    error_data = response.json() if response.content else {}
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=error_data.get('error', {}).get('message', 'Gemini API error')
                    )

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported provider: {request.provider}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI generate error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
