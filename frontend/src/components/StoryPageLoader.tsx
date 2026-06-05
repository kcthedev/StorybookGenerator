"use client";

import { useEffect, useState } from "react";

const GENERATING_MESSAGES = [
  "Writing the next page…",
  "Shaping the story…",
  "Painting the scene…",
  "Recording narration…",
  "Almost there…",
];

const NAVIGATING_MESSAGES = ["Turning the page…", "Loading page…"];

interface StoryPageLoaderProps {
  active: boolean;
  choiceLabel?: string | null;
  mode?: "generating" | "navigating";
}

export function StoryPageLoader({
  active,
  choiceLabel,
  mode = "generating",
}: StoryPageLoaderProps) {
  const messages =
    mode === "generating" ? GENERATING_MESSAGES : NAVIGATING_MESSAGES;
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!active) {
      setMessageIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2800);

    return () => window.clearInterval(interval);
  }, [active, messages.length]);

  if (!active) {
    return null;
  }

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-amber-50/75 p-6 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-sm rounded-2xl border border-amber-200/80 bg-white/95 px-6 py-8 text-center shadow-lg">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center">
          <span className="reader-spinner" aria-hidden="true" />
        </div>

        <p className="text-base font-semibold text-amber-950">
          {messages[messageIndex]}
        </p>

        {choiceLabel && (
          <p className="mt-3 text-sm leading-relaxed text-amber-800">
            You chose:{" "}
            <span className="font-medium text-amber-950">{choiceLabel}</span>
          </p>
        )}

        <p className="mt-4 text-xs text-amber-600/90">
          {mode === "generating"
            ? "New story text, illustration, and narration are being created."
            : "Fetching this page from your story."}
        </p>
      </div>
    </div>
  );
}
