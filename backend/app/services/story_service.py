import uuid
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Optional

from fastapi import HTTPException

from app.models.story import (
    ActionChoice,
    CreateStoryRequest,
    LlmProvider,
    StoryOptions,
    StoryPage,
    StoryState,
    StorySummary,
)
from app.services.llm_factory import get_image_service, get_text_service
from app.services.story_text_service import StoryTextService
from app.services.tts_service import TtsService
from app.services.tts_voices import (
    DEFAULT_VOICE_ID,
    get_voice,
    is_voice_disabled,
)

MAX_PAGES = 8


class StoryService:
    def __init__(self) -> None:
        self._stories: dict[str, StoryState] = {}
        self._images = get_image_service()
        self._tts = TtsService()

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
        if request.voice_id == "openai:coral":
            default_voice = (
                "gemini:Kore"
                if request.llm_provider.value == "gemini"
                else "openai:coral"
            )
            request = request.model_copy(update={"voice_id": default_voice})

        text_service = get_text_service(request)
        data = text_service.generate_first_page(request)
        story_id = str(uuid.uuid4())
        page = self._build_page(
            data,
            1,
            request,
            story_id,
            text_service,
        )
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
                self._build_ending_page(
                    next_page_num,
                    story,
                    story_id,
                    choice.label,
                )
            )
            story.current_page = len(story.pages) - 1
            self._stories[story_id] = story
            return story

        text_service = get_text_service(story.options)
        data = text_service.generate_next_page(
            options=story.options,
            page_number=next_page_num,
            previous_text=current.text,
            choice_label=choice.label,
            total_pages=MAX_PAGES,
        )
        page = self._build_page(
            data,
            page_number=next_page_num,
            options=story.options,
            story_id=story_id,
            text_service=text_service,
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

    def update_voice(self, story_id: str, voice_id: str) -> StoryState:
        story = self.get_story(story_id)
        if not is_voice_disabled(voice_id) and not get_voice(voice_id):
            raise HTTPException(status_code=400, detail="Unknown voice")
        story = story.model_copy(
            update={
                "options": story.options.model_copy(update={"voice_id": voice_id}),
            }
        )
        if is_voice_disabled(voice_id):
            story = story.model_copy(
                update={
                    "pages": [
                        page.model_copy(update={"audio_url": None})
                        for page in story.pages
                    ],
                }
            )
        self._stories[story_id] = story
        return story

    def ensure_narration(
        self,
        story_id: str,
        page_index: int,
        force: bool = False,
    ) -> StoryState:
        story = self.get_story(story_id)
        if page_index < 0 or page_index >= len(story.pages):
            raise HTTPException(status_code=400, detail="Invalid page index")

        if is_voice_disabled(story.options.voice_id):
            return story

        page = story.pages[page_index]
        if page.audio_url and not force:
            return story

        voice = get_voice(story.options.voice_id) or get_voice(DEFAULT_VOICE_ID)
        if not voice:
            return story

        audio_url = self._tts.synthesize(
            text=page.text,
            voice=voice,
            options=story.options,
            story_id=story_id,
            page_number=page.page_number,
        )
        if audio_url:
            updated_page = page.model_copy(update={"audio_url": audio_url})
            pages = list(story.pages)
            pages[page_index] = updated_page
            story = story.model_copy(update={"pages": pages})
            self._stories[story_id] = story
        return story

    def _find_choice(self, page: StoryPage, choice_id: str) -> Optional[ActionChoice]:
        for c in page.choices:
            if c.choice_id == choice_id:
                return c
        return None

    def _build_page(
        self,
        data: dict[str, Any],
        page_number: int,
        options: StoryOptions,
        story_id: str,
        text_service: StoryTextService,
    ) -> StoryPage:
        page = text_service.to_story_page(data, page_number)
        return self._enrich_page(page, options, story_id)

    def _enrich_page(
        self,
        page: StoryPage,
        options: StoryOptions,
        story_id: str,
    ) -> StoryPage:
        def generate_image() -> Optional[str]:
            return self._images.generate_scene_image(
                page.scene_description,
                options,
                story_id,
                page.page_number,
            )

        def generate_audio() -> Optional[str]:
            if is_voice_disabled(options.voice_id):
                return None
            voice = get_voice(options.voice_id) or get_voice(DEFAULT_VOICE_ID)
            if not voice:
                return None
            return self._tts.synthesize(
                text=page.text,
                voice=voice,
                options=options,
                story_id=story_id,
                page_number=page.page_number,
            )

        with ThreadPoolExecutor(max_workers=2) as pool:
            image_future = pool.submit(generate_image)
            audio_future = pool.submit(generate_audio)
            image_url = image_future.result()
            audio_url = audio_future.result()

        return page.model_copy(update={"image_url": image_url, "audio_url": audio_url})

    def _build_ending_page(
        self,
        page_number: int,
        story: StoryState,
        story_id: str,
        last_choice_label: str,
    ) -> StoryPage:
        text_service = get_text_service(story.options)
        data = text_service.generate_forced_ending(
            options=story.options,
            title=story.title,
            pages=story.pages,
            last_choice_label=last_choice_label,
        )
        page = text_service.to_story_page(data, page_number)
        page = page.model_copy(update={"is_ending": True, "choices": []})
        return self._enrich_page(page, story.options, story_id)


story_service = StoryService()
