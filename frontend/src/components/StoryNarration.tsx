"use client";

import { useEffect, useRef, useState } from "react";
import { ensureNarration } from "@/lib/api";
import { isVoiceDisabled } from "@/types/story";
import type { StoryState } from "@/types/story";

interface StoryNarrationProps {
  story: StoryState;
  pageIndex: number;
  onStoryUpdate: (story: StoryState) => void;
  disabled?: boolean;
}

export function StoryNarration({
  story,
  pageIndex,
  onStoryUpdate,
  disabled = false,
}: StoryNarrationProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const page = story.pages[pageIndex];
  const audioUrl = page?.audio_url ?? null;
  const voiceDisabled = isVoiceDisabled(story.options.voice_id);

  useEffect(() => {
    if (disabled || !page || voiceDisabled) {
      return;
    }

    let cancelled = false;

    async function loadNarration() {
      if (page.audio_url) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const updated = await ensureNarration(story.id, pageIndex);
        if (!cancelled) {
          onStoryUpdate(updated);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not generate narration",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadNarration();
    return () => {
      cancelled = true;
    };
  }, [disabled, onStoryUpdate, page, pageIndex, story.id, voiceDisabled]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl || voiceDisabled) {
      return;
    }

    audio.pause();
    audio.load();
    setPlaying(false);

    const playWhenReady = () => {
      void audio.play().then(() => setPlaying(true)).catch(() => {
        setPlaying(false);
      });
    };

    if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
      playWhenReady();
    } else {
      audio.addEventListener("canplaythrough", playWhenReady, { once: true });
    }

    return () => {
      audio.removeEventListener("canplaythrough", playWhenReady);
      audio.pause();
    };
  }, [audioUrl, pageIndex, voiceDisabled]);

  function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !audioUrl) {
      return;
    }

    if (audio.paused) {
      void audio.play().then(() => setPlaying(true));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  if (!page || voiceDisabled) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-100 bg-white/80 px-4 py-3">
      <button
        type="button"
        onClick={togglePlayback}
        disabled={!audioUrl || loading || disabled}
        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Preparing narration…" : playing ? "Pause narration" : "Play narration"}
      </button>
      <p className="text-sm text-amber-800/90">
        {loading
          ? "Generating voice for this page…"
          : audioUrl
            ? "Narration follows your genre and story style."
            : "Narration will appear when a voice provider is available."}
      </p>
      {error && (
        <p className="w-full text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="auto" />}
    </div>
  );
}
