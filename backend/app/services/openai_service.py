import json
import logging
import re
from typing import Any, Optional

from openai import BadRequestError, OpenAI

from app.config import settings
from app.models.story import ActionChoice, Audience, StoryOptions, StoryPage
from app.services.image_service import ImageService

logger = logging.getLogger(__name__)

CHOICE_SCHEMA_HINT = (
    'Each choice MUST be {"choice_id": "short_snake_case_id", "label": "What the character does"}. '
    "Do NOT use text, next_page, or other keys for choices."
)

DEFAULT_CHOICES = [
    ActionChoice(choice_id="continue", label="Continue the adventure"),
    ActionChoice(choice_id="explore", label="Look around carefully"),
]

IMAGE_MODEL_FALLBACKS = ("gpt-image-1", "dall-e-2", "dall-e-3")

WRITER_SYSTEM = (
    "You are a skilled interactive fiction writer for illustrated storybooks. "
    "Adapt tone, vocabulary, and themes to the target audience while honoring "
    "the chosen genre, story type, and idea. Stories can be playful, epic, "
    "mysterious, romantic, thoughtful, or dramatic as appropriate."
)

AUDIENCE_GUIDANCE = {
    Audience.ALL_AGES: (
        "Audience: all ages. Use clear, engaging prose that anyone can enjoy. "
        "Keep content family-friendly with no graphic violence or explicit material."
    ),
    Audience.TEEN: (
        "Audience: teen and young adult. Use richer emotional stakes, sharper dialogue, "
        "and coming-of-age themes when they fit. Avoid graphic or explicit content."
    ),
    Audience.ADULT: (
        "Audience: adult. Use sophisticated prose and nuanced characters. "
        "Mature themes are allowed when the story type calls for them, "
        "but avoid gratuitous gore or explicit sexual content."
    ),
}


class OpenAIService:
    def __init__(self) -> None:
        self._client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self._model = settings.openai_model
        self._image_model = settings.openai_image_model
        self._images = ImageService()

    def _chat(self, system: str, user: str) -> dict[str, Any]:
        if not self._client:
            return self._mock_response(user)

        response = self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            response_format={"type": "json_object"},
            temperature=0.8,
        )
        content = response.choices[0].message.content or "{}"
        return json.loads(content)

    def _mock_response(self, user: str) -> dict[str, Any]:
        if "first page" in user.lower() or "page 1" in user.lower():
            return {
                "title": "The Curious Adventure",
                "text": "Alex stood at the edge of a glowing forest, heart pounding with wonder and possibility.",
                "scene_description": "An explorer at a luminous forest entrance, cartoon style, warm sunset light.",
                "choices": [
                    {"choice_id": "enter", "label": "Step into the forest"},
                    {"choice_id": "call", "label": "Call out for a friend"},
                ],
                "is_ending": False,
            }
        if "final page" in user.lower():
            return {
                "text": (
                    "Alex took a deep breath and smiled—the forest had shared its greatest secret, "
                    "and the adventure would live forever in their heart."
                ),
                "scene_description": (
                    "A joyful explorer beneath golden sunset light in a magical forest, "
                    "cartoon style, celebratory mood."
                ),
                "recap": (
                    "From the glowing forest entrance to the hidden path of sparkling stones, "
                    "you guided Alex through wonder and courage. Every choice led to new discoveries, "
                    "and together you found a happy ending worth remembering."
                ),
            }
        return {
            "text": "Alex pressed forward, discovering a hidden path lined with sparkling stones.",
            "scene_description": "A winding forest path with glowing pebbles, cartoon style, magical atmosphere.",
            "choices": [
                {"choice_id": "follow", "label": "Follow the glowing path"},
                {"choice_id": "rest", "label": "Rest and listen to the woods"},
            ],
            "is_ending": False,
        }

    def _slugify(self, value: str) -> str:
        slug = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
        return slug[:40] or "choice"

    def _normalize_choices(self, raw: Any) -> list[ActionChoice]:
        if not isinstance(raw, list) or not raw:
            return list(DEFAULT_CHOICES)

        normalized: list[ActionChoice] = []
        for index, item in enumerate(raw):
            if isinstance(item, str):
                label = item.strip()
                if label:
                    normalized.append(
                        ActionChoice(
                            choice_id=self._slugify(label),
                            label=label,
                        )
                    )
                continue

            if not isinstance(item, dict):
                continue

            label = (
                item.get("label")
                or item.get("text")
                or item.get("description")
                or item.get("action")
                or ""
            )
            if isinstance(label, str):
                label = label.strip()
            else:
                label = str(label).strip() if label else ""

            if not label:
                continue

            choice_id = item.get("choice_id") or item.get("id") or self._slugify(label)
            if isinstance(choice_id, str):
                choice_id = self._slugify(choice_id)
            else:
                choice_id = f"choice_{index + 1}"

            normalized.append(ActionChoice(choice_id=choice_id, label=label))

        return normalized if normalized else list(DEFAULT_CHOICES)

    def _audience_guidance(self, options: StoryOptions) -> str:
        return AUDIENCE_GUIDANCE.get(
            options.audience, AUDIENCE_GUIDANCE[Audience.ALL_AGES]
        )

    def generate_first_page(self, options: StoryOptions) -> dict[str, Any]:
        system = (
            f"{WRITER_SYSTEM} "
            "Return valid JSON only with keys: title, text, scene_description, choices, is_ending. "
            f"choices is an array of 2-3 objects. {CHOICE_SCHEMA_HINT} "
            "scene_description is a short image prompt for the page illustration."
        )
        user = (
            f"Write page 1 of an interactive story.\n"
            f"Idea: {options.idea}\n"
            f"Genre: {options.category.value}\n"
            f"Visual style: {options.visual_style.value}\n"
            f"Story type: {options.story_type.value}\n"
            f"Main character: {options.character_name}\n"
            f"{self._audience_guidance(options)}\n"
            f"Keep text 2-4 sentences, vivid and engaging."
        )
        return self._chat(system, user)

    def generate_next_page(
        self,
        options: StoryOptions,
        page_number: int,
        previous_text: str,
        choice_label: str,
        total_pages: int,
    ) -> dict[str, Any]:
        system = (
            f"{WRITER_SYSTEM} "
            "Return valid JSON only with keys: text, scene_description, choices, is_ending, recap. "
            f"choices is an array of 2-3 objects. {CHOICE_SCHEMA_HINT} "
            "If this should be the final page (page >= max), set is_ending true and choices to []. "
            "When is_ending is true, include recap: a thoughtful 2-4 sentence summary of the whole "
            "story celebrating what the reader and character experienced together."
        )
        user = (
            f"Continue the story on page {page_number} (max {total_pages} pages).\n"
            f"Previous page: {previous_text}\n"
            f"Reader chose: {choice_label}\n"
            f"Genre: {options.category.value}, style: {options.visual_style.value}, "
            f"type: {options.story_type.value}, character: {options.character_name}.\n"
            f"{self._audience_guidance(options)}\n"
            f"Provide 2-3 choices unless is_ending is true."
        )
        return self._chat(system, user)

    def generate_forced_ending(
        self,
        options: StoryOptions,
        title: str,
        pages: list[StoryPage],
        last_choice_label: str,
    ) -> dict[str, Any]:
        journey = "\n".join(
            f"Page {p.page_number}: {p.text}" for p in pages
        )
        system = (
            f"{WRITER_SYSTEM} "
            "Return valid JSON only with keys: text, scene_description, recap. "
            "text is a satisfying final page (2-4 sentences) that concludes the story. "
            "scene_description is a short image prompt for an ending illustration. "
            "recap is a thoughtful 2-4 sentence summary of the whole story, "
            "highlighting the reader's choices and the character's journey."
        )
        user = (
            f"Write the final page for this interactive story.\n"
            f"Title: {title}\n"
            f"Character: {options.character_name}\n"
            f"Genre: {options.category.value}, story type: {options.story_type.value}\n"
            f"Reader's last choice: {last_choice_label}\n"
            f"{self._audience_guidance(options)}\n"
            f"Story so far:\n{journey}\n"
            f"End the story in a way that fits the {options.story_type.value} story type."
        )
        return self._chat(system, user)

    def _image_models_to_try(self) -> list[str]:
        configured = self._image_model.strip()
        ordered: list[str] = [configured] if configured else []
        for model in IMAGE_MODEL_FALLBACKS:
            if model not in ordered:
                ordered.append(model)
        return ordered

    def _image_generate_kwargs(self, model: str, prompt: str) -> dict[str, Any]:
        kwargs: dict[str, Any] = {"model": model, "prompt": prompt, "n": 1}
        if model.startswith("gpt-image"):
            kwargs.update(
                size="1024x1024",
                quality="medium",
                output_format="png",
            )
        elif model == "dall-e-3":
            kwargs.update(size="1024x1024", quality="standard")
        else:
            kwargs.update(size="1024x1024")
        return kwargs

    def _persist_generated_image(
        self, response_data: Any, story_id: str, page_number: int
    ) -> Optional[str]:
        item = response_data[0]
        if getattr(item, "url", None):
            return self._images.save_from_url(item.url, story_id, page_number)
        if getattr(item, "b64_json", None):
            return self._images.save_from_b64(item.b64_json, story_id, page_number)
        return None

    def generate_scene_image(
        self,
        scene_description: str,
        options: StoryOptions,
        story_id: str,
        page_number: int,
    ) -> Optional[str]:
        prompt = self._images.build_prompt(
            scene_description,
            options.visual_style.value,
            options.character_name,
        )
        if not self._client:
            return self._images.placeholder_path(story_id, page_number)

        last_error: Exception | None = None
        for model in self._image_models_to_try():
            try:
                response = self._client.images.generate(
                    **self._image_generate_kwargs(model, prompt)
                )
                saved = self._persist_generated_image(response.data, story_id, page_number)
                if saved:
                    if model != self._image_model:
                        logger.info("Image generated with fallback model %s", model)
                    return saved
            except BadRequestError as exc:
                last_error = exc
                err = str(exc).lower()
                if "does not exist" in err or "invalid_value" in err or "not found" in err:
                    logger.warning("Image model %s unavailable, trying next", model)
                    continue
                logger.exception(
                    "Image generation failed for story %s page %s", story_id, page_number
                )
                break
            except Exception as exc:
                last_error = exc
                logger.exception(
                    "Image generation failed for story %s page %s", story_id, page_number
                )
                break

        if last_error:
            logger.error("All image models failed: %s", last_error)
        return self._images.placeholder_path(story_id, page_number)

    def build_story_page(
        self,
        data: dict[str, Any],
        page_number: int,
        options: StoryOptions,
        story_id: str,
    ) -> StoryPage:
        page = self.to_story_page(data, page_number)
        image_url = self.generate_scene_image(
            page.scene_description,
            options,
            story_id,
            page_number,
        )
        return page.model_copy(update={"image_url": image_url})

    def to_story_page(self, data: dict[str, Any], page_number: int) -> StoryPage:
        is_ending = bool(data.get("is_ending", False))
        recap = data.get("recap")
        if is_ending and isinstance(recap, str):
            recap = recap.strip() or None
        else:
            recap = None
        return StoryPage(
            page_number=page_number,
            text=data.get("text", ""),
            scene_description=data.get("scene_description", ""),
            choices=self._normalize_choices(data.get("choices", [])),
            is_ending=is_ending,
            recap=recap,
        )
