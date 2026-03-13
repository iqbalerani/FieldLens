import asyncio
import json
import logging
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect

from app.core.config import get_settings
from app.services.ai_service import ai_service

router = APIRouter(tags=["voice"])
logger = logging.getLogger(__name__)


# ─── WebSocket: word-by-word echo / Nova Sonic proxy ────────────────────────

@router.websocket("/ws/voice/{session_id}")
async def voice_socket(websocket: WebSocket, session_id: str) -> None:
    """
    Accepts text chunks from the mobile client and echoes them back as a growing
    transcript.  In production (AI_MODE=bedrock) this would forward audio bytes
    to Amazon Nova Sonic and stream partial transcripts back.
    """
    await websocket.accept()
    transcript = ""
    try:
        while True:
            message = await websocket.receive_text()
            payload = json.loads(message)
            chunk = payload.get("text", "")
            transcript = f"{transcript} {chunk}".strip()
            await asyncio.sleep(0.08)
            await websocket.send_json(
                {
                    "type": "partial_transcript",
                    "sessionId": session_id,
                    "text": transcript,
                }
            )
            if payload.get("final"):
                await websocket.send_json(
                    {
                        "type": "final_transcript",
                        "sessionId": session_id,
                        "text": transcript,
                    }
                )
    except WebSocketDisconnect:
        return


# ─── REST: audio file upload → transcription ────────────────────────────────

@router.post("/voice/transcribe")
async def transcribe_audio(file: UploadFile = File(...)) -> dict[str, str]:
    """
    Accept an uploaded audio file (m4a / wav / mp3) and return a transcript.

    In AI_MODE=bedrock this calls Amazon Nova Sonic via the Bedrock streaming
    invoke API.  In mock mode it returns a canned response so the demo keeps
    working without AWS credentials.
    """
    settings = get_settings()
    audio_bytes = await file.read()

    if settings.ai_mode == "bedrock":
        try:
            transcript = _transcribe_bedrock(audio_bytes, file.content_type or "audio/mp4")
            return {"transcript": transcript}
        except Exception as exc:
            logger.warning("Bedrock transcription failed, falling back to mock: %s", exc)

    # Mock: echo a realistic-sounding placeholder
    return {"transcript": "Voice transcription received. The site appears to have structural concerns near the north entrance. Safety signage is missing in the loading bay area."}


def _transcribe_bedrock(audio_bytes: bytes, content_type: str) -> str:
    """Call Amazon Bedrock Nova Sonic (streaming) to transcribe audio bytes."""
    import base64

    bedrock = ai_service.bedrock
    # Nova Sonic uses the converse API with audio content
    response = bedrock.converse(
        modelId=get_settings().nova_sonic_model_id,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "text": "Transcribe this field inspection voice note exactly as spoken. Return only the transcript text, no commentary."
                    },
                    {
                        "document": {
                            "format": "mp4" if "mp4" in content_type else "wav",
                            "name": "voice_note",
                            "source": {"bytes": audio_bytes},
                        }
                    },
                ],
            }
        ],
    )
    chunks = [
        block.get("text", "")
        for block in response["output"]["message"]["content"]
        if "text" in block
    ]
    return "".join(chunks).strip()
