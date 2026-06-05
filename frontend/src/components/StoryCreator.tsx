"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createStory } from "@/lib/api";
import {
  DEFAULT_STORY_PREFERENCES,
  loadStoryPreferences,
  saveStoryPreferences,
} from "@/lib/storyPreferences";
import {
  AUDIENCE_OPTIONS,
  CATEGORY_OPTIONS,
  STORY_TYPE_OPTIONS,
  VISUAL_STYLE_OPTIONS,
} from "@/lib/storyLabels";
import type {
  Audience,
  Category,
  StoryOptions,
  StoryType,
  VisualStyle,
} from "@/types/story";

const defaultOptions: StoryOptions = {
  idea: "",
  ...DEFAULT_STORY_PREFERENCES,
};

export function StoryCreator() {
  const router = useRouter();
  const [options, setOptions] = useState<StoryOptions>(defaultOptions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOptions((prev) => ({ ...prev, ...loadStoryPreferences() }));
  }, []);

  function updatePreferences(
    patch: Partial<Omit<StoryOptions, "idea">>,
  ) {
    setOptions((prev) => {
      const next = { ...prev, ...patch };
      const { idea: _idea, ...preferences } = next;
      saveStoryPreferences(preferences);
      return next;
    });
  }

  function updateIdea(idea: string) {
    setOptions((prev) => ({ ...prev, idea }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const story = await createStory(options);
      router.push(`/reader/${story.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create story");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-2xl space-y-6 rounded-3xl border border-amber-200/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm"
    >
      <div>
        <label htmlFor="idea" className="mb-2 block text-sm font-semibold text-amber-900">
          Story idea
        </label>
        <textarea
          id="idea"
          required
          rows={3}
          placeholder="A detective follows a clue through a rain-soaked city, or a traveler opens a door to another world..."
          className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-amber-950 placeholder:text-amber-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
          value={options.idea}
          onChange={(e) => updateIdea(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Genre" id="category">
          <select
            id="category"
            className="select-field"
            value={options.category}
            onChange={(e) =>
              updatePreferences({ category: e.target.value as Category })
            }
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Visual style" id="visual_style">
          <select
            id="visual_style"
            className="select-field"
            value={options.visual_style}
            onChange={(e) =>
              updatePreferences({
                visual_style: e.target.value as VisualStyle,
              })
            }
          >
            {VISUAL_STYLE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Story type" id="story_type">
          <select
            id="story_type"
            className="select-field"
            value={options.story_type}
            onChange={(e) =>
              updatePreferences({
                story_type: e.target.value as StoryType,
              })
            }
          >
            {STORY_TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Audience" id="audience">
          <select
            id="audience"
            className="select-field"
            value={options.audience}
            onChange={(e) =>
              updatePreferences({
                audience: e.target.value as Audience,
              })
            }
          >
            {AUDIENCE_OPTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Main character" id="character_name">
          <input
            id="character_name"
            type="text"
            required
            className="select-field"
            value={options.character_name}
            onChange={(e) =>
              updatePreferences({ character_name: e.target.value })
            }
          />
        </Field>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Writing story & generating illustration…" : "Create story"}
      </button>
    </form>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-amber-900">
        {label}
      </label>
      {children}
    </div>
  );
}
