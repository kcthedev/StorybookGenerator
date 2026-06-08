"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createStory, getLlmProviders, getTtsVoices } from "@/lib/api";
import { VoiceSelector } from "@/components/VoiceSelector";
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
import { BASE_LLM_PROVIDERS, BASE_TTS_VOICES, filterVoicesForLlm, mergeLlmProviders, mergeTtsVoices, resolveVoiceForLlm } from "@/lib/audioOptions";
import { DEFAULT_STORY_HINT, getRandomStoryHint } from "@/lib/storyHints";
import type {
  Audience,
  Genre,
  LlmProvider,
  LlmProviderStatus,
  StoryOptions,
  StoryType,
  VoiceOption,
  ArtStyle,
} from "@/types/story";

const defaultOptions: StoryOptions = {
  idea: "",
  ...DEFAULT_STORY_PREFERENCES,
};

export function StoryCreator() {
  const router = useRouter();
  const [options, setOptions] = useState<StoryOptions>(defaultOptions);
  const [llmProviders, setLlmProviders] =
    useState<LlmProviderStatus[]>(BASE_LLM_PROVIDERS);
  const [voices, setVoices] = useState<VoiceOption[]>(BASE_TTS_VOICES);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storyHint, setStoryHint] = useState<string>(DEFAULT_STORY_HINT);

  const llmProvider = options.llm_provider ?? "openai";
  const filteredVoices = filterVoicesForLlm(voices, llmProvider);
  const selectedVoiceId = resolveVoiceForLlm(
    options.voice_id,
    llmProvider,
    voices,
  );

  useEffect(() => {
    setStoryHint(getRandomStoryHint());
  }, []);

  useEffect(() => {
    const saved = loadStoryPreferences();
    setOptions((prev) => ({ ...prev, ...saved }));

    getLlmProviders()
      .then((providers) => {
        const merged = mergeLlmProviders(providers);
        setLlmProviders(merged);
        const savedProvider = saved.llm_provider ?? "openai";
        const isSavedAvailable = merged.some(
          (p) => p.id === savedProvider && p.available,
        );
        if (!isSavedAvailable) {
          const fallback =
            merged.find((p) => p.available)?.id ?? "openai";
          setOptions((prev) => ({ ...prev, llm_provider: fallback }));
        }
      })
      .catch(() => {
        setLlmProviders(BASE_LLM_PROVIDERS);
      });

    getTtsVoices()
      .then((data) => setVoices(mergeTtsVoices(data.voices)))
      .catch(() => setVoices(BASE_TTS_VOICES))
      .finally(() => setVoicesLoading(false));
  }, []);

  useEffect(() => {
    if (voicesLoading) {
      return;
    }
    const resolved = resolveVoiceForLlm(options.voice_id, llmProvider, voices);
    if (resolved !== options.voice_id) {
      updatePreferences({ voice_id: resolved });
    }
  }, [voicesLoading, llmProvider, voices]);

  const musicAvailable = llmProvider === "gemini";

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      // Only auto-fill if the user has not started typing anything yet
      if (!options.idea.trim()) {
        e.preventDefault(); // Stop focus from jumping to the next field
        updateIdea(storyHint);
      }
    }
  };

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
           Story Idea{" "}
        </label>
        <textarea
          id="idea"
          required
          rows={3}
          placeholder={storyHint}
          className="w-full rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-amber-950 placeholder:text-amber-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
          value={options.idea}
          onChange={(e) => updateIdea(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Genre" id="category">
          <select
            id="category"
            className="select-field"
            value={options.category}
            onChange={(e) =>
              updatePreferences({ category: e.target.value as Genre })
            }
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Art Style" id="visual_style">
          <select
            id="visual_style"
            className="select-field"
            value={options.visual_style}
            onChange={(e) =>
              updatePreferences({
                visual_style: e.target.value as ArtStyle,
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

        <Field label="Story writer (LLM)" id="llm_provider">
          <select
            id="llm_provider"
            className="select-field"
            value={options.llm_provider ?? "openai"}
            onChange={(e) => {
              const nextProvider = e.target.value as LlmProvider;
              updatePreferences({
                llm_provider: nextProvider,
                voice_id: resolveVoiceForLlm(
                  options.voice_id,
                  nextProvider,
                  voices,
                ),
                music_enabled:
                  nextProvider === "gemini" ? (options.music_enabled ?? false) : false,
              });
            }}
          >
            {llmProviders.map((p) => (
              <option key={p.id} value={p.id} disabled={!p.available}>
                {p.label}
                {!p.available ? " (not configured)" : ""}
                {p.available && !p.configured ? " (demo mode)" : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <VoiceSelector
        voices={filteredVoices}
        selectedVoiceId={selectedVoiceId}
        voicesLoading={voicesLoading}
        onChange={(voiceId) => updatePreferences({ voice_id: voiceId })}
      />

      <div className="rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3">
        <label
          className={`flex items-start gap-3 ${
            musicAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-70"
          }`}
        >
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
            checked={musicAvailable ? (options.music_enabled ?? false) : false}
            disabled={!musicAvailable}
            onChange={(e) =>
              updatePreferences({ music_enabled: e.target.checked })
            }
          />
          <span>
            <span className="block text-sm font-semibold text-amber-900">
              Background music
            </span>
            <span className="mt-1 block text-sm text-amber-800/90">
              {musicAvailable
                ? "Generate a looping ambient track from your story genre (Google Lyria via Gemini)."
                : "Select Google Gemini as the story writer to enable background music."}
            </span>
          </span>
        </label>
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
        {loading
          ? options.music_enabled && llmProvider === "gemini"
            ? "Writing story, illustration, narration & music…"
            : "Writing story, illustration & narration…"
          : "Create story"}
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
