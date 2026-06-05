from fastapi import HTTPException

from app.models.story import LLM_PROVIDER_LABELS, LlmProvider, LlmProviderStatus, StoryOptions
from app.services.gemini_service import GeminiService
from app.services.openai_service import OpenAIService
from app.services.story_text_service import StoryTextService

_openai = OpenAIService()
_gemini = GeminiService()


def list_llm_providers() -> list[LlmProviderStatus]:
    return [
        LlmProviderStatus(
            id=LlmProvider.OPENAI,
            label=LLM_PROVIDER_LABELS[LlmProvider.OPENAI],
            configured=_openai.is_configured,
            available=True,
        ),
        LlmProviderStatus(
            id=LlmProvider.GEMINI,
            label=LLM_PROVIDER_LABELS[LlmProvider.GEMINI],
            configured=_gemini.is_configured,
            available=_gemini.is_configured,
        ),
    ]


def get_text_service(options: StoryOptions) -> StoryTextService:
    return get_text_service_for_provider(options.llm_provider)


def get_text_service_for_provider(provider: LlmProvider) -> StoryTextService:
    if provider == LlmProvider.GEMINI:
        if not _gemini.is_configured:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Gemini is not configured. Set GEMINI_PROJECT_ID and "
                    "GEMINI_SERVICE_ACCOUNT_FILE in the backend .env file."
                ),
            )
        return _gemini

    return _openai


def get_image_service() -> OpenAIService:
    return _openai
