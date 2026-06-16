"use client";

import type { VoiceOption } from "@/types/story";

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedVoiceId: string;
  narrationEnabled: boolean;
  loading?: boolean;
  voicesLoading?: boolean;
  onNarrationEnabledChange: (enabled: boolean) => void;
  onChange: (voiceId: string) => void;
}

export function VoiceSelector({
  voices,
  selectedVoiceId,
  narrationEnabled,
  loading = false,
  voicesLoading = false,
  onNarrationEnabledChange,
  onChange,
}: VoiceSelectorProps) {
  const selectableVoices = voices.length > 0 ? voices : [];
  const selectedVoice =
    selectableVoices.find((voice) => voice.id === selectedVoiceId) ??
    selectableVoices[0];

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
      <label
        className={`flex items-start gap-3 ${
          loading ? "cursor-not-allowed opacity-70" : "cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
          checked={narrationEnabled}
          disabled={loading}
          onChange={(e) => onNarrationEnabledChange(e.target.checked)}
        />
        <span>
          <span className="block text-sm font-semibold text-amber-900">
            Narrator voice
          </span>
          <span className="mt-1 block text-sm text-amber-800/90">
            {narrationEnabled
              ? "Read each page aloud with the voice you choose below."
              : "Read silently — no text-to-speech for this story."}
          </span>
        </span>
      </label>

      {narrationEnabled && (
        <div className="mt-4 space-y-2">
          <label htmlFor="story-voice" className="block text-sm font-medium text-amber-900">
            Voice
          </label>
          <select
            id="story-voice"
            className="select-field"
            value={selectedVoice?.id ?? selectedVoiceId}
            disabled={loading || selectableVoices.length === 0}
            onChange={(e) => onChange(e.target.value)}
          >
            {selectableVoices.map((voice) => (
              <option key={voice.id} value={voice.id} disabled={!voice.available}>
                {voice.label}
                {!voicesLoading && !voice.available ? " (not configured)" : ""}
              </option>
            ))}
          </select>
          {voicesLoading && (
            <p className="text-sm text-amber-700">
              Checking which narrators are available…
            </p>
          )}
          {selectedVoice && !voicesLoading && (
            <p className="text-sm leading-relaxed text-amber-800/90">
              {selectedVoice.description}
            </p>
          )}
          {selectableVoices.length === 0 && !voicesLoading && (
            <p className="text-sm text-amber-700">
              No narration voices are configured on the server yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
