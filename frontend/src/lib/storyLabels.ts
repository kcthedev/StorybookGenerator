import type { Audience, LlmProvider, ArtStyle } from "@/types/story";

export const AUDIENCE_LABELS: Record<Audience, string> = {
  all_ages: "All Ages",
  teen: "Teen & Young Adult",
  adult: "Adult",
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

export const AUDIENCE_OPTIONS = Object.entries(AUDIENCE_LABELS).map(
  ([value, label]) => ({ value: value as Audience, label }),
);

export const VISUAL_STYLE_OPTIONS = Object.entries(ART_STYLE_LABELS).map(
  ([value, label]) => ({ value: value as ArtStyle, label }),
);

export const LLM_PROVIDER_LABELS: Record<LlmProvider, string> = {
  openai: "OpenAI",
  gemini: "Google Gemini",
};

export const LLM_PROVIDER_OPTIONS = Object.entries(LLM_PROVIDER_LABELS).map(
  ([value, label]) => ({ value: value as LlmProvider, label }),
);

export function formatMoodLabel(mood: number): string {
  if (mood <= 20) return "Somber";
  if (mood <= 40) return "Reflective";
  if (mood <= 60) return "Balanced";
  if (mood <= 80) return "Warm";
  return "Upbeat";
}

export function formatEndingLabel(ending: number): string {
  if (ending <= 20) return "Full closure";
  if (ending <= 40) return "Mostly resolved";
  if (ending <= 60) return "Open-ended";
  if (ending <= 80) return "Suspenseful";
  return "Cliffhanger";
}
