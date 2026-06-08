import type { Audience, Genre, LlmProvider, StoryType, ArtStyle } from "@/types/story";

export const AUDIENCE_LABELS: Record<Audience, string> = {
  all_ages: "All Ages",
  teen: "Teen & Young Adult",
  adult: "Adult",
};

export const GENRE_LABELS: Record<Genre, string> = {
  adventure: "Adventure",
  comedy: "Comedy",
  fantasy: "Fantasy",
  fairy_tale: "Fairy Tale",
  fiction: "Fiction",
  sci_fi: "Science Fiction",
  superhero: "Superhero",
};

export const ART_STYLE_LABELS: Record<ArtStyle, string> = {
  anime: "Anime / Manga",
  cartoon: "Cartoon",
  crayon: "Crayon Drawing",
  oil_painting: "Oil Painting",
  pixel: "Pixel Art",
  realistic: "Realistic",
  watercolor: "Watercolor",
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

export const CATEGORY_OPTIONS = Object.entries(GENRE_LABELS).map(
  ([value, label]) => ({ value: value as Genre, label }),
);

export const VISUAL_STYLE_OPTIONS = Object.entries(ART_STYLE_LABELS).map(
  ([value, label]) => ({ value: value as ArtStyle, label }),
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
