import type { Audience, Category, LlmProvider, StoryType, VisualStyle } from "@/types/story";

export const AUDIENCE_LABELS: Record<Audience, string> = {
  all_ages: "All Ages",
  teen: "Teen & Young Adult",
  adult: "Adult",
};

export const CATEGORY_LABELS: Record<Category, string> = {
  fiction: "Fiction",
  adventure: "Adventure",
  comedy: "Comedy",
  fantasy: "Fantasy",
  educational: "Educational",
  sci_fi: "Science Fiction",
  fairy_tale: "Fairy Tale",
  animal: "Animal Stories",
  friendship: "Friendship",
  bedtime: "Bedtime",
  superhero: "Superhero",
  nature: "Nature & Outdoors",
  historical: "Historical",
};

export const VISUAL_STYLE_LABELS: Record<VisualStyle, string> = {
  cartoon: "Cartoon",
  watercolor: "Watercolor",
  pixel: "Pixel Art",
  realistic: "Realistic",
  storybook: "Classic Storybook",
  anime: "Anime / Manga",
  claymation: "Claymation",
  crayon: "Crayon Drawing",
  comic_book: "Comic Book",
  pastel: "Soft Pastel",
  chalk: "Chalk Art",
  paper_cutout: "Paper Cutout",
  oil_painting: "Oil Painting",
};

export const STORY_TYPE_LABELS: Record<StoryType, string> = {
  happy_ending: "Happy Ending",
  open_ending: "Open Ending",
  mystery: "Mystery",
  age_rated: "Mature Themes",
  choose_your_own: "Choose Your Own Path",
  suspense: "Suspenseful",
  inspiring: "Inspiring",
  quest: "Hero's Quest",
  surprise_twist: "Surprise Twist",
  bedtime_calm: "Bedtime Calm",
};

export const AUDIENCE_OPTIONS = Object.entries(AUDIENCE_LABELS).map(
  ([value, label]) => ({ value: value as Audience, label }),
);

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({ value: value as Category, label }),
);

export const VISUAL_STYLE_OPTIONS = Object.entries(VISUAL_STYLE_LABELS).map(
  ([value, label]) => ({ value: value as VisualStyle, label }),
);

export const STORY_TYPE_OPTIONS = Object.entries(STORY_TYPE_LABELS).map(
  ([value, label]) => ({ value: value as StoryType, label }),
);

export const LLM_PROVIDER_LABELS: Record<LlmProvider, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
};

export const LLM_PROVIDER_OPTIONS = Object.entries(LLM_PROVIDER_LABELS).map(
  ([value, label]) => ({ value: value as LlmProvider, label }),
);
