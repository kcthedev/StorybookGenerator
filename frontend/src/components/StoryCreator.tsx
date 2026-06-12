"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { createStory, getLlmProviders, getTtsVoices } from "@/lib/api";
import { AdvancedStorySettings } from "@/components/AdvancedStorySettings";
import {
  DEFAULT_STORY_PREFERENCES,
  loadStoryPreferences,
  saveStoryPreferences,
} from "@/lib/storyPreferences";
import {
  AUDIENCE_OPTIONS,
  VISUAL_STYLE_OPTIONS,
} from "@/lib/storyLabels";
import { BASE_LLM_PROVIDERS, BASE_TTS_VOICES, filterVoicesForLlm, mergeLlmProviders, mergeTtsVoices, resolveVoiceForLlm } from "@/lib/audioOptions";
import { DEFAULT_STORY_HINT, getRandomStoryHint } from "@/lib/storyHints";
import type {
  Audience,
  LlmProviderStatus,
  StoryOptions,
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
  const [progress, setProgress] = useState(0);
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
    setProgress(0);
    try {
      const story = await createStory(options, setProgress);
      router.push(`/reader/${story.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create story");
    } finally {
      setLoading(false);
      setProgress(0);
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
        <p className="mb-2 text-xs text-amber-700/80">
          Describe your story and include character names if you like.
        </p>
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

      <div className="space-y-5">
        <ToneSlider
          id="mood"
          label="Mood / tone"
          minLabel="Sad"
          maxLabel="Happy"
          value={options.mood}
          onChange={(mood) => updatePreferences({ mood })}
        />
        <ToneSlider
          id="ending"
          label="Ending"
          minLabel="Full closure"
          maxLabel="Cliffhanger"
          value={options.ending}
          onChange={(ending) => updatePreferences({ ending })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <AdvancedStorySettings
        llmProvider={llmProvider}
        llmProviders={llmProviders}
        voices={filteredVoices}
        selectedVoiceId={selectedVoiceId}
        voicesLoading={voicesLoading}
        musicEnabled={options.music_enabled ?? false}
        onLlmProviderChange={(nextProvider) =>
          updatePreferences({
            llm_provider: nextProvider,
            voice_id: resolveVoiceForLlm(
              options.voice_id,
              nextProvider,
              voices,
            ),
            music_enabled:
              nextProvider === "gemini"
                ? (options.music_enabled ?? false)
                : false,
          })
        }
        onVoiceChange={(voiceId) => updatePreferences({ voice_id: voiceId })}
        onMusicEnabledChange={(enabled) =>
          updatePreferences({ music_enabled: enabled })
        }
      />

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
        {loading ? `Creating story… ${progress}%` : "Create story"}
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

function ToneSlider({
  id,
  label,
  minLabel,
  maxLabel,
  value,
  onChange,
}: {
  id: string;
  label: string;
  minLabel: string;
  maxLabel: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-amber-900">
        {label}
      </label>
      <div className="flex items-center justify-between text-xs font-medium text-amber-700">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tone-slider mt-2 w-full"
      />
    </div>
  );
}
