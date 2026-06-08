import Link from "next/link";
import {
  AUDIENCE_LABELS,
  GENRE_LABELS,
  STORY_TYPE_LABELS,
  ART_STYLE_LABELS,
} from "@/lib/storyLabels";
import type { StoryState } from "@/types/story";

interface StoryEndingPanelProps {
  story: StoryState;
  recap: string;
  onReadAgain: () => void;
  loading: boolean;
}

export function StoryEndingPanel({
  story,
  recap,
  onReadAgain,
  loading,
}: StoryEndingPanelProps) {
  const { idea, character_name, category, visual_style, story_type, audience } =
    story.options;
  const pageCount = story.pages.length;

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 px-5 py-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-amber-700">
          The End
        </p>
        <p className="mt-1 text-lg font-bold text-amber-950">
          Thanks for reading!
        </p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
          Story recap
        </h2>
        <p className="mt-3 text-base leading-relaxed text-amber-950">{recap}</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-white/80 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
          Story details
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-amber-900">{idea}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Protagonist" value={character_name} />
          <Stat label="Genre" value={GENRE_LABELS[category]} />
          <Stat label="Story type" value={STORY_TYPE_LABELS[story_type]} />
          <Stat label="Audience" value={AUDIENCE_LABELS[audience ?? "all_ages"]} />
          <Stat label="Visual style" value={ART_STYLE_LABELS[visual_style]} />
          <Stat label="Pages read" value={String(pageCount)} />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={loading}
          onClick={onReadAgain}
          className="flex-1 rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-50 disabled:opacity-50"
        >
          Read from the beginning
        </button>
        <Link
          href="/"
          className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-amber-600"
        >
          Create a new story
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-amber-600">
        {label}
      </p>
      <p className="mt-1 font-semibold text-amber-950">{value}</p>
    </div>
  );
}

export function buildFallbackRecap(story: StoryState): string {
  const moments = story.pages
    .filter((p) => !p.is_ending)
    .map((p) => p.text.split(/[.!?]/)[0]?.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (moments.length === 0) {
    return `You guided ${story.options.character_name} through a memorable ${GENRE_LABELS[story.options.category].toLowerCase()} story from start to finish.`;
  }

  const journey = moments.join(", then ");
  return `Together with ${story.options.character_name}, you shaped a ${story.pages.length}-page ${GENRE_LABELS[story.options.category].toLowerCase()} story—${journey.toLowerCase()}. Every choice mattered, and it all led to this ending.`;
}
