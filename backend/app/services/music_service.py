import base64
import logging
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import httpx
from google.genai.errors import APIError

from app.config import settings
from app.models.story import StoryOptions
from app.services.story_tone import ending_guidance, mood_music_description
from app.services.audio_storage import AudioStorage
from app.services.google_client import (
    build_vertex_client,
    get_access_token,
    get_google_project_id,
    get_music_client,
)

logger = logging.getLogger(__name__)

LYRIA3_MODELS = ("lyria-3-clip-preview", "lyria-3-pro-preview")
LYRIA2_MODEL = "lyria-002"
LYRIA_REGION = "us-central1"

STYLE_MUSIC_HINTS: dict[str, str] = {
    "anime": "cinematic orchestral adventure with emotional swells",
    "cartoon": "playful whimsical score with light percussion",
    "crayon": "gentle playful children's music with simple melody",
    "oil_painting": "warm classical strings and rich ambient harmony",
    "pixel": "retro chiptune-inspired loop with nostalgic charm",
    "realistic": "cinematic ambient score with natural atmosphere",
    "watercolor": "soft pastoral instruments and dreamy pads",
}

MINIMAL_PROMPTS = (
    "Soft instrumental background music. Calm and gentle. No vocals, no lyrics.",
    "Light piano and strings. Instrumental only. No singing or speech.",
)


@dataclass(frozen=True)
class MusicStoryContext:
    title: str = ""
    page_text: str = ""
    scene_description: str = ""


@dataclass(frozen=True)
class MusicRoute:
    api: str
    region: str
    model: str
    extension: str


class MusicService:
    _resolved_route: Optional[MusicRoute] = None
    _interactions_disabled: bool = False

    def __init__(self) -> None:
        self._storage = AudioStorage()
        self._unavailable_stories: set[str] = set()

    @property
    def is_configured(self) -> bool:
        return get_music_client() is not None and get_google_project_id() is not None

    def is_permanently_unavailable(self, story_id: str) -> bool:
        return story_id in self._unavailable_stories

    def _active_region(self) -> str:
        configured = settings.lyria_location.strip()
        return configured or LYRIA_REGION

    @staticmethod
    def _clip(text: str, limit: int) -> str:
        cleaned = " ".join(text.split())
        if len(cleaned) <= limit:
            return cleaned
        return cleaned[: limit - 1].rstrip() + "…"

    def _story_summary(self, options: StoryOptions, context: MusicStoryContext | None) -> str:
        parts: list[str] = []
        if context and context.title.strip():
            parts.append(f'Title: "{self._clip(context.title.strip(), 80)}"')
        if options.idea.strip():
            parts.append(f"Premise: {self._clip(options.idea.strip(), 160)}")
        if context and context.page_text.strip():
            parts.append(f"Opening: {self._clip(context.page_text.strip(), 180)}")
        elif context and context.scene_description.strip():
            parts.append(
                f"Opening scene: {self._clip(context.scene_description.strip(), 160)}"
            )
        return " ".join(parts)

    def _style_hint(self, options: StoryOptions) -> str:
        return STYLE_MUSIC_HINTS.get(
            options.visual_style.value,
            "storybook-inspired instrumental score",
        )

    def build_prompt(
        self,
        options: StoryOptions,
        context: MusicStoryContext | None = None,
        *,
        compact: bool = False,
    ) -> str:
        mood = mood_music_description(options.mood)
        ending = ending_guidance(options.ending).split(".", maxsplit=1)[0]
        style = self._style_hint(options)
        audience = options.audience.value.replace("_", " ")
        story_summary = self._story_summary(options, context)

        if compact:
            core = story_summary or f"Premise: {self._clip(options.idea.strip(), 160)}"
            return (
                f"Instrumental background loop for an interactive storybook. "
                f"{core} Musical tone: {mood}, {style}. "
                f"No vocals, no lyrics."
            )

        return (
            f"Original instrumental background loop for an interactive storybook. "
            f"{story_summary} "
            f"Emotional tone: {mood}. Visual world: {style}. {ending}. "
            f"Audience: {audience}. "
            "Match the story's genre, setting, and atmosphere. "
            "No vocals, no lyrics, gentle enough to sit under narration, "
            "and suitable for looping continuously."
        )

    def _prompts_to_try(
        self,
        options: StoryOptions,
        context: MusicStoryContext | None = None,
    ) -> list[str]:
        prompts = [
            self.build_prompt(options, context, compact=True),
            self.build_prompt(options, context),
            *MINIMAL_PROMPTS,
        ]
        seen: set[str] = set()
        ordered: list[str] = []
        for prompt in prompts:
            if prompt not in seen:
                seen.add(prompt)
                ordered.append(prompt)
        return ordered

    def _configured_model(self) -> str:
        return settings.lyria_model.strip() or LYRIA2_MODEL

    def _routes_to_try(self) -> list[MusicRoute]:
        if self._resolved_route:
            return [self._resolved_route]

        region = self._active_region()
        configured = self._configured_model()
        routes: list[MusicRoute] = []

        if configured == LYRIA2_MODEL or configured.startswith("lyria-2"):
            routes.append(
                MusicRoute(
                    api="predict",
                    region=region,
                    model=LYRIA2_MODEL,
                    extension="wav",
                )
            )
            return routes

        if configured in LYRIA3_MODELS and not self._interactions_disabled:
            routes.append(
                MusicRoute(
                    api="interactions",
                    region=region,
                    model=configured,
                    extension="mp3",
                )
            )

        routes.append(
            MusicRoute(
                api="predict",
                region=region,
                model=LYRIA2_MODEL,
                extension="wav",
            )
        )
        return routes

    def _mark_unavailable(self, story_id: str) -> None:
        self._unavailable_stories.add(story_id)

    def _error_code(self, exc: Exception) -> Optional[int]:
        code = getattr(exc, "code", None)
        if isinstance(code, int):
            return code

        match = re.search(r"Error code:\s*(\d+)", str(exc))
        if match:
            return int(match.group(1))
        return None

    def _should_try_next_route(self, exc: Exception, route: MusicRoute | None = None) -> bool:
        code = self._error_code(exc)
        message = str(exc).lower()
        if code == 403 and (
            route is None
            or route.api == "interactions"
            or "interactions.create" in message
        ):
            MusicService._interactions_disabled = True
        if code in {403, 404, 400, 401}:
            return True
        return any(
            token in message
            for token in (
                "permission",
                "not found",
                "invalid argument",
                "recitation",
                "denied",
            )
        )

    def _music_dest(self, story_id: str, extension: str) -> Path:
        return self._storage.story_dir(story_id) / f"background_music.{extension}"

    def _extract_interactions_audio(self, interaction: object) -> Optional[bytes]:
        outputs = getattr(interaction, "outputs", None) or []
        for output in outputs:
            inline_data = getattr(output, "inline_data", None)
            if inline_data and inline_data.data:
                return inline_data.data
        return None

    def _generate_with_interactions(
        self,
        route: MusicRoute,
        prompt: str,
    ) -> Optional[bytes]:
        client = build_vertex_client(route.region)
        if not client:
            return None

        interaction = client.interactions.create(model=route.model, input=prompt)
        return self._extract_interactions_audio(interaction)

    def _predict_url(self, route: MusicRoute) -> str:
        project_id = get_google_project_id()
        if not project_id:
            raise RuntimeError("Google project ID is not configured")

        return (
            f"https://{route.region}-aiplatform.googleapis.com/v1/projects/"
            f"{project_id}/locations/{route.region}/publishers/google/models/"
            f"{route.model}:predict"
        )

    def _generate_with_predict(
        self,
        route: MusicRoute,
        prompt: str,
    ) -> Optional[bytes]:
        token = get_access_token()
        if not token:
            return None

        response = httpx.post(
            self._predict_url(route),
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            json={
                "instances": [
                    {
                        "prompt": prompt,
                        "negative_prompt": "vocals, singing, lyrics, words, speech",
                    }
                ],
                "parameters": {},
            },
            timeout=180.0,
        )
        if response.status_code != 200:
            raise APIError(response.status_code, response.json(), response)

        payload = response.json()
        predictions = payload.get("predictions") or []
        if not predictions:
            return None

        prediction = predictions[0]
        encoded = prediction.get("bytesBase64Encoded") or prediction.get("audioContent")
        if not encoded:
            return None
        return base64.b64decode(encoded)

    def generate_background_music(
        self,
        options: StoryOptions,
        story_id: str,
        context: MusicStoryContext | None = None,
    ) -> Optional[str]:
        if story_id in self._unavailable_stories:
            return None

        existing = self._storage.existing_music_path(story_id)
        if existing:
            return self._storage.public_url(existing)

        if not self.is_configured:
            logger.warning("Lyria music skipped: Google client not configured")
            return None

        prompts = self._prompts_to_try(options, context)
        last_error: Exception | None = None
        region = self._active_region()

        for prompt in prompts:
            for route in self._routes_to_try():
                dest = self._music_dest(story_id, route.extension)
                try:
                    if route.api == "interactions":
                        audio = self._generate_with_interactions(route, prompt)
                    else:
                        audio = self._generate_with_predict(route, prompt)

                    if audio:
                        saved = self._storage.save_bytes(audio, dest)
                        self._resolved_route = route
                        logger.info(
                            "Background music generated via %s in %s (%s)",
                            route.api,
                            route.region,
                            route.model,
                        )
                        return saved

                    logger.warning(
                        "Lyria route %s/%s/%s returned no audio",
                        route.api,
                        route.region,
                        route.model,
                    )
                except Exception as exc:
                    last_error = exc
                    if self._should_try_next_route(exc, route):
                        logger.warning(
                            "Lyria route %s/%s/%s unavailable: %s",
                            route.api,
                            route.region,
                            route.model,
                            exc,
                        )
                        if self._resolved_route == route:
                            MusicService._resolved_route = None
                        continue

                    logger.exception(
                        "Background music generation failed for story %s via %s/%s/%s: %s",
                        story_id,
                        route.api,
                        route.region,
                        route.model,
                        exc,
                    )
                    break

        if last_error:
            self._mark_unavailable(story_id)
            logger.warning(
                "Background music disabled for story %s in %s. Last error: %s",
                story_id,
                region,
                last_error,
            )
        return None
