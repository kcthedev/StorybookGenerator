"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { SceneIllustration } from "@/components/SceneIllustration";
import { getStory, makeChoice, navigateToPage } from "@/lib/api";
import type { ReadingLayout, StoryState } from "@/types/story";

interface StoryReaderProps {
  initialStory: StoryState;
}

export function StoryReader({ initialStory }: StoryReaderProps) {
  const [story, setStory] = useState(initialStory);
  const [layout, setLayout] = useState<ReadingLayout>("split");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  const page = story.pages[story.current_page];
  const canGoBack = story.current_page > 0;
  const canGoForward = story.current_page < story.pages.length - 1;

  const refresh = useCallback(async (updater: () => Promise<StoryState>) => {
    setLoading(true);
    setError(null);
    setAnimating(true);
    try {
      const updated = await updater();
      setStory(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setTimeout(() => setAnimating(false), 300);
    }
  }, []);

  async function handleChoice(choiceId: string) {
    await refresh(() => makeChoice(story.id, choiceId));
  }

  async function goToPage(index: number) {
    await refresh(() => navigateToPage(story.id, index));
  }

  async function reloadStory() {
    await refresh(() => getStory(story.id));
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-sm font-medium text-amber-700 hover:text-amber-900"
          >
            ← New story
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-amber-950 md:text-3xl">
            {story.title}
          </h1>
          <p className="text-sm text-amber-700/80">
            Page {page.page_number} of {story.pages.length}
          </p>
        </div>
        <div className="flex gap-2">
          <LayoutButton
            active={layout === "split"}
            onClick={() => setLayout("split")}
            label="Side by side"
          />
          <LayoutButton
            active={layout === "vertical"}
            onClick={() => setLayout("vertical")}
            label="Stacked"
          />
        </div>
      </header>

      <article
        className={`reader-panel transition-opacity duration-300 ${
          animating ? "opacity-0" : "opacity-100"
        } ${layout === "split" ? "reader-split" : "reader-vertical"}`}
      >
        <div className="reader-image">
          <SceneIllustration
            sceneDescription={page.scene_description}
            visualStyle={story.options.visual_style}
            imageUrl={page.image_url}
          />
        </div>
        <div className="reader-text flex flex-col justify-between gap-6 rounded-2xl border border-amber-100 bg-white/90 p-6 shadow-sm">
          <p className="text-lg leading-relaxed text-amber-950 md:text-xl">
            {page.text}
          </p>

          {!page.is_ending && page.choices.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-amber-800">
                What does {story.options.character_name} do?
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
            <p className="rounded-xl bg-amber-100 px-4 py-3 text-center font-semibold text-amber-900">
              The End ✨
            </p>
          )}
        </div>
      </article>

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
          <button
            type="button"
            disabled={!canGoForward || loading}
            onClick={() => goToPage(story.current_page + 1)}
            className="nav-btn"
          >
            Next
          </button>
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
