"use client";

import { useEffect, useRef, useState } from "react";
import { ensureNarration } from "@/lib/api";
import { isVoiceDisabled } from "@/types/story";
import type { StoryState } from "@/types/story";

interface StoryNarrationProps {
  story: StoryState;
  pageIndex: number;
  voiceRevision: number;
  onStoryUpdate: (story: StoryState) => void;
  disabled?: boolean;
}

export function StoryNarration({
  story,
  pageIndex,
  voiceRevision,
  onStoryUpdate,
  disabled = false,
}: StoryNarrationProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastNarrationKeyRef = useRef<string | null>(null);
  const lastVoiceRevisionRef = useRef(voiceRevision);
  const requestIdRef = useRef(0);

  const page = story.pages[pageIndex];
  const audioUrl = page?.audio_url ?? null;
  const voiceId = story.options.voice_id ?? "";
  const voiceDisabled = isVoiceDisabled(voiceId);
  const narrationKey = `${pageIndex}:${voiceId}`;
  const audioSrc = audioUrl
    ? `${audioUrl}${audioUrl.includes("?") ? "&" : "?"}voice=${encodeURIComponent(voiceId)}`
    : null;

  useEffect(() => {
    if (disabled || !page || voiceDisabled) {
      return;
    }

    if (audioUrl && lastNarrationKeyRef.current === narrationKey) {
      return;
    }

    const voiceJustChanged = voiceRevision !== lastVoiceRevisionRef.current;
    lastVoiceRevisionRef.current = voiceRevision;

    if (audioUrl && !voiceJustChanged) {
      lastNarrationKeyRef.current = narrationKey;
      return;
    }

    const requestId = ++requestIdRef.current;
    const forceRegenerate = Boolean(audioUrl);
    let cancelled = false;

    setLoading(true);
    setError(null);

    void ensureNarration(story.id, pageIndex, forceRegenerate)
      .then((updated) => {
        if (cancelled || requestId !== requestIdRef.current) {
          return;
        }

        const nextAudioUrl = updated.pages[pageIndex]?.audio_url;
        if (nextAudioUrl) {
          lastNarrationKeyRef.current = narrationKey;
          onStoryUpdate(updated);
        } else {
          setError("Could not generate narration for this voice.");
        }
      })
      .catch((err) => {
        if (!cancelled && requestId === requestIdRef.current) {
          setError(
            err instanceof Error ? err.message : "Could not generate narration",
          );
        }
      })
      .finally(() => {
        if (!cancelled && requestId === requestIdRef.current) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    audioUrl,
    disabled,
    narrationKey,
    onStoryUpdate,
    page,
    pageIndex,
    story.id,
    voiceDisabled,
    voiceId,
    voiceRevision,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc || voiceDisabled) {
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
  }, [audioSrc, pageIndex, voiceDisabled, voiceId]);

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
      {audioSrc && <audio ref={audioRef} src={audioSrc} preload="auto" />}
    </div>
  );
}
