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

const OPENAI_VOICE_DATA: Array<{ key: string; description: string }> = [
  {
    key: "alloy",
    description:
      "Neutral and balanced — a reliable all-purpose narrator for any story.",
  },
  {
    key: "ash",
    description:
      "Soft and gentle — comforting for younger listeners and calm stories.",
  },
  {
    key: "ballad",
    description:
      "Melodic and lyrical — wonderful for fairy tales and poetic narration.",
  },
  {
    key: "coral",
    description:
      "Warm and friendly — great for children's stories and upbeat adventures.",
  },
  {
    key: "echo",
    description:
      "Warm and expressive — brings emotion and presence to heartfelt scenes.",
  },
  {
    key: "fable",
    description:
      "Articulate and polished — wonderful for classic tales and fairy stories.",
  },
  {
    key: "onyx",
    description:
      "Deep and authoritative — commanding voice for epic adventures and legends.",
  },
  {
    key: "nova",
    description:
      "Energetic and friendly — perfect for upbeat heroes and lively adventures.",
  },
  {
    key: "sage",
    description:
      "Calm and thoughtful — ideal for bedtime tales and reflective moments.",
  },
  {
    key: "shimmer",
    description:
      "Soft and delicate — gentle narration for tender and quiet moments.",
  },
  {
    key: "verse",
    description:
      "Expressive storyteller — suits fantasy, mystery, and dramatic scenes.",
  },
  {
    key: "marin",
    description:
      "Clear and natural — high-quality narration for polished storytelling.",
  },
  {
    key: "cedar",
    description:
      "Rich and warm — immersive narration with depth for captivating tales.",
  },
];

const GEMINI_VOICE_DATA: Array<{
  key: string;
  gender: "Female" | "Male";
  description: string;
}> = [
  {
    key: "Achernar",
    gender: "Female",
    description:
      "Luminous and poised — carries wonder and magic through dreamy tales.",
  },
  {
    key: "Achird",
    gender: "Male",
    description:
      "Friendly and approachable — a welcoming narrator for everyday adventures.",
  },
  {
    key: "Algenib",
    gender: "Male",
    description:
      "Crisp and clear — keeps pace in action-packed and informative tales.",
  },
  {
    key: "Algieba",
    gender: "Male",
    description:
      "Warm and conversational — natural for buddy stories and dialogue.",
  },
  {
    key: "Alnilam",
    gender: "Male",
    description:
      "Steady and grounded — dependable voice for journey and quest narratives.",
  },
  {
    key: "Aoede",
    gender: "Female",
    description:
      "Warm and expressive — rich emotion for friendship and inspiring stories.",
  },
  {
    key: "Autonoe",
    gender: "Female",
    description:
      "Gentle and flowing — ideal for nature stories and peaceful journeys.",
  },
  {
    key: "Callirrhoe",
    gender: "Female",
    description:
      "Playful and amused — brings lively dialogue and humorous moments to life.",
  },
  {
    key: "Charon",
    gender: "Male",
    description:
      "Deep and authoritative — perfect for epic quests and historical tales.",
  },
  {
    key: "Despina",
    gender: "Female",
    description:
      "Soft and nurturing — comforting for younger listeners and tender scenes.",
  },
  {
    key: "Enceladus",
    gender: "Male",
    description:
      "Cool and measured — suits mystery, science fiction, and suspense.",
  },
  {
    key: "Erinome",
    gender: "Female",
    description:
      "Melodic and graceful — wonderful for fairy tales and poetic narration.",
  },
  {
    key: "Fenrir",
    gender: "Male",
    description:
      "Bold and dramatic — heightens suspense, twists, and thrilling moments.",
  },
  {
    key: "Gacrux",
    gender: "Female",
    description:
      "Steady and assured — anchors adventure stories with quiet confidence.",
  },
  {
    key: "Iapetus",
    gender: "Male",
    description:
      "Resonant and solemn — impactful for myths and moral lessons.",
  },
  {
    key: "Kore",
    gender: "Female",
    description: "Clear and balanced — a versatile narrator for any genre.",
  },
  {
    key: "Laomedeia",
    gender: "Female",
    description:
      "Bright and curious — perfect for discovery tales and eager young heroes.",
  },
  {
    key: "Leda",
    gender: "Female",
    description:
      "Warm and inviting — draws listeners into cozy, heartfelt stories.",
  },
  {
    key: "Orus",
    gender: "Male",
    description:
      "Confident and direct — drives forward momentum in exciting plots.",
  },
  {
    key: "Pulcherrima",
    gender: "Female",
    description:
      "Elegant and vivid — suits royal quests and enchanted kingdoms.",
  },
  {
    key: "Puck",
    gender: "Male",
    description:
      "Upbeat and energetic — brings comedy and adventure to life.",
  },
  {
    key: "Rasalgethi",
    gender: "Male",
    description:
      "Rich and storytelling — classic narrator tone for long-form tales.",
  },
  {
    key: "Sadachbia",
    gender: "Male",
    description:
      "Easygoing and warm — relaxed pacing for gentle humor and slice-of-life.",
  },
  {
    key: "Sadaltager",
    gender: "Male",
    description:
      "Expressive and theatrical — heightens drama and pivotal scenes.",
  },
  {
    key: "Schedar",
    gender: "Male",
    description:
      "Noble and steady — fitting for knights, heroes, and grand adventures.",
  },
  {
    key: "Sulafat",
    gender: "Female",
    description:
      "Smooth and soothing — ideal for bedtime and winding-down chapters.",
  },
  {
    key: "Umbriel",
    gender: "Male",
    description:
      "Deep and mysterious — adds atmosphere to shadowy woods and secrets.",
  },
  {
    key: "Vindemiatrix",
    gender: "Female",
    description:
      "Refined and articulate — great for legends and thoughtful fables.",
  },
  {
    key: "Zephyr",
    gender: "Female",
    description:
      "Light and breezy — adds sparkle to whimsical and fast-moving scenes.",
  },
  {
    key: "Zubenelgenubi",
    gender: "Male",
    description:
      "Distinctive and characterful — memorable for quirky tales and odd heroes.",
  },
];

function buildOpenAiVoice(key: string, description: string): VoiceOption {
  return {
    id: `openai:${key}`,
    provider: "openai",
    label: key.charAt(0).toUpperCase() + key.slice(1),
    description,
    available: true,
  };
}

function buildGeminiVoice(
  key: string,
  gender: "Female" | "Male",
  description: string,
): VoiceOption {
  return {
    id: `gemini:${key}`,
    provider: "gemini",
    label: key,
    description: `${gender} — ${description}`,
    available: true,
  };
}

export const BASE_TTS_VOICES: VoiceOption[] = [
  {
    id: NO_VOICE_ID,
    provider: "none",
    label: "No Voice",
    description:
      "Read silently — no narration or text-to-speech for this story.",
    available: true,
  },
  ...OPENAI_VOICE_DATA.map(({ key, description }) =>
    buildOpenAiVoice(key, description),
  ),
  ...GEMINI_VOICE_DATA.map(({ key, gender, description }) =>
    buildGeminiVoice(key, gender, description),
  ),
];

export function mergeLlmProviders(
  fetched: LlmProviderStatus[],
): LlmProviderStatus[] {
  return BASE_LLM_PROVIDERS.map((base) => {
    const match = fetched.find((provider) => provider.id === base.id);
    return match ?? base;
  });
}

export const MAX_NARRATOR_VOICES = 7;

export const CURATED_NARRATOR_VOICE_IDS: Record<LlmProvider, string[]> = {
  openai: [
    "openai:coral",
    "openai:nova",
    "openai:shimmer",
    "openai:marin",
    "openai:onyx",
    "openai:echo",
    "openai:cedar",
  ],
  gemini: [
    "gemini:Kore",
    "gemini:Aoede",
    "gemini:Despina",
    "gemini:Erinome",
    "gemini:Achird",
    "gemini:Charon",
    "gemini:Enceladus",
  ],
};

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

export function selectNarratorVoices(
  voices: VoiceOption[],
  llmProvider: LlmProvider = "openai",
  selectedVoiceId?: string,
): VoiceOption[] {
  const providerVoices = voices.filter(
    (voice) => voice.id !== NO_VOICE_ID && voice.provider === llmProvider,
  );
  const byId = new Map(providerVoices.map((voice) => [voice.id, voice]));
  const curatedIds = CURATED_NARRATOR_VOICE_IDS[llmProvider];
  const pool = curatedIds
    .map((id) => byId.get(id))
    .filter((voice): voice is VoiceOption => voice !== undefined);

  if (!selectedVoiceId || selectedVoiceId === NO_VOICE_ID) {
    return pool;
  }

  const selected = byId.get(selectedVoiceId);
  if (selected && !pool.some((voice) => voice.id === selected.id)) {
    return [selected, ...pool.slice(0, MAX_NARRATOR_VOICES - 1)];
  }

  return pool;
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
  const curated = selectNarratorVoices(voices, llmProvider);
  if (voiceId && filtered.some((voice) => voice.id === voiceId)) {
    return voiceId;
  }

  return (
    curated.find((voice) => voice.available)?.id ??
    curated[0]?.id ??
    filtered.find((voice) => voice.id !== NO_VOICE_ID && voice.available)?.id ??
    filtered.find((voice) => voice.id !== NO_VOICE_ID)?.id ??
    DEFAULT_VOICE_BY_LLM[llmProvider]
  );
}
