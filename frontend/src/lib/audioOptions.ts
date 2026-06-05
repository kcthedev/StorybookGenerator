import type { LlmProvider, LlmProviderStatus, VoiceOption } from "@/types/story";
import { NO_VOICE_ID } from "@/types/story";

export const DEFAULT_VOICE_BY_LLM: Record<LlmProvider, string> = {
  openai: "openai:coral",
  gemini: "gemini:Kore",
};
export const BASE_LLM_PROVIDERS: LlmProviderStatus[] = [
  {
    id: "openai",
    label: "OpenAI",
    configured: false,
    available: true,
  },
  {
    id: "gemini",
    label: "Google Gemini",
    configured: false,
    available: false,
  },
];

export const BASE_TTS_VOICES: VoiceOption[] = [
  {
    id: NO_VOICE_ID,
    provider: "none",
    label: "No Voice",
    description:
      "Read silently — no narration or text-to-speech for this story.",
    available: true,
  },
  {
    id: "openai:coral",
    provider: "openai",
    label: "Coral",
    description:
      "Warm and friendly — great for children's stories and upbeat adventures.",
    available: true,
  },
  {
    id: "openai:sage",
    provider: "openai",
    label: "Sage",
    description:
      "Calm and thoughtful — ideal for bedtime tales and reflective moments.",
    available: true,
  },
  {
    id: "openai:verse",
    provider: "openai",
    label: "Verse",
    description:
      "Expressive storyteller — suits fantasy, mystery, and dramatic scenes.",
    available: true,
  },
  {
    id: "gemini:Kore",
    provider: "gemini",
    label: "Kore",
    description: "Clear and balanced — a versatile narrator for any genre.",
    available: true,
  },
  {
    id: "gemini:Charon",
    provider: "gemini",
    label: "Charon",
    description:
      "Deep and authoritative — perfect for epic quests and historical tales.",
    available: true,
  },
  {
    id: "gemini:Puck",
    provider: "gemini",
    label: "Puck",
    description:
      "Upbeat and energetic — brings comedy and adventure to life.",
    available: true,
  },
];

export function mergeLlmProviders(
  fetched: LlmProviderStatus[],
): LlmProviderStatus[] {
  return BASE_LLM_PROVIDERS.map((base) => {
    const match = fetched.find((provider) => provider.id === base.id);
    return match ?? base;
  });
}

export function mergeTtsVoices(fetched: VoiceOption[]): VoiceOption[] {
  if (fetched.length === 0) {
    return BASE_TTS_VOICES;
  }
  return fetched;
}

export function filterVoicesForLlm(
  voices: VoiceOption[],
  llmProvider: LlmProvider = "openai",
): VoiceOption[] {
  return voices.filter(
    (voice) => voice.id === NO_VOICE_ID || voice.provider === llmProvider,
  );
}

export function resolveVoiceForLlm(
  voiceId: string | undefined,
  llmProvider: LlmProvider,
  voices: VoiceOption[],
): string {
  if (voiceId === NO_VOICE_ID) {
    return NO_VOICE_ID;
  }

  const filtered = filterVoicesForLlm(voices, llmProvider);
  if (voiceId && filtered.some((voice) => voice.id === voiceId)) {
    return voiceId;
  }

  return (
    filtered.find((voice) => voice.id !== NO_VOICE_ID && voice.available)?.id ??
    filtered.find((voice) => voice.id !== NO_VOICE_ID)?.id ??
    DEFAULT_VOICE_BY_LLM[llmProvider]
  );
}
