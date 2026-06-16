from fastapi import APIRouter, HTTPException

from app.models.story import (
    NarrationResponse,
    TtsProvider,
    UpdateVoiceRequest,
    VoiceOptionResponse,
    VoicesResponse,
)
from app.services.story_service import story_service
from app.services.tts_service import TtsService
from app.services.tts_voices import (
    DEFAULT_VOICE_ID,
    NO_VOICE_DESCRIPTION,
    NO_VOICE_ID,
    NO_VOICE_LABEL,
    VOICE_CATALOG,
    get_voice,
    is_voice_disabled,
)

router = APIRouter(prefix="/api", tags=["audio"])
tts_service = TtsService()


@router.get("/tts/voices", response_model=VoicesResponse)
def list_voices() -> VoicesResponse:
    voices = [
        VoiceOptionResponse(
            id=NO_VOICE_ID,
            provider=TtsProvider.NONE,
            label=NO_VOICE_LABEL,
            description=NO_VOICE_DESCRIPTION,
            available=True,
        ),
        *[
            VoiceOptionResponse(
                id=voice.id,
                provider=voice.provider,
                label=voice.label,
                description=voice.description,
                available=tts_service.provider_available(voice.provider),
            )
            for voice in VOICE_CATALOG
        ],
    ]
    return VoicesResponse(voices=voices, default_voice_id=DEFAULT_VOICE_ID)


@router.post("/stories/{story_id}/voice")
def update_voice(story_id: str, body: UpdateVoiceRequest) -> NarrationResponse:
    if not is_voice_disabled(body.voice_id):
        voice = get_voice(body.voice_id)
        if not voice:
            raise HTTPException(status_code=400, detail="Unknown voice")
        if not tts_service.provider_available(voice.provider):
            raise HTTPException(
                status_code=503,
                detail=f"{voice.provider.value} TTS is not configured on the server",
            )

    story = story_service.update_voice(story_id, body.voice_id)
    return NarrationResponse(story=story, page_index=story.current_page)


@router.post("/stories/{story_id}/pages/{page_index}/narration", response_model=NarrationResponse)
def ensure_narration(
    story_id: str,
    page_index: int,
    force: bool = False,
) -> NarrationResponse:
    story = story_service.ensure_narration(story_id, page_index, force=force)
    return NarrationResponse(story=story, page_index=page_index)


@router.post("/stories/{story_id}/music")
def ensure_music(story_id: str):
    story = story_service.ensure_background_music(story_id)
    return {"story": story}
