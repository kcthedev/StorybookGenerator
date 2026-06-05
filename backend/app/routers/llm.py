from fastapi import APIRouter

from app.models.story import LlmProvidersResponse
from app.services.llm_factory import list_llm_providers

router = APIRouter(prefix="/api/llm-providers", tags=["llm"])


@router.get("", response_model=LlmProvidersResponse)
def get_llm_providers() -> LlmProvidersResponse:
    return LlmProvidersResponse(providers=list_llm_providers())
