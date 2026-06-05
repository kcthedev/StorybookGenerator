from fastapi import APIRouter

from app.models.story import (
    ChoiceRequest,
    ChoiceResponse,
    CreateStoryRequest,
    CreateStoryResponse,
    StoryState,
    StorySummary,
)
from app.services.story_service import story_service

router = APIRouter(prefix="/api/stories", tags=["stories"])


@router.get("", response_model=list[StorySummary])
def list_stories() -> list[StorySummary]:
    return story_service.list_stories()


@router.post("", response_model=CreateStoryResponse)
def create_story(request: CreateStoryRequest) -> CreateStoryResponse:
    story = story_service.create_story(request)
    return CreateStoryResponse(story=story)


@router.get("/{story_id}", response_model=StoryState)
def get_story(story_id: str) -> StoryState:
    return story_service.get_story(story_id)


@router.post("/{story_id}/choice", response_model=ChoiceResponse)
def make_choice(story_id: str, body: ChoiceRequest) -> ChoiceResponse:
    story = story_service.make_choice(story_id, body.choice_id)
    return ChoiceResponse(story=story)


@router.post("/{story_id}/navigate/{page_index}", response_model=StoryState)
def navigate(story_id: str, page_index: int) -> StoryState:
    return story_service.navigate(story_id, page_index)
