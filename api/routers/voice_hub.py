"""
AI Voice Hub Router
WebRTC + Speech-to-Text + Text-to-Speech + Multi-AI routing

Umožňuje uživateli:
- Poslat hlasovou zprávu z mobilu/webu
- Dostat hlasovou odpověď od AI
- Real-time voice chat s Claude + druhým AI
- Automatický přepis a archivaci
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import json
import asyncio
import logging
import os
from pathlib import Path
import uuid
import base64

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice-hub", tags=["Voice Hub"])

# Configuration
VOICE_HUB_DATA_DIR = Path("/opt/kms-tools/voice-hub")
VOICE_HUB_DATA_DIR.mkdir(parents=True, exist_ok=True)

RECORDINGS_DIR = VOICE_HUB_DATA_DIR / "recordings"
TRANSCRIPTS_DIR = VOICE_HUB_DATA_DIR / "transcripts"
RESPONSES_DIR = VOICE_HUB_DATA_DIR / "responses"

for dir in [RECORDINGS_DIR, TRANSCRIPTS_DIR, RESPONSES_DIR]:
    dir.mkdir(parents=True, exist_ok=True)


# Models
class TTSProvider(str, Enum):
    """Text-to-Speech providers"""
    ELEVENLABS = "elevenlabs"
    GOOGLE = "google"
    OPENAI = "openai"


class STTProvider(str, Enum):
    """Speech-to-Text providers"""
    WHISPER_API = "whisper_api"
    WHISPER_LOCAL = "whisper_local"
    GOOGLE = "google"


class AIProvider(str, Enum):
    """AI providers for responses"""
    CLAUDE_PRIMARY = "claude_primary"
    CLAUDE_SECONDARY = "claude_secondary"
    AUTO = "auto"  # Intelligent routing


class VoiceMessageRequest(BaseModel):
    """Request to send voice message"""
    audio_base64: str = Field(..., description="Base64 encoded audio data")
    format: str = Field(default="webm", description="Audio format (webm, mp3, wav)")
    stt_provider: STTProvider = Field(default=STTProvider.WHISPER_API)
    ai_provider: AIProvider = Field(default=AIProvider.AUTO)
    tts_provider: TTSProvider = Field(default=TTSProvider.ELEVENLABS)
    session_id: Optional[str] = Field(default=None, description="Session ID for conversation continuity")


class VoiceMessageResponse(BaseModel):
    """Response from voice message processing"""
    message_id: str
    session_id: str
    transcript: str
    ai_response_text: str
    ai_response_audio_url: str
    ai_provider_used: str
    processing_time_ms: int
    created_at: datetime


class VoiceSession(BaseModel):
    """Voice chat session"""
    session_id: str
    user_id: Optional[str]
    created_at: datetime
    last_activity: datetime
    messages_count: int
    ai_providers_used: List[str]


# In-memory session storage (should be Redis in production)
active_sessions: Dict[str, VoiceSession] = {}
active_websockets: Dict[str, WebSocket] = {}


# Speech-to-Text Integration
async def transcribe_audio(audio_path: Path, provider: STTProvider = STTProvider.WHISPER_API) -> str:
    """
    Transcribe audio using specified provider

    Args:
        audio_path: Path to audio file
        provider: STT provider to use

    Returns:
        Transcribed text
    """
    logger.info(f"Transcribing audio with {provider}: {audio_path}")

    if provider == STTProvider.WHISPER_API:
        # OpenAI Whisper API
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            with open(audio_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language="cs"  # Czech - změň podle potřeby
                )

            return transcript.text
        except Exception as e:
            logger.error(f"Whisper API error: {e}")
            # Fallback to local Whisper
            provider = STTProvider.WHISPER_LOCAL

    if provider == STTProvider.WHISPER_LOCAL:
        # Local Whisper model
        try:
            import whisper
            model = whisper.load_model("base")  # base, small, medium, large
            result = model.transcribe(str(audio_path), language="cs")
            return result["text"]
        except Exception as e:
            logger.error(f"Local Whisper error: {e}")
            raise HTTPException(status_code=500, detail=f"STT failed: {e}")

    if provider == STTProvider.GOOGLE:
        # Google Speech-to-Text (TODO: implement)
        raise HTTPException(status_code=501, detail="Google STT not implemented yet")

    raise HTTPException(status_code=400, detail=f"Unknown STT provider: {provider}")


# Text-to-Speech Integration
async def synthesize_speech(text: str, provider: TTSProvider = TTSProvider.ELEVENLABS) -> Path:
    """
    Convert text to speech using specified provider

    Args:
        text: Text to convert
        provider: TTS provider to use

    Returns:
        Path to generated audio file
    """
    logger.info(f"Synthesizing speech with {provider}: {text[:50]}...")

    output_filename = f"tts_{uuid.uuid4().hex}.mp3"
    output_path = RESPONSES_DIR / output_filename

    if provider == TTSProvider.ELEVENLABS:
        # ElevenLabs TTS (premium quality)
        try:
            from elevenlabs import generate, save, set_api_key

            api_key = os.getenv("ELEVENLABS_API_KEY")
            if not api_key:
                logger.warning("ElevenLabs API key not found, falling back to Google TTS")
                provider = TTSProvider.GOOGLE
            else:
                set_api_key(api_key)

                # Generate audio
                audio = generate(
                    text=text,
                    voice="Adam",  # Můžeš změnit hlas
                    model="eleven_multilingual_v2"  # Podporuje češtinu
                )

                # Save to file
                save(audio, str(output_path))
                return output_path
        except Exception as e:
            logger.error(f"ElevenLabs error: {e}, falling back to Google TTS")
            provider = TTSProvider.GOOGLE

    if provider == TTSProvider.GOOGLE:
        # Google TTS (free)
        try:
            from gtts import gTTS
            tts = gTTS(text=text, lang='cs')  # Czech
            tts.save(str(output_path))
            return output_path
        except Exception as e:
            logger.error(f"Google TTS error: {e}")
            raise HTTPException(status_code=500, detail=f"TTS failed: {e}")

    if provider == TTSProvider.OPENAI:
        # OpenAI TTS
        try:
            from openai import OpenAI
            client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

            response = client.audio.speech.create(
                model="tts-1",
                voice="alloy",
                input=text
            )

            response.stream_to_file(str(output_path))
            return output_path
        except Exception as e:
            logger.error(f"OpenAI TTS error: {e}")
            raise HTTPException(status_code=500, detail=f"TTS failed: {e}")

    raise HTTPException(status_code=400, detail=f"Unknown TTS provider: {provider}")


# AI Response Generation
async def get_ai_response(transcript: str, session_id: str, provider: AIProvider = AIProvider.AUTO) -> tuple[str, str]:
    """
    Get AI response to user's voice message

    Args:
        transcript: Transcribed user message
        session_id: Session ID for context
        provider: AI provider to use

    Returns:
        Tuple of (response_text, provider_used)
    """
    logger.info(f"Getting AI response from {provider} for: {transcript[:50]}...")

    # Intelligent routing
    if provider == AIProvider.AUTO:
        # Simple routing logic - můžeš rozšířit
        if "bezpečnost" in transcript.lower() or "2fa" in transcript.lower():
            provider = AIProvider.CLAUDE_PRIMARY
        elif "deploy" in transcript.lower() or "server" in transcript.lower():
            provider = AIProvider.CLAUDE_SECONDARY
        else:
            provider = AIProvider.CLAUDE_PRIMARY

    # Generate response based on provider
    if provider == AIProvider.CLAUDE_PRIMARY:
        # Claude API (primary instance)
        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

            message = client.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=1024,
                messages=[{
                    "role": "user",
                    "content": f"Uživatel ti poslal hlasovou zprávu: '{transcript}'. Odpověz stručně a jasně (max 3-4 věty), jako bys mluvil."
                }]
            )

            response_text = message.content[0].text
            return response_text, "claude_primary"
        except Exception as e:
            logger.error(f"Claude Primary error: {e}")
            # Fallback to secondary
            provider = AIProvider.CLAUDE_SECONDARY

    if provider == AIProvider.CLAUDE_SECONDARY:
        # Claude (secondary instance via KMS API)
        # TODO: Implementovat komunikaci s druhým Claude přes filesystem
        # Pro teď simuluji odpověď
        response_text = f"Dostal jsem tvou zprávu: '{transcript}'. Toto je odpověď od druhého AI asistenta."
        return response_text, "claude_secondary"

    return "Omlouvám se, momentálně nemohu odpovědět.", "fallback"


# REST API Endpoints

@router.post("/message", response_model=VoiceMessageResponse)
async def send_voice_message(request: VoiceMessageRequest):
    """
    Send voice message and get AI response

    Flow:
    1. Receive audio (base64)
    2. Save audio file
    3. Transcribe (STT)
    4. Get AI response
    5. Synthesize response (TTS)
    6. Return response with audio URL
    """
    start_time = datetime.now()

    # Generate IDs
    message_id = uuid.uuid4().hex
    session_id = request.session_id or uuid.uuid4().hex

    # Create/update session
    if session_id not in active_sessions:
        active_sessions[session_id] = VoiceSession(
            session_id=session_id,
            user_id=None,  # TODO: Get from auth
            created_at=datetime.now(),
            last_activity=datetime.now(),
            messages_count=0,
            ai_providers_used=[]
        )

    session = active_sessions[session_id]
    session.last_activity = datetime.now()
    session.messages_count += 1

    try:
        # 1. Save audio file
        audio_filename = f"{message_id}.{request.format}"
        audio_path = RECORDINGS_DIR / audio_filename

        audio_data = base64.b64decode(request.audio_base64)
        with open(audio_path, "wb") as f:
            f.write(audio_data)

        logger.info(f"Saved audio: {audio_path}")

        # 2. Transcribe audio
        transcript = await transcribe_audio(audio_path, request.stt_provider)
        logger.info(f"Transcript: {transcript}")

        # Save transcript
        transcript_path = TRANSCRIPTS_DIR / f"{message_id}.txt"
        with open(transcript_path, "w", encoding="utf-8") as f:
            f.write(transcript)

        # 3. Get AI response
        ai_response_text, provider_used = await get_ai_response(
            transcript, session_id, request.ai_provider
        )

        if provider_used not in session.ai_providers_used:
            session.ai_providers_used.append(provider_used)

        logger.info(f"AI response from {provider_used}: {ai_response_text}")

        # 4. Synthesize response
        response_audio_path = await synthesize_speech(ai_response_text, request.tts_provider)
        logger.info(f"Generated TTS: {response_audio_path}")

        # 5. Calculate processing time
        processing_time = int((datetime.now() - start_time).total_seconds() * 1000)

        # 6. Return response
        return VoiceMessageResponse(
            message_id=message_id,
            session_id=session_id,
            transcript=transcript,
            ai_response_text=ai_response_text,
            ai_response_audio_url=f"/api/voice-hub/audio/{response_audio_path.name}",
            ai_provider_used=provider_used,
            processing_time_ms=processing_time,
            created_at=datetime.now()
        )

    except Exception as e:
        logger.error(f"Voice message processing error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/audio/{filename}")
async def get_audio(filename: str):
    """
    Serve generated audio file
    """
    audio_path = RESPONSES_DIR / filename

    if not audio_path.exists():
        raise HTTPException(status_code=404, detail="Audio not found")

    return FileResponse(
        audio_path,
        media_type="audio/mpeg",
        filename=filename
    )


@router.get("/sessions", response_model=List[VoiceSession])
async def list_sessions():
    """
    List all active voice sessions
    """
    return list(active_sessions.values())


@router.get("/sessions/{session_id}", response_model=VoiceSession)
async def get_session(session_id: str):
    """
    Get specific voice session
    """
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    return active_sessions[session_id]


# WebSocket for real-time voice chat
@router.websocket("/ws/{session_id}")
async def voice_chat_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time voice chat

    Protocol:
    - Client sends: {"type": "audio", "data": "base64_audio", "format": "webm"}
    - Server responds: {"type": "transcript", "text": "..."}
    - Server responds: {"type": "ai_text", "text": "..."}
    - Server responds: {"type": "ai_audio", "data": "base64_audio"}
    """
    await websocket.accept()
    active_websockets[session_id] = websocket

    logger.info(f"WebSocket connected: {session_id}")

    # Create session if doesn't exist
    if session_id not in active_sessions:
        active_sessions[session_id] = VoiceSession(
            session_id=session_id,
            user_id=None,
            created_at=datetime.now(),
            last_activity=datetime.now(),
            messages_count=0,
            ai_providers_used=[]
        )

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()

            if data.get("type") == "audio":
                # Process voice message in real-time
                try:
                    # Save audio
                    message_id = uuid.uuid4().hex
                    audio_data = base64.b64decode(data["data"])
                    audio_path = RECORDINGS_DIR / f"{message_id}.{data.get('format', 'webm')}"

                    with open(audio_path, "wb") as f:
                        f.write(audio_data)

                    # Transcribe
                    transcript = await transcribe_audio(audio_path, STTProvider.WHISPER_API)
                    await websocket.send_json({"type": "transcript", "text": transcript})

                    # Get AI response
                    ai_text, provider = await get_ai_response(transcript, session_id, AIProvider.AUTO)
                    await websocket.send_json({"type": "ai_text", "text": ai_text, "provider": provider})

                    # Synthesize and send audio
                    audio_response_path = await synthesize_speech(ai_text, TTSProvider.ELEVENLABS)

                    with open(audio_response_path, "rb") as f:
                        audio_base64 = base64.b64encode(f.read()).decode()

                    await websocket.send_json({
                        "type": "ai_audio",
                        "data": audio_base64,
                        "format": "mp3"
                    })

                except Exception as e:
                    logger.error(f"WebSocket processing error: {e}")
                    await websocket.send_json({"type": "error", "message": str(e)})

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {session_id}")
        if session_id in active_websockets:
            del active_websockets[session_id]


@router.get("/health")
async def voice_hub_health():
    """
    Health check for Voice Hub
    """
    return {
        "status": "healthy",
        "active_sessions": len(active_sessions),
        "active_websockets": len(active_websockets),
        "whisper_available": os.getenv("OPENAI_API_KEY") is not None,
        "elevenlabs_available": os.getenv("ELEVENLABS_API_KEY") is not None
    }
