"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { SceneIllustration } from "@/components/SceneIllustration";
import { StoryEndingPanel, buildFallbackRecap } from "@/components/StoryEndingPanel";
import { StoryNarration } from "@/components/StoryNarration";
import { StoryPageLoader } from "@/components/StoryPageLoader";
import { VoiceSelector } from "@/components/VoiceSelector";
import {
  getStory,
  getTtsVoices,
  makeChoice,
  navigateToPage,
  updateStoryVoice,
} from "@/lib/api";
import { BASE_TTS_VOICES, mergeTtsVoices, resolveVoiceForLlm, selectNarratorVoices } from "@/lib/audioOptions";
import {
  DEFAULT_STORY_PREFERENCES,
  loadStoryPreferences,
  saveStoryPreferences,
} from "@/lib/storyPreferences";
import { isVoiceDisabled, NO_VOICE_ID, type ReadingLayout, type StoryState, type VoiceOption } from "@/types/story";

interface StoryReaderProps {
  initialStory: StoryState;
}

type LoadingMode = "generating" | "navigating" | null;

export function StoryReader({ initialStory }: StoryReaderProps) {
  const [story, setStory] = useState(initialStory);
  const [voices, setVoices] = useState<VoiceOption[]>(BASE_TTS_VOICES);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [layout, setLayout] = useState<ReadingLayout>("split");
  const [loading, setLoading] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<LoadingMode>(null);
  const [pendingChoiceLabel, setPendingChoiceLabel] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  const [pendingVoiceId, setPendingVoiceId] = useState<string | null>(null);
  const [voiceRevision, setVoiceRevision] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(
    () =>
      loadStoryPreferences().narration_speed ??
      DEFAULT_STORY_PREFERENCES.narration_speed ??
      1,
  );

  const page = story.pages[story.current_page];
  const canGoBack = story.current_page > 0;
  const canGoForward = story.current_page < story.pages.length - 1;
  const isSplitLayout = layout === "split";
  const llmProvider = story.options.llm_provider ?? "openai";
  const narrationEnabled = !isVoiceDisabled(story.options.voice_id);
  const [preferredVoiceId, setPreferredVoiceId] = useState(() =>
    resolveVoiceForLlm(
      isVoiceDisabled(initialStory.options.voice_id)
        ? undefined
        : initialStory.options.voice_id,
      initialStory.options.llm_provider ?? "openai",
      BASE_TTS_VOICES,
    ),
  );
  const resolvedVoiceId = resolveVoiceForLlm(
    narrationEnabled
      ? (pendingVoiceId ?? story.options.voice_id)
      : preferredVoiceId,
    llmProvider,
    voices,
  );
  const narratorVoices = selectNarratorVoices(
    voices,
    llmProvider,
    resolvedVoiceId,
  );

  useEffect(() => {
    getTtsVoices()
      .then((data) => setVoices(mergeTtsVoices(data.voices)))
      .catch(() => setVoices(BASE_TTS_VOICES))
      .finally(() => setVoicesLoading(false));
  }, []);

  const refresh = useCallback(
    async (
      updater: () => Promise<StoryState>,
      options?: { mode?: LoadingMode; choiceLabel?: string | null },
    ) => {
      const mode = options?.mode ?? "navigating";
      setLoading(true);
      setLoadingMode(mode);
      setPendingChoiceLabel(options?.choiceLabel ?? null);
      setError(null);
      setEntering(false);

      try {
        const updated = await updater();
        setStory(updated);
        setEntering(true);
        window.setTimeout(() => setEntering(false), 320);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
        setLoadingMode(null);
        setPendingChoiceLabel(null);
      }
    },
    [],
  );

  async function handleChoice(choiceId: string) {
    const choice = page.choices.find((item) => item.choice_id === choiceId);
    await refresh(() => makeChoice(story.id, choiceId), {
      mode: "generating",
      choiceLabel: choice?.label ?? null,
    });
  }

  async function goToPage(index: number) {
    await refresh(() => navigateToPage(story.id, index), {
      mode: "navigating",
    });
  }

  async function reloadStory() {
    await refresh(() => getStory(story.id), { mode: "navigating" });
  }

  async function handleVoiceChange(
    voiceId: string,
    options?: { bumpRevision?: boolean },
  ) {
    const currentVoiceId = narrationEnabled
      ? resolvedVoiceId
      : NO_VOICE_ID;
    if (voiceId === currentVoiceId) {
      return;
    }

    const bumpRevision = options?.bumpRevision ?? (
      !isVoiceDisabled(voiceId) &&
      !isVoiceDisabled(story.options.voice_id) &&
      voiceId !== story.options.voice_id
    );

    if (!isVoiceDisabled(voiceId)) {
      setPreferredVoiceId(resolveVoiceForLlm(voiceId, llmProvider, voices));
    }

    setPendingVoiceId(voiceId);
    setVoiceLoading(true);
    setError(null);
    try {
      const updated = await updateStoryVoice(story.id, voiceId);
      setStory(updated);
      if (bumpRevision) {
        setVoiceRevision((revision) => revision + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update voice");
    } finally {
      setPendingVoiceId(null);
      setVoiceLoading(false);
    }
  }

  async function handleNarrationEnabledChange(enabled: boolean) {
    const nextVoiceId = enabled ? preferredVoiceId : NO_VOICE_ID;
    await handleVoiceChange(nextVoiceId, { bumpRevision: false });
  }

  function handlePlaybackRateChange(rate: number) {
    setPlaybackRate(rate);
    saveStoryPreferences({
      ...loadStoryPreferences(),
      narration_speed: rate,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 xl:max-w-[88rem]">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/"
            className="text-sm font-medium text-amber-700 hover:text-amber-900"
          >
            ← New story
          </Link>
          <h1 className="mt-1 text-xl font-bold text-amber-950 sm:text-2xl md:text-3xl">
            {story.title}
          </h1>
          {page.is_ending ? (
            <p className="text-sm text-amber-700/80">
              Story complete · {story.pages.length} pages
            </p>
          ) : (
            <p className="text-sm text-amber-700/80">Page {page.page_number}</p>
          )}
        </div>
        <div className="hidden shrink-0 gap-2 lg:flex">
          <LayoutButton
            active={isSplitLayout}
            onClick={() => setLayout("split")}
            label="Side by side"
          />
          <LayoutButton
            active={!isSplitLayout}
            onClick={() => setLayout("vertical")}
            label="Stacked"
          />
        </div>
      </header>

      <BackgroundMusic story={story} onStoryUpdate={setStory} />

      <VoiceSelector
        voices={narratorVoices}
        selectedVoiceId={resolvedVoiceId}
        narrationEnabled={narrationEnabled}
        loading={voiceLoading}
        voicesLoading={voicesLoading}
        onNarrationEnabledChange={handleNarrationEnabledChange}
        onChange={handleVoiceChange}
      />

      <div
        className={`reader-content-shell ${
          loading ? "is-loading" : ""
        } ${entering ? "is-entering" : ""}`}
      >
        <article
          className={`reader-panel ${
            isSplitLayout
              ? "reader-mobile-stack lg:reader-split"
              : "reader-mobile-stack lg:reader-vertical"
          }`}
        >
          <div className="reader-image">
            <SceneIllustration
              sceneDescription={page.scene_description}
              visualStyle={story.options.visual_style}
              imageUrl={page.image_url}
            />
          </div>
          <div className="reader-text flex flex-col gap-6 rounded-2xl border border-amber-100 bg-white/90 p-5 shadow-sm sm:p-6 lg:h-full">
            <StoryNarration
              story={story}
              pageIndex={story.current_page}
              voiceRevision={voiceRevision}
              playbackRate={playbackRate}
              onPlaybackRateChange={handlePlaybackRateChange}
              onStoryUpdate={setStory}
              disabled={loading}
            />

            <p className="text-lg leading-relaxed text-amber-950 md:text-xl">
              {page.text}
            </p>

            {!page.is_ending && page.choices.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
                  What happens next?
                </p>
                <div className="flex flex-col gap-2">
                  {page.choices.map((choice) => (
                    <button
                      key={choice.choice_id}
                      type="button"
                      disabled={loading}
                      onClick={() => handleChoice(choice.choice_id)}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left font-medium text-amber-900 transition hover:border-amber-400 hover:bg-amber-100 disabled:opacity-50"
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {page.is_ending && (
              <StoryEndingPanel
                story={story}
                recap={page.recap ?? buildFallbackRecap(story)}
                onReadAgain={() => goToPage(0)}
                loading={loading}
              />
            )}
          </div>
        </article>

        <StoryPageLoader
          active={loading}
          choiceLabel={pendingChoiceLabel}
          mode={loadingMode ?? "navigating"}
        />
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canGoBack || loading}
            onClick={() => goToPage(story.current_page - 1)}
            className="nav-btn"
          >
            Previous
          </button>
          {!page.is_ending && (
            <button
              type="button"
              disabled={!canGoForward || loading}
              onClick={() => goToPage(story.current_page + 1)}
              className="nav-btn"
            >
              Next
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={reloadStory}
          disabled={loading}
          className="text-sm text-amber-700 hover:text-amber-900 disabled:opacity-50"
        >
          Refresh
        </button>
      </footer>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function LayoutButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-amber-500 text-white"
          : "bg-amber-100 text-amber-800 hover:bg-amber-200"
      }`}
    >
      {label}
    </button>
  );
}
