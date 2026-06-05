"use client";

import { NO_VOICE_ID } from "@/types/story";
import type { VoiceOption } from "@/types/story";

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedVoiceId: string;
  loading?: boolean;
  voicesLoading?: boolean;
  onChange: (voiceId: string) => void;
}

export function VoiceSelector({
  voices,
  selectedVoiceId,
  loading = false,
  voicesLoading = false,
  onChange,
}: VoiceSelectorProps) {
  const selectableVoices = voices.length > 0 ? voices : [];
  const selectedVoice =
    selectableVoices.find((voice) => voice.id === selectedVoiceId) ??
    selectableVoices.find((voice) => voice.id === NO_VOICE_ID) ??
    selectableVoices[0];

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
      <label htmlFor="story-voice" className="mb-2 block text-sm font-semibold text-amber-900">
        Narrator voice
      </label>
      <select
        id="story-voice"
        className="select-field"
        value={selectedVoice?.id ?? selectedVoiceId}
        disabled={loading || selectableVoices.length === 0}
        onChange={(e) => onChange(e.target.value)}
      >
        {selectableVoices.map((voice) => (
          <option
            key={voice.id}
            value={voice.id}
            disabled={voice.id !== NO_VOICE_ID && !voice.available}
          >
            {voice.label}
            {!voicesLoading && voice.id !== NO_VOICE_ID && !voice.available
              ? " (not configured)"
              : ""}
          </option>
        ))}
      </select>
      {voicesLoading && (
        <p className="mt-2 text-sm text-amber-700">
          Checking which narrators are available…
        </p>
      )}
      {selectedVoice && !voicesLoading && (
        <p className="mt-2 text-sm leading-relaxed text-amber-800/90">
          {selectedVoice.description}
        </p>
      )}
      {selectableVoices.length === 0 && (
        <p className="mt-2 text-sm text-amber-700">
          No narration voices are configured on the server yet.
        </p>
      )}
    </div>
  );
}
