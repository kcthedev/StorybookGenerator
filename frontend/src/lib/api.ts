import type { LlmProviderStatus, StoryOptions, StoryState, VoiceOption } from "@/types/story";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof err.detail === "string" ? err.detail : "Request failed",
    );
  }
  return res.json() as Promise<T>;
}

export async function getLlmProviders(): Promise<LlmProviderStatus[]> {
  const data = await request<{ providers: LlmProviderStatus[] }>(
    "/api/llm-providers",
  );
  return data.providers;
}

export async function getTtsVoices(): Promise<{
  voices: VoiceOption[];
  default_voice_id: string;
}> {
  return request("/api/tts/voices");
}

export async function updateStoryVoice(
  storyId: string,
  voiceId: string,
): Promise<StoryState> {
  const data = await request<{ story: StoryState }>(
    `/api/stories/${storyId}/voice`,
    {
      method: "POST",
      body: JSON.stringify({ voice_id: voiceId }),
    },
  );
  return data.story;
}

export async function ensureNarration(
  storyId: string,
  pageIndex: number,
  force = false,
): Promise<StoryState> {
  const query = force ? "?force=true" : "";
  const data = await request<{ story: StoryState }>(
    `/api/stories/${storyId}/pages/${pageIndex}/narration${query}`,
    { method: "POST" },
  );
  return data.story;
}

export async function createStory(
  options: StoryOptions,
): Promise<StoryState> {
  const data = await request<{ story: StoryState }>("/api/stories", {
    method: "POST",
    body: JSON.stringify(options),
  });
  return data.story;
}

export async function getStory(storyId: string): Promise<StoryState> {
  return request<StoryState>(`/api/stories/${storyId}`);
}

export async function makeChoice(
  storyId: string,
  choiceId: string,
): Promise<StoryState> {
  const data = await request<{ story: StoryState }>(
    `/api/stories/${storyId}/choice`,
    {
      method: "POST",
      body: JSON.stringify({ choice_id: choiceId }),
    },
  );
  return data.story;
}

export async function navigateToPage(
  storyId: string,
  pageIndex: number,
): Promise<StoryState> {
  return request<StoryState>(
    `/api/stories/${storyId}/navigate/${pageIndex}`,
    { method: "POST" },
  );
}
