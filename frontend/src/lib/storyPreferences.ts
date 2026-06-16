import {
  AUDIENCE_LABELS,
  LLM_PROVIDER_LABELS,
  ART_STYLE_LABELS,
} from "@/lib/storyLabels";
import type {
  Audience,
  LlmProvider,
  StoryOptions,
  ArtStyle,
} from "@/types/story";

const STORAGE_KEY = "storybook-generator-preferences";

export type SavedStoryPreferences = Omit<StoryOptions, "idea"> & {
  narration_speed?: number;
};

export const DEFAULT_STORY_PREFERENCES: SavedStoryPreferences = {
  mood: 50,
  ending: 0,
  visual_style: "cartoon",
  audience: "all_ages",
  llm_provider: "openai",
  voice_id: "openai:coral",
  music_enabled: false,
  music_volume: 0.22,
  narration_speed: 1,
};

function isVisualStyle(value: unknown): value is ArtStyle {
  return typeof value === "string" && value in ART_STYLE_LABELS;
}

function isAudience(value: unknown): value is Audience {
  return typeof value === "string" && value in AUDIENCE_LABELS;
}

function isLlmProvider(value: unknown): value is LlmProvider {
  return typeof value === "string" && value in LLM_PROVIDER_LABELS;
}

function clampSlider(value: unknown, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

function parseMood(record: Record<string, unknown>): number {
  if (typeof record.mood === "number") {
    return clampSlider(record.mood, DEFAULT_STORY_PREFERENCES.mood);
  }
  return DEFAULT_STORY_PREFERENCES.mood;
}

function parseEnding(record: Record<string, unknown>): number {
  if (typeof record.ending === "number") {
    return clampSlider(record.ending, DEFAULT_STORY_PREFERENCES.ending);
  }

  const storyType = record.story_type;
  if (storyType === "open_ending" || storyType === "suspense" || storyType === "mystery") {
    return 75;
  }
  if (storyType === "surprise_twist") {
    return 90;
  }
  if (storyType === "happy_ending" || storyType === "bedtime_calm") {
    return 10;
  }

  return DEFAULT_STORY_PREFERENCES.ending;
}

function parseSavedPreferences(data: unknown): SavedStoryPreferences {
  if (!data || typeof data !== "object") {
    return DEFAULT_STORY_PREFERENCES;
  }

  const record = data as Record<string, unknown>;

  return {
    mood: parseMood(record),
    ending: parseEnding(record),
    visual_style: isVisualStyle(record.visual_style)
      ? record.visual_style
      : DEFAULT_STORY_PREFERENCES.visual_style,
    audience: isAudience(record.audience)
      ? record.audience
      : DEFAULT_STORY_PREFERENCES.audience,
    llm_provider: isLlmProvider(record.llm_provider)
      ? record.llm_provider
      : DEFAULT_STORY_PREFERENCES.llm_provider,
    voice_id:
      typeof record.voice_id === "string" && record.voice_id.trim()
        ? record.voice_id.trim()
        : DEFAULT_STORY_PREFERENCES.voice_id,
    music_enabled:
      typeof record.music_enabled === "boolean"
        ? record.music_enabled
        : DEFAULT_STORY_PREFERENCES.music_enabled,
    music_volume:
      typeof record.music_volume === "number" &&
      record.music_volume >= 0 &&
      record.music_volume <= 1
        ? record.music_volume
        : DEFAULT_STORY_PREFERENCES.music_volume,
    narration_speed:
      typeof record.narration_speed === "number" &&
      record.narration_speed >= 0.5 &&
      record.narration_speed <= 2
        ? record.narration_speed
        : DEFAULT_STORY_PREFERENCES.narration_speed,
  };
}

export function loadStoryPreferences(): SavedStoryPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_STORY_PREFERENCES;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_STORY_PREFERENCES;
    }
    return parseSavedPreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_STORY_PREFERENCES;
  }
}

export function saveStoryPreferences(preferences: SavedStoryPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore quota or privacy errors.
  }
}
