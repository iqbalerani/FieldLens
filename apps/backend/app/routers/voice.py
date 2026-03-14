import asyncio
import base64
import json
import logging

from fastapi import APIRouter, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect

from app.core.config import get_settings
from app.services.sonic_service import SonicServiceError, sonic_service

router = APIRouter(tags=["voice"])
logger = logging.getLogger(__name__)


@router.websocket("/ws/voice/{session_id}")
async def voice_socket(websocket: WebSocket, session_id: str) -> None:
    await websocket.accept()
    buffer = bytearray()
    content_type = "audio/wav"

    try:
        while True:
            message = await websocket.receive_text()
            payload = json.loads(message)
            message_type = payload.get("type")

            if message_type == "start":
                buffer.clear()
                content_type = payload.get("contentType") or payload.get("mimeType") or "audio/wav"
                await websocket.send_json({"type": "ready", "sessionId": session_id})
            elif message_type == "audio_chunk":
                chunk = payload.get("content")
                if not chunk:
                    continue
                buffer.extend(base64.b64decode(chunk))
            elif message_type == "end":
                if not buffer:
                    await websocket.send_json({"type": "error", "sessionId": session_id, "message": "No audio received"})
                    continue

                async def publish(event: dict[str, str]) -> None:
                    await websocket.send_json({"sessionId": session_id, **event})

                try:
                    transcript = await sonic_service.transcribe_audio(
                        bytes(buffer),
                        content_type=content_type,
                        callback=publish,
                    )
                    if transcript:
                        await websocket.send_json(
                            {
                                "type": "completed",
                                "sessionId": session_id,
                                "text": transcript,
                            }
                        )
                except SonicServiceError as exc:
                    await websocket.send_json({"type": "error", "sessionId": session_id, "message": str(exc)})
                finally:
                    buffer.clear()
            elif message_type == "ping":
                await websocket.send_json({"type": "pong", "sessionId": session_id})
            else:
                await websocket.send_json({"type": "error", "sessionId": session_id, "message": "Unknown event type"})
    except WebSocketDisconnect:
        return


@router.post("/voice/transcribe")
async def transcribe_audio(file: UploadFile = File(...)) -> dict[str, str]:
    settings = get_settings()
    audio_bytes = await file.read()

    if settings.bedrock_enabled:
        try:
            transcript = await sonic_service.transcribe_audio(
                audio_bytes,
                content_type=file.content_type or "audio/wav",
            )
            return {"transcript": transcript}
        except SonicServiceError as exc:
            logger.warning("Nova Sonic transcription failed: %s", exc)
            raise HTTPException(status_code=422, detail=str(exc)) from exc

    return {
        "transcript": "Voice transcription received. Configure AI_MODE=bedrock and upload WAV/LPCM audio to use Nova Sonic."
    }
