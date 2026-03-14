import asyncio
import base64
import io
import json
import wave
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable

from app.core.config import get_settings

try:
    from aws_sdk_bedrock_runtime.client import BedrockRuntimeClient
    from aws_sdk_bedrock_runtime.config import Config as BedrockRuntimeConfig
    from aws_sdk_bedrock_runtime.models import (
        BidirectionalInputPayloadPart,
        InvokeModelWithBidirectionalStreamInputChunk,
        InvokeModelWithBidirectionalStreamOperationInput,
        InvokeModelWithBidirectionalStreamOutputChunk,
    )
    from smithy_aws_core.identity.environment import EnvironmentCredentialsResolver
except ImportError:  # pragma: no cover - import validated in production env
    BedrockRuntimeClient = None
    BedrockRuntimeConfig = None
    BidirectionalInputPayloadPart = None
    InvokeModelWithBidirectionalStreamInputChunk = None
    InvokeModelWithBidirectionalStreamOperationInput = None
    InvokeModelWithBidirectionalStreamOutputChunk = None
    EnvironmentCredentialsResolver = None


TranscriptCallback = Callable[[dict[str, Any]], Awaitable[None]]


class SonicServiceError(Exception):
    pass


@dataclass
class SonicTranscriptState:
    fragments: dict[str, list[str]] = field(default_factory=dict)
    roles: dict[str, str] = field(default_factory=dict)

    def start_block(self, content_name: str, role: str) -> None:
        self.roles[content_name] = role
        self.fragments[content_name] = []

    def append_text(self, content_name: str, text: str) -> str:
        self.fragments.setdefault(content_name, []).append(text)
        return "".join(self.fragments[content_name]).strip()

    def finish_block(self, content_name: str) -> str:
        return "".join(self.fragments.get(content_name, [])).strip()


class SonicService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _require_sdk(self) -> None:
        if BedrockRuntimeClient is None:
            raise SonicServiceError(
                "Nova Sonic streaming requires aws_sdk_bedrock_runtime and smithy-aws-core."
            )

    def _client(self):
        self._require_sdk()
        return BedrockRuntimeClient(
            config=BedrockRuntimeConfig(
                region=self.settings.aws_region,
                aws_credentials_identity_resolver=EnvironmentCredentialsResolver(),
            )
        )

    def _wav_to_pcm(self, audio_bytes: bytes) -> tuple[bytes, int]:
        try:
            with wave.open(io.BytesIO(audio_bytes), "rb") as wav_file:
                sample_rate = wav_file.getframerate()
                sample_width = wav_file.getsampwidth()
                channels = wav_file.getnchannels()
                frames = wav_file.readframes(wav_file.getnframes())
        except wave.Error as exc:
            raise SonicServiceError(
                "Nova Sonic expects WAV/LPCM audio. The uploaded file could not be parsed as WAV."
            ) from exc

        if sample_width != 2:
            raise SonicServiceError("Nova Sonic requires 16-bit PCM audio.")
        if channels != 1:
            raise SonicServiceError("Nova Sonic requires mono audio.")
        if sample_rate not in {16000, 24000}:
            raise SonicServiceError("Nova Sonic requires 16kHz or 24kHz PCM audio.")
        return frames, sample_rate

    async def transcribe_audio(
        self,
        audio_bytes: bytes,
        *,
        content_type: str,
        callback: TranscriptCallback | None = None,
    ) -> str:
        if not self.settings.bedrock_enabled:
            return "Voice transcription received. Configure AI_MODE=bedrock to use Nova Sonic."

        pcm_bytes, sample_rate = self._wav_to_pcm(audio_bytes)
        transcript_state = SonicTranscriptState()
        completion = asyncio.Event()
        final_transcript = {"value": ""}
        prompt_name = "fieldlens-transcript"
        system_content_name = "fieldlens-system"
        audio_content_name = "fieldlens-audio"

        async with await self._client().invoke_model_with_bidirectional_stream(
            InvokeModelWithBidirectionalStreamOperationInput(
                model_id=self.settings.nova_sonic_model_id,
            )
        ) as stream:
            await stream.input_stream.send(
                InvokeModelWithBidirectionalStreamInputChunk(
                    BidirectionalInputPayloadPart(
                        bytes_=self._event_bytes(
                            {
                                "event": {
                                    "sessionStart": {
                                        "inferenceConfiguration": {
                                            "maxTokens": 1024,
                                            "topP": 0.9,
                                            "temperature": 0.1,
                                        }
                                    }
                                }
                            }
                        )
                    )
                )
            )
            await stream.input_stream.send(
                InvokeModelWithBidirectionalStreamInputChunk(
                    BidirectionalInputPayloadPart(
                        bytes_=self._event_bytes(
                            {
                                "event": {
                                    "promptStart": {
                                        "promptName": prompt_name,
                                        "textOutputConfiguration": {"mediaType": "text/plain"},
                                        "audioOutputConfiguration": {
                                            "mediaType": "audio/lpcm",
                                            "sampleRateHertz": sample_rate,
                                            "sampleSizeBits": 16,
                                            "channelCount": 1,
                                            "encoding": "base64",
                                            "audioType": "SPEECH",
                                        },
                                    }
                                }
                            }
                        )
                    )
                )
            )
            await stream.input_stream.send(
                InvokeModelWithBidirectionalStreamInputChunk(
                    BidirectionalInputPayloadPart(
                        bytes_=self._event_bytes(
                            {
                                "event": {
                                    "contentStart": {
                                        "promptName": prompt_name,
                                        "contentName": system_content_name,
                                        "type": "TEXT",
                                        "interactive": False,
                                        "role": "SYSTEM",
                                        "textInputConfiguration": {"mediaType": "text/plain"},
                                    }
                                }
                            }
                        )
                    )
                )
            )
            await stream.input_stream.send(
                InvokeModelWithBidirectionalStreamInputChunk(
                    BidirectionalInputPayloadPart(
                        bytes_=self._event_bytes(
                            {
                                "event": {
                                    "textInput": {
                                        "promptName": prompt_name,
                                        "contentName": system_content_name,
                                        "content": (
                                            "You are FieldLens transcription mode. "
                                            "Return only the user's speech transcript with no assistant reply."
                                        ),
                                    }
                                }
                            }
                        )
                    )
                )
            )
            await stream.input_stream.send(
                InvokeModelWithBidirectionalStreamInputChunk(
                    BidirectionalInputPayloadPart(
                        bytes_=self._event_bytes(
                            {
                                "event": {
                                    "contentEnd": {
                                        "promptName": prompt_name,
                                        "contentName": system_content_name,
                                    }
                                }
                            }
                        )
                    )
                )
            )
            await stream.input_stream.send(
                InvokeModelWithBidirectionalStreamInputChunk(
                    BidirectionalInputPayloadPart(
                        bytes_=self._event_bytes(
                            {
                                "event": {
                                    "contentStart": {
                                        "promptName": prompt_name,
                                        "contentName": audio_content_name,
                                        "type": "AUDIO",
                                        "interactive": True,
                                        "role": "USER",
                                        "audioInputConfiguration": {
                                            "mediaType": "audio/lpcm",
                                            "sampleRateHertz": sample_rate,
                                            "sampleSizeBits": 16,
                                            "channelCount": 1,
                                            "audioType": "SPEECH",
                                            "encoding": "base64",
                                        },
                                    }
                                }
                            }
                        )
                    )
                )
            )

            output_task = asyncio.create_task(
                self._consume_output(
                    stream=stream,
                    callback=callback,
                    transcript_state=transcript_state,
                    final_transcript=final_transcript,
                    completion=completion,
                )
            )

            for index in range(0, len(pcm_bytes), 1024):
                chunk = pcm_bytes[index:index + 1024]
                if not chunk:
                    continue
                await stream.input_stream.send(
                    InvokeModelWithBidirectionalStreamInputChunk(
                        BidirectionalInputPayloadPart(
                            bytes_=self._event_bytes(
                                {
                                    "event": {
                                        "audioInput": {
                                            "promptName": prompt_name,
                                            "contentName": audio_content_name,
                                            "content": base64.b64encode(chunk).decode("utf-8"),
                                        }
                                    }
                                }
                            )
                        )
                    )
                )
                await asyncio.sleep(0.005)

            await stream.input_stream.send(
                InvokeModelWithBidirectionalStreamInputChunk(
                    BidirectionalInputPayloadPart(
                        bytes_=self._event_bytes(
                            {
                                "event": {
                                    "contentEnd": {
                                        "promptName": prompt_name,
                                        "contentName": audio_content_name,
                                    }
                                }
                            }
                        )
                    )
                )
            )
            await stream.input_stream.send(
                InvokeModelWithBidirectionalStreamInputChunk(
                    BidirectionalInputPayloadPart(
                        bytes_=self._event_bytes({"event": {"promptEnd": {"promptName": prompt_name}}})
                    )
                )
            )

            await completion.wait()
            await output_task

        return final_transcript["value"].strip()

    async def _consume_output(
        self,
        *,
        stream,
        callback: TranscriptCallback | None,
        transcript_state: SonicTranscriptState,
        final_transcript: dict[str, str],
        completion: asyncio.Event,
    ) -> None:
        _, output_stream = await stream.await_output()
        async for event in output_stream:
            if not isinstance(event, InvokeModelWithBidirectionalStreamOutputChunk):
                continue

            payload_bytes = event.value.bytes_ or b""
            if not payload_bytes:
                continue
            payload = json.loads(payload_bytes.decode("utf-8"))
            event_name, event_body = next(iter(payload.get("event", {}).items()))

            if event_name == "contentStart":
                content_name = event_body.get("contentName")
                role = event_body.get("role")
                if content_name and role:
                    transcript_state.start_block(content_name, role)
            elif event_name == "textOutput":
                content_name = event_body.get("contentName")
                if not content_name:
                    continue
                role = transcript_state.roles.get(content_name)
                text = event_body.get("content", "")
                if role != "USER" or not text:
                    continue
                running = transcript_state.append_text(content_name, text)
                if callback:
                    await callback({"type": "partial_transcript", "text": running})
            elif event_name == "contentEnd":
                content_name = event_body.get("contentName")
                if not content_name:
                    continue
                role = transcript_state.roles.get(content_name)
                transcript = transcript_state.finish_block(content_name)
                if role == "USER" and transcript:
                    final_transcript["value"] = transcript
                    if callback:
                        await callback({"type": "final_transcript", "text": transcript})
            elif event_name == "promptEnd":
                completion.set()
            elif event_name == "completionEnd":
                completion.set()

    def _event_bytes(self, payload: dict[str, Any]) -> bytes:
        return json.dumps(payload, separators=(",", ":")).encode("utf-8")


sonic_service = SonicService()
