from dataclasses import dataclass

from app.models.story import TtsProvider


@dataclass(frozen=True)
class VoiceOption:
    id: str
    provider: TtsProvider
    voice_key: str
    label: str
    description: str


VOICE_CATALOG: list[VoiceOption] = [
    VoiceOption(
        id="openai:coral",
        provider=TtsProvider.OPENAI,
        voice_key="coral",
        label="Coral",
        description="Warm and friendly — great for children's stories and upbeat adventures.",
    ),
    VoiceOption(
        id="openai:sage",
        provider=TtsProvider.OPENAI,
        voice_key="sage",
        label="Sage",
        description="Calm and thoughtful — ideal for bedtime tales and reflective moments.",
    ),
    VoiceOption(
        id="openai:verse",
        provider=TtsProvider.OPENAI,
        voice_key="verse",
        label="Verse",
        description="Expressive storyteller — suits fantasy, mystery, and dramatic scenes.",
    ),
    VoiceOption(
        id="openai:ash",
        provider=TtsProvider.OPENAI,
        voice_key="ash",
        label="Ash",
        description="Soft and gentle — comforting for younger listeners and calm stories.",
    ),
    VoiceOption(
        id="openai:ballad",
        provider=TtsProvider.OPENAI,
        voice_key="ballad",
        label="Ballad",
        description="Melodic and lyrical — wonderful for fairy tales and poetic narration.",
    ),
    VoiceOption(
        id="gemini:Kore",
        provider=TtsProvider.GEMINI,
        voice_key="Kore",
        label="Kore",
        description="Clear and balanced — a versatile narrator for any genre.",
    ),
    VoiceOption(
        id="gemini:Charon",
        provider=TtsProvider.GEMINI,
        voice_key="Charon",
        label="Charon",
        description="Deep and authoritative — perfect for epic quests and historical tales.",
    ),
    VoiceOption(
        id="gemini:Puck",
        provider=TtsProvider.GEMINI,
        voice_key="Puck",
        label="Puck",
        description="Upbeat and energetic — brings comedy and adventure to life.",
    ),
    VoiceOption(
        id="gemini:Aoede",
        provider=TtsProvider.GEMINI,
        voice_key="Aoede",
        label="Aoede",
        description="Warm and expressive — rich emotion for friendship and inspiring stories.",
    ),
    VoiceOption(
        id="gemini:Fenrir",
        provider=TtsProvider.GEMINI,
        voice_key="Fenrir",
        label="Fenrir",
        description="Bold and dramatic — heightens suspense, twists, and thrilling moments.",
    ),
]

NO_VOICE_ID = "none"
NO_VOICE_LABEL = "No Voice"
NO_VOICE_DESCRIPTION = "Read silently — no narration or text-to-speech for this story."

DEFAULT_VOICE_ID = "openai:coral"


def is_voice_disabled(voice_id: str) -> bool:
    return voice_id == NO_VOICE_ID


def get_voice(voice_id: str) -> VoiceOption | None:
    for voice in VOICE_CATALOG:
        if voice.id == voice_id:
            return voice
    return None


def voices_for_provider(provider: TtsProvider) -> list[VoiceOption]:
    return [voice for voice in VOICE_CATALOG if voice.provider == provider]
