import asyncio
import json

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

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


@router.post("", response_model=None)
async def create_story(
    request: CreateStoryRequest,
    stream: bool = Query(default=False),
):
    if not stream:
        story = await asyncio.to_thread(story_service.create_story, request)
        return CreateStoryResponse(story=story)

    queue: asyncio.Queue[dict | None] = asyncio.Queue()
    loop = asyncio.get_running_loop()

    def on_progress(progress: int) -> None:
        loop.call_soon_threadsafe(queue.put_nowait, {"progress": progress})

    async def run_creation() -> None:
        try:
            story = await asyncio.to_thread(
                story_service.create_story,
                request,
                on_progress,
            )
            await queue.put(
                {
                    "progress": 100,
                    "story": story.model_dump(mode="json"),
                }
            )
        except Exception as exc:
            await queue.put({"error": str(exc)})
        finally:
            await queue.put(None)

    task = asyncio.create_task(run_creation())

    async def event_stream():
        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                yield json.dumps(item) + "\n"
        finally:
            if not task.done():
                task.cancel()

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")


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
