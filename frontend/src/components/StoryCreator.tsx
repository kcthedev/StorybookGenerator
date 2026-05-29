"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { createStory } from "@/lib/api";
import type { Category, StoryOptions, StoryType, VisualStyle } from "@/types/story";

const categories: { value: Category; label: string }[] = [
  { value: "fiction", label: "Fiction" },
  { value: "adventure", label: "Adventure" },
  { value: "comedy", label: "Comedy" },
  { value: "fantasy", label: "Fantasy" },
  { value: "educational", label: "Educational" },
];

const visualStyles: { value: VisualStyle; label: string }[] = [
  { value: "cartoon", label: "Cartoon" },
  { value: "watercolor", label: "Watercolor" },
  { value: "pixel", label: "Pixel Art" },
  { value: "realistic", label: "Realistic" },
  { value: "storybook", label: "Classic Storybook" },
];

const storyTypes: { value: StoryType; label: string }[] = [
  { value: "happy_ending", label: "Happy Ending" },
  { value: "open_ending", label: "Open Ending" },
  { value: "mystery", label: "Mystery" },
  { value: "age_rated", label: "Age-Rated" },
];

const defaultOptions: StoryOptions = {
  idea: "",
  category: "adventure",
  visual_style: "cartoon",
  story_type: "happy_ending",
  character_name: "Alex",
};

export function StoryCreator() {
  const router = useRouter();
  const [options, setOptions] = useState<StoryOptions>(defaultOptions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          placeholder="A curious kid discovers a door to a cloud kingdom..."
          className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-amber-950 placeholder:text-amber-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
          value={options.idea}
          onChange={(e) => setOptions({ ...options, idea: e.target.value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" id="category">
          <select
            id="category"
            className="select-field"
            value={options.category}
            onChange={(e) =>
              setOptions({ ...options, category: e.target.value as Category })
            }
          >
            {categories.map((c) => (
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
              setOptions({
                ...options,
                visual_style: e.target.value as VisualStyle,
              })
            }
          >
            {visualStyles.map((s) => (
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
              setOptions({
                ...options,
                story_type: e.target.value as StoryType,
              })
            }
          >
            {storyTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
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
              setOptions({ ...options, character_name: e.target.value })
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
        {loading ? "Writing story & generating illustration…" : "Create storybook"}
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
