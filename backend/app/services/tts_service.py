import io
import logging
import wave
from typing import Optional

from openai import OpenAI

from app.config import settings
from app.models.story import StoryOptions, TtsProvider
from app.services.audio_storage import AudioStorage
from app.services.google_client import get_vertex_client
from app.services.tts_instructions import build_narration_instructions
from app.services.tts_voices import VoiceOption

logger = logging.getLogger(__name__)


def _pcm_to_wav(pcm: bytes, channels: int = 1, rate: int = 24000, sample_width: int = 2) -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(sample_width)
        wav_file.setframerate(rate)
        wav_file.writeframes(pcm)
    return buffer.getvalue()


class TtsService:
    def __init__(self) -> None:
        self._openai = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self._storage = AudioStorage()

    @property
    def openai_configured(self) -> bool:
        return self._openai is not None

    @property
    def gemini_configured(self) -> bool:
        return get_vertex_client() is not None

    def provider_available(self, provider: TtsProvider) -> bool:
        return self._provider_available(provider)

    def synthesize(
        self,
        text: str,
        voice: VoiceOption,
        options: StoryOptions,
        story_id: str,
        page_number: int,
    ) -> Optional[str]:
        instructions = build_narration_instructions(options)
        dest = self._storage.narration_path(story_id, page_number)

        providers = self._provider_chain(voice.provider)
        last_error: Exception | None = None

        for provider in providers:
            try:
                audio = self._synthesize_with_provider(
                    provider=provider,
                    text=text,
                    voice=voice,
                    instructions=instructions,
                )
                if audio:
                    return self._storage.save_bytes(audio, dest)
            except Exception as exc:
                last_error = exc
                logger.warning("TTS provider %s failed: %s", provider.value, exc)

        if last_error:
            logger.error("All TTS providers failed for story %s page %s", story_id, page_number)
        return None

    def _provider_chain(self, preferred: TtsProvider) -> list[TtsProvider]:
        ordered = [preferred]
        for provider in (TtsProvider.OPENAI, TtsProvider.GEMINI):
            if provider not in ordered:
                ordered.append(provider)
        return [provider for provider in ordered if self._provider_available(provider)]

    def _provider_available(self, provider: TtsProvider) -> bool:
        if provider == TtsProvider.OPENAI:
            return self.openai_configured
        if provider == TtsProvider.GEMINI:
            return self.gemini_configured
        return False

    def _synthesize_with_provider(
        self,
        provider: TtsProvider,
        text: str,
        voice: VoiceOption,
        instructions: str,
    ) -> Optional[bytes]:
        if provider == TtsProvider.OPENAI:
            return self._openai_tts(text, voice.voice_key, instructions)
        if provider == TtsProvider.GEMINI:
            return self._gemini_tts(text, voice.voice_key, instructions)
        return None

    def _openai_tts(self, text: str, voice_key: str, instructions: str) -> bytes:
        if not self._openai:
            raise RuntimeError("OpenAI not configured")
        response = self._openai.audio.speech.create(
            model=settings.openai_tts_model,
            voice=voice_key,
            input=text,
            instructions=instructions,
            response_format="mp3",
        )
        return response.content

    def _gemini_tts(self, text: str, voice_key: str, instructions: str) -> bytes:
        from google.genai import types

        client = get_vertex_client()
        if not client:
            raise RuntimeError("Gemini not configured")

        prompt = f"{instructions}\n\nRead this page aloud:\n{text}"
        response = client.models.generate_content(
            model=settings.gemini_tts_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=voice_key,
                        )
                    )
                ),
            ),
        )

        for candidate in response.candidates or []:
            for part in candidate.content.parts or []:
                if part.inline_data and part.inline_data.data:
                    data = part.inline_data.data
                    mime = part.inline_data.mime_type or ""
                    if "wav" in mime or mime.endswith("/wav"):
                        return data
                    return _pcm_to_wav(data)
        raise RuntimeError("Gemini TTS returned no audio")
