from dataclasses import dataclass

from app.models.story import TtsProvider


@dataclass(frozen=True)
class VoiceOption:
    id: str
    provider: TtsProvider
    voice_key: str
    label: str
    description: str


_OPENAI_VOICES: list[tuple[str, str]] = [
    (
        "alloy",
        "Neutral and balanced — a reliable all-purpose narrator for any story.",
    ),
    (
        "ash",
        "Soft and gentle — comforting for younger listeners and calm stories.",
    ),
    (
        "ballad",
        "Melodic and lyrical — wonderful for fairy tales and poetic narration.",
    ),
    (
        "coral",
        "Warm and friendly — great for children's stories and upbeat adventures.",
    ),
    (
        "echo",
        "Warm and expressive — brings emotion and presence to heartfelt scenes.",
    ),
    (
        "fable",
        "Articulate and polished — wonderful for classic tales and fairy stories.",
    ),
    (
        "onyx",
        "Deep and authoritative — commanding voice for epic adventures and legends.",
    ),
    (
        "nova",
        "Energetic and friendly — perfect for upbeat heroes and lively adventures.",
    ),
    (
        "sage",
        "Calm and thoughtful — ideal for bedtime tales and reflective moments.",
    ),
    (
        "shimmer",
        "Soft and delicate — gentle narration for tender and quiet moments.",
    ),
    (
        "verse",
        "Expressive storyteller — suits fantasy, mystery, and dramatic scenes.",
    ),
    (
        "marin",
        "Clear and natural — high-quality narration for polished storytelling.",
    ),
    (
        "cedar",
        "Rich and warm — immersive narration with depth for captivating tales.",
    ),
]

# (voice_key, gender, description) — gender from Google Gemini-TTS docs.
_GEMINI_VOICES: list[tuple[str, str, str]] = [
    (
        "Achernar",
        "Female",
        "Luminous and poised — carries wonder and magic through dreamy tales.",
    ),
    (
        "Achird",
        "Male",
        "Friendly and approachable — a welcoming narrator for everyday adventures.",
    ),
    (
        "Algenib",
        "Male",
        "Crisp and clear — keeps pace in action-packed and informative tales.",
    ),
    (
        "Algieba",
        "Male",
        "Warm and conversational — natural for buddy stories and dialogue.",
    ),
    (
        "Alnilam",
        "Male",
        "Steady and grounded — dependable voice for journey and quest narratives.",
    ),
    (
        "Aoede",
        "Female",
        "Warm and expressive — rich emotion for friendship and inspiring stories.",
    ),
    (
        "Autonoe",
        "Female",
        "Gentle and flowing — ideal for nature stories and peaceful journeys.",
    ),
    (
        "Callirrhoe",
        "Female",
        "Playful and amused — brings lively dialogue and humorous moments to life.",
    ),
    (
        "Charon",
        "Male",
        "Deep and authoritative — perfect for epic quests and historical tales.",
    ),
    (
        "Despina",
        "Female",
        "Soft and nurturing — comforting for younger listeners and tender scenes.",
    ),
    (
        "Enceladus",
        "Male",
        "Cool and measured — suits mystery, science fiction, and suspense.",
    ),
    (
        "Erinome",
        "Female",
        "Melodic and graceful — wonderful for fairy tales and poetic narration.",
    ),
    (
        "Fenrir",
        "Male",
        "Bold and dramatic — heightens suspense, twists, and thrilling moments.",
    ),
    (
        "Gacrux",
        "Female",
        "Steady and assured — anchors adventure stories with quiet confidence.",
    ),
    (
        "Iapetus",
        "Male",
        "Resonant and solemn — impactful for myths and moral lessons.",
    ),
    (
        "Kore",
        "Female",
        "Clear and balanced — a versatile narrator for any genre.",
    ),
    (
        "Laomedeia",
        "Female",
        "Bright and curious — perfect for discovery tales and eager young heroes.",
    ),
    (
        "Leda",
        "Female",
        "Warm and inviting — draws listeners into cozy, heartfelt stories.",
    ),
    (
        "Orus",
        "Male",
        "Confident and direct — drives forward momentum in exciting plots.",
    ),
    (
        "Pulcherrima",
        "Female",
        "Elegant and vivid — suits royal quests and enchanted kingdoms.",
    ),
    (
        "Puck",
        "Male",
        "Upbeat and energetic — brings comedy and adventure to life.",
    ),
    (
        "Rasalgethi",
        "Male",
        "Rich and storytelling — classic narrator tone for long-form tales.",
    ),
    (
        "Sadachbia",
        "Male",
        "Easygoing and warm — relaxed pacing for gentle humor and slice-of-life.",
    ),
    (
        "Sadaltager",
        "Male",
        "Expressive and theatrical — heightens drama and pivotal scenes.",
    ),
    (
        "Schedar",
        "Male",
        "Noble and steady — fitting for knights, heroes, and grand adventures.",
    ),
    (
        "Sulafat",
        "Female",
        "Smooth and soothing — ideal for bedtime and winding-down chapters.",
    ),
    (
        "Umbriel",
        "Male",
        "Deep and mysterious — adds atmosphere to shadowy woods and secrets.",
    ),
    (
        "Vindemiatrix",
        "Female",
        "Refined and articulate — great for legends and thoughtful fables.",
    ),
    (
        "Zephyr",
        "Female",
        "Light and breezy — adds sparkle to whimsical and fast-moving scenes.",
    ),
    (
        "Zubenelgenubi",
        "Male",
        "Distinctive and characterful — memorable for quirky tales and odd heroes.",
    ),
]


def _openai_voice(voice_key: str, description: str) -> VoiceOption:
    return VoiceOption(
        id=f"openai:{voice_key}",
        provider=TtsProvider.OPENAI,
        voice_key=voice_key,
        label=voice_key.capitalize(),
        description=description,
    )


def _gemini_voice(voice_key: str, gender: str, description: str) -> VoiceOption:
    return VoiceOption(
        id=f"gemini:{voice_key}",
        provider=TtsProvider.GEMINI,
        voice_key=voice_key,
        label=voice_key,
        description=f"{gender} — {description}",
    )


VOICE_CATALOG: list[VoiceOption] = [
    *[_openai_voice(key, description) for key, description in _OPENAI_VOICES],
    *[
        _gemini_voice(key, gender, description)
        for key, gender, description in _GEMINI_VOICES
    ],
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
