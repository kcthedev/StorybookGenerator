import {
  AUDIENCE_LABELS,
  CATEGORY_LABELS,
  STORY_TYPE_LABELS,
  VISUAL_STYLE_LABELS,
} from "@/lib/storyLabels";
import type {
  Audience,
  Category,
  StoryOptions,
  StoryType,
  VisualStyle,
} from "@/types/story";

const STORAGE_KEY = "storybook-generator-preferences";

export type SavedStoryPreferences = Omit<StoryOptions, "idea">;

export const DEFAULT_STORY_PREFERENCES: SavedStoryPreferences = {
  category: "adventure",
  visual_style: "cartoon",
  story_type: "happy_ending",
  audience: "all_ages",
  character_name: "Alex",
};

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && value in CATEGORY_LABELS;
}

function isVisualStyle(value: unknown): value is VisualStyle {
  return typeof value === "string" && value in VISUAL_STYLE_LABELS;
}

function isStoryType(value: unknown): value is StoryType {
  return typeof value === "string" && value in STORY_TYPE_LABELS;
}

function isAudience(value: unknown): value is Audience {
  return typeof value === "string" && value in AUDIENCE_LABELS;
}

function parseSavedPreferences(data: unknown): SavedStoryPreferences {
  if (!data || typeof data !== "object") {
    return DEFAULT_STORY_PREFERENCES;
  }

  const record = data as Record<string, unknown>;
  const characterName =
    typeof record.character_name === "string" && record.character_name.trim()
      ? record.character_name.trim()
      : DEFAULT_STORY_PREFERENCES.character_name;

  return {
    category: isCategory(record.category)
      ? record.category
      : DEFAULT_STORY_PREFERENCES.category,
    visual_style: isVisualStyle(record.visual_style)
      ? record.visual_style
      : DEFAULT_STORY_PREFERENCES.visual_style,
    story_type: isStoryType(record.story_type)
      ? record.story_type
      : DEFAULT_STORY_PREFERENCES.story_type,
    audience: isAudience(record.audience)
      ? record.audience
      : DEFAULT_STORY_PREFERENCES.audience,
    character_name: characterName.slice(0, 50),
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
