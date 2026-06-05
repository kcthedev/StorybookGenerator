from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class Category(str, Enum):
    FICTION = "fiction"
    ADVENTURE = "adventure"
    COMEDY = "comedy"
    FANTASY = "fantasy"
    EDUCATIONAL = "educational"
    SCI_FI = "sci_fi"
    FAIRY_TALE = "fairy_tale"
    ANIMAL = "animal"
    FRIENDSHIP = "friendship"
    BEDTIME = "bedtime"
    SUPERHERO = "superhero"
    NATURE = "nature"
    HISTORICAL = "historical"


class VisualStyle(str, Enum):
    CARTOON = "cartoon"
    WATERCOLOR = "watercolor"
    PIXEL = "pixel"
    REALISTIC = "realistic"
    STORYBOOK = "storybook"
    ANIME = "anime"
    CLAYMATION = "claymation"
    CRAYON = "crayon"
    COMIC_BOOK = "comic_book"
    PASTEL = "pastel"
    CHALK = "chalk"
    PAPER_CUTOUT = "paper_cutout"
    OIL_PAINTING = "oil_painting"


class Audience(str, Enum):
    ALL_AGES = "all_ages"
    TEEN = "teen"
    ADULT = "adult"


class StoryType(str, Enum):
    HAPPY_ENDING = "happy_ending"
    OPEN_ENDING = "open_ending"
    MYSTERY = "mystery"
    AGE_RATED = "age_rated"
    CHOOSE_YOUR_OWN = "choose_your_own"
    SUSPENSE = "suspense"
    INSPIRING = "inspiring"
    QUEST = "quest"
    SURPRISE_TWIST = "surprise_twist"
    BEDTIME_CALM = "bedtime_calm"


class ReadingLayout(str, Enum):
    SPLIT = "split"
    VERTICAL = "vertical"


class LlmProvider(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"


class TtsProvider(str, Enum):
    NONE = "none"
    OPENAI = "openai"
    GEMINI = "gemini"


LLM_PROVIDER_LABELS = {
    LlmProvider.OPENAI: "OpenAI",
    LlmProvider.GEMINI: "Google Gemini",
}


class StoryOptions(BaseModel):
    idea: str = Field(..., min_length=3, max_length=500)
    category: Category
    visual_style: VisualStyle
    story_type: StoryType
    audience: Audience = Audience.ALL_AGES
    character_name: str = Field(default="Alex", min_length=1, max_length=50)
    llm_provider: LlmProvider = LlmProvider.OPENAI
    voice_id: str = "openai:coral"
    music_enabled: bool = False


class ActionChoice(BaseModel):
    choice_id: str
    label: str


class StoryPage(BaseModel):
    page_number: int
    text: str
    scene_description: str
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    choices: list[ActionChoice] = Field(default_factory=list)
    is_ending: bool = False
    recap: Optional[str] = None


class StoryState(BaseModel):
    id: str
    title: str
    options: StoryOptions
    pages: list[StoryPage]
    current_page: int = 0
    background_music_url: Optional[str] = None
    background_music_unavailable: bool = False


class CreateStoryRequest(StoryOptions):
    pass


class CreateStoryResponse(BaseModel):
    story: StoryState


class ChoiceRequest(BaseModel):
    choice_id: str


class ChoiceResponse(BaseModel):
    story: StoryState


class StorySummary(BaseModel):
    id: str
    title: str
    idea: str
    category: Category
    page_count: int


class LlmProviderStatus(BaseModel):
    id: LlmProvider
    label: str
    configured: bool
    available: bool


class LlmProvidersResponse(BaseModel):
    providers: list[LlmProviderStatus]


class VoiceOptionResponse(BaseModel):
    id: str
    provider: TtsProvider
    label: str
    description: str
    available: bool


class VoicesResponse(BaseModel):
    voices: list[VoiceOptionResponse]
    default_voice_id: str


class UpdateVoiceRequest(BaseModel):
    voice_id: str = Field(..., min_length=3, max_length=80)


class NarrationResponse(BaseModel):
    story: StoryState
    page_index: int
