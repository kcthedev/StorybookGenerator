import uuid
from typing import Optional

from fastapi import HTTPException

from app.models.story import (
    ActionChoice,
    CreateStoryRequest,
    StoryOptions,
    StoryPage,
    StoryState,
    StorySummary,
)
from app.services.openai_service import OpenAIService

MAX_PAGES = 8


class StoryService:
    def __init__(self) -> None:
        self._stories: dict[str, StoryState] = {}
        self._openai = OpenAIService()

    def list_stories(self) -> list[StorySummary]:
        return [
            StorySummary(
                id=s.id,
                title=s.title,
                idea=s.options.idea,
                category=s.options.category,
                page_count=len(s.pages),
            )
            for s in self._stories.values()
        ]

    def get_story(self, story_id: str) -> StoryState:
        story = self._stories.get(story_id)
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")
        return story

    def create_story(self, request: CreateStoryRequest) -> StoryState:
        data = self._openai.generate_first_page(request)
        story_id = str(uuid.uuid4())
        page = self._openai.build_story_page(data, page_number=1, options=request, story_id=story_id)
        story = StoryState(
            id=story_id,
            title=data.get("title", "Untitled Story"),
            options=request,
            pages=[page],
            current_page=0,
        )
        self._stories[story_id] = story
        return story

    def make_choice(self, story_id: str, choice_id: str) -> StoryState:
        story = self.get_story(story_id)
        current = story.pages[story.current_page]

        if current.is_ending:
            raise HTTPException(status_code=400, detail="Story has already ended")

        choice = self._find_choice(current, choice_id)
        if not choice:
            raise HTTPException(status_code=400, detail="Invalid choice")

        next_page_num = len(story.pages) + 1
        if next_page_num > MAX_PAGES:
            story.pages.append(
                self._build_ending_page(next_page_num, story.options, story_id)
            )
            story.current_page = len(story.pages) - 1
            return story

        data = self._openai.generate_next_page(
            options=story.options,
            page_number=next_page_num,
            previous_text=current.text,
            choice_label=choice.label,
            total_pages=MAX_PAGES,
        )
        page = self._openai.build_story_page(
            data,
            page_number=next_page_num,
            options=story.options,
            story_id=story_id,
        )
        story.pages.append(page)
        story.current_page = len(story.pages) - 1
        self._stories[story_id] = story
        return story

    def navigate(self, story_id: str, page_index: int) -> StoryState:
        story = self.get_story(story_id)
        if page_index < 0 or page_index >= len(story.pages):
            raise HTTPException(status_code=400, detail="Invalid page index")
        story.current_page = page_index
        return story

    def _find_choice(self, page: StoryPage, choice_id: str) -> Optional[ActionChoice]:
        for c in page.choices:
            if c.choice_id == choice_id:
                return c
        return None

    def _build_ending_page(
        self, page_number: int, options: StoryOptions, story_id: str
    ) -> StoryPage:
        scene_description = (
            f"Happy ending scene with {options.character_name}, "
            f"{options.visual_style.value} style, warm celebratory mood."
        )
        image_url = self._openai.generate_scene_image(
            scene_description, options, story_id, page_number
        )
        return StoryPage(
            page_number=page_number,
            text=f"{options.character_name} smiled—the adventure had come to a wonderful end.",
            scene_description=scene_description,
            image_url=image_url,
            choices=[],
            is_ending=True,
        )
