"use client";

import { useEffect, useRef, useState } from "react";
import { ensureBackgroundMusic } from "@/lib/api";
import {
  DEFAULT_STORY_PREFERENCES,
  loadStoryPreferences,
  saveStoryPreferences,
} from "@/lib/storyPreferences";
import type { StoryState } from "@/types/story";

interface BackgroundMusicProps {
  story: StoryState;
  onStoryUpdate: (story: StoryState) => void;
}

function isMusicAllowed(story: StoryState): boolean {
  return (
    story.options.llm_provider === "gemini" && (story.options.music_enabled ?? false)
  );
}

export function BackgroundMusic({ story, onStoryUpdate }: BackgroundMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState(story.options.music_enabled ?? false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolume] = useState(
    () => loadStoryPreferences().music_volume ?? DEFAULT_STORY_PREFERENCES.music_volume,
  );

  const musicAllowed = isMusicAllowed(story);
  const hasAudio = Boolean(story.background_music_url);
  const showPanel =
    musicAllowed &&
    (loading || hasAudio || story.background_music_unavailable);

  useEffect(() => {
    setEnabled(story.options.music_enabled ?? false);
  }, [story.options.music_enabled]);

  useEffect(() => {
    if (
      !musicAllowed ||
      !enabled ||
      hasAudio ||
      story.background_music_unavailable
    ) {
      return;
    }

    let cancelled = false;
    setLoading(true);

    void ensureBackgroundMusic(story.id)
      .then((updated) => {
        if (!cancelled) {
          onStoryUpdate(updated);
        }
      })
      .catch(() => {
        // Background music is optional; fail silently.
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    hasAudio,
    musicAllowed,
    onStoryUpdate,
    story.background_music_unavailable,
    story.id,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = volume;

    if (musicAllowed && enabled && hasAudio) {
      if (audio.paused) {
        void audio.play().catch(() => {
          // Autoplay may be blocked until user interaction.
        });
      }
    } else {
      audio.pause();
    }
  }, [enabled, hasAudio, musicAllowed, story.background_music_url, volume]);

  function handleVolumeChange(nextVolume: number) {
    setVolume(nextVolume);
    saveStoryPreferences({
      ...loadStoryPreferences(),
      music_volume: nextVolume,
    });
    if (audioRef.current) {
      audioRef.current.volume = nextVolume;
    }
  }

  if (!showPanel) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-100 bg-white/70 px-4 py-3">
      <button
        type="button"
        onClick={() => setEnabled((value) => !value)}
        disabled={!hasAudio && loading}
        className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enabled ? "Mute music" : "Play music"}
      </button>

      <label className="flex min-w-[12rem] flex-1 items-center gap-2 text-sm text-amber-800/90">
        <span className="shrink-0 font-medium">Volume</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => handleVolumeChange(Number(e.target.value) / 100)}
          className="h-2 w-full cursor-pointer accent-amber-500"
          aria-label="Background music volume"
        />
        <span className="w-8 shrink-0 text-right tabular-nums">
          {Math.round(volume * 100)}%
        </span>
      </label>

      <p className="w-full text-sm text-amber-800/90 sm:w-auto sm:flex-1">
        {story.background_music_unavailable
          ? "Background music is unavailable for this story."
          : loading
            ? "Composing background music…"
            : enabled
              ? "Ambient loop inspired by your story genre."
              : "Background music paused."}
      </p>

      {hasAudio && (
        <audio
          ref={audioRef}
          src={story.background_music_url ?? undefined}
          loop
          preload="auto"
        />
      )}
    </div>
  );
}
