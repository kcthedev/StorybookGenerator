"use client";

import { useState } from "react";
import { VoiceSelector } from "@/components/VoiceSelector";
import type { LlmProvider, LlmProviderStatus, VoiceOption } from "@/types/story";

interface AdvancedStorySettingsProps {
  llmProvider: LlmProvider;
  llmProviders: LlmProviderStatus[];
  voices: VoiceOption[];
  selectedVoiceId: string;
  voicesLoading: boolean;
  musicEnabled: boolean;
  onLlmProviderChange: (provider: LlmProvider) => void;
  onVoiceChange: (voiceId: string) => void;
  onMusicEnabledChange: (enabled: boolean) => void;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
      className={`h-5 w-5 shrink-0 text-amber-700 transition-transform duration-200 ${
        open ? "rotate-180" : ""
      }`}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function AdvancedStorySettings({
  llmProvider,
  llmProviders,
  voices,
  selectedVoiceId,
  voicesLoading,
  musicEnabled,
  onLlmProviderChange,
  onVoiceChange,
  onMusicEnabledChange,
}: AdvancedStorySettingsProps) {
  const [open, setOpen] = useState(false);
  const musicAvailable = llmProvider === "gemini";

  const llmLabel =
    llmProviders.find((provider) => provider.id === llmProvider)?.label ??
    llmProvider;
  const voiceLabel =
    voices.find((voice) => voice.id === selectedVoiceId)?.label ?? "Default";

  const summaryParts = [llmLabel, voiceLabel];
  if (musicAvailable && musicEnabled) {
    summaryParts.push("Music on");
  }

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/30">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-amber-50/60"
      >
        <div className="min-w-0">
          <span className="text-sm font-semibold text-amber-900">Advanced</span>
          {!open && (
            <span className="mt-0.5 block truncate text-sm text-amber-700/90">
              {summaryParts.join(" · ")}
            </span>
          )}
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-amber-100 px-4 py-4">
          <div>
            <label
              htmlFor="llm_provider"
              className="mb-2 block text-sm font-semibold text-amber-900"
            >
              Story writer (LLM)
            </label>
            <select
              id="llm_provider"
              className="select-field"
              value={llmProvider}
              onChange={(e) =>
                onLlmProviderChange(e.target.value as LlmProvider)
              }
            >
              {llmProviders.map((provider) => (
                <option
                  key={provider.id}
                  value={provider.id}
                  disabled={!provider.available}
                >
                  {provider.label}
                  {!provider.available ? " (not configured)" : ""}
                  {provider.available && !provider.configured
                    ? " (demo mode)"
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <VoiceSelector
            voices={voices}
            selectedVoiceId={selectedVoiceId}
            voicesLoading={voicesLoading}
            onChange={onVoiceChange}
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
                checked={musicAvailable ? musicEnabled : false}
                disabled={!musicAvailable}
                onChange={(e) => onMusicEnabledChange(e.target.checked)}
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
        </div>
      )}
    </div>
  );
}
