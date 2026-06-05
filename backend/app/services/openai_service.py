import json
import logging
from typing import Any, Optional

from openai import BadRequestError, OpenAI

from app.config import settings
from app.models.story import StoryOptions, StoryPage
from app.services.image_service import ImageService
from app.services.story_text_service import StoryTextService

logger = logging.getLogger(__name__)

IMAGE_MODEL_FALLBACKS = ("gpt-image-1", "dall-e-2", "dall-e-3")


class OpenAIService(StoryTextService):
    def __init__(self) -> None:
        self._client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self._model = settings.openai_model
        self._image_model = settings.openai_image_model
        self._images = ImageService()

    @property
    def is_configured(self) -> bool:
        return self._client is not None

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
        text_service: StoryTextService,
    ) -> StoryPage:
        page = text_service.to_story_page(data, page_number)
        image_url = self.generate_scene_image(
            page.scene_description,
            options,
            story_id,
            page_number,
        )
        return page.model_copy(update={"image_url": image_url})
