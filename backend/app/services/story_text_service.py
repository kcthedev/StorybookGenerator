import json
import re
from abc import ABC, abstractmethod
from typing import Any

from app.models.story import ActionChoice, Audience, StoryOptions, StoryPage
from app.services.image_service import ImageService

CHOICE_SCHEMA_HINT = (
    'Each choice MUST be {"choice_id": "short_snake_case_id", "label": "What the character does"}. '
    "Do NOT use text, next_page, or other keys for choices."
)

DEFAULT_CHOICES = [
    ActionChoice(choice_id="continue", label="Continue the adventure"),
    ActionChoice(choice_id="explore", label="Look around carefully"),
]

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


class StoryTextService(ABC):
    @abstractmethod
    def _chat(self, system: str, user: str) -> dict[str, Any]:
        raise NotImplementedError

    def _visual_style_from_user(self, user: str) -> str:
        match = re.search(r"visual style:\s*([a-z_]+)", user, re.I)
        return match.group(1).lower() if match else "storybook"

    def _mock_scene(self, scene: str, user: str) -> str:
        style = self._visual_style_from_user(user)
        if style == "realistic":
            return f"{scene}, photorealistic, natural lighting, cinematic still."
        return f"{scene}, {style.replace('_', ' ')} style."

    def _mock_response(self, user: str) -> dict[str, Any]:
        if "first page" in user.lower() or "page 1" in user.lower():
            return {
                "title": "The Curious Adventure",
                "text": "Alex stood at the edge of a glowing forest, heart pounding with wonder and possibility.",
                "scene_description": self._mock_scene(
                    "An explorer at a luminous forest entrance, warm sunset light",
                    user,
                ),
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
                "scene_description": self._mock_scene(
                    "A joyful explorer beneath golden sunset light in a magical forest, celebratory mood",
                    user,
                ),
                "recap": (
                    "From the glowing forest entrance to the hidden path of sparkling stones, "
                    "you guided Alex through wonder and courage. Every choice led to new discoveries, "
                    "and together you found a happy ending worth remembering."
                ),
            }
        return {
            "text": "Alex pressed forward, discovering a hidden path lined with sparkling stones.",
            "scene_description": self._mock_scene(
                "A winding forest path with glowing pebbles, magical atmosphere",
                user,
            ),
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

    def _scene_guidance(self, options: StoryOptions) -> str:
        return ImageService().scene_guidance_for_llm(options.visual_style.value)

    def generate_first_page(self, options: StoryOptions) -> dict[str, Any]:
        system = (
            f"{WRITER_SYSTEM} "
            "Return valid JSON only with keys: title, text, scene_description, choices, is_ending. "
            f"choices is an array of 2-3 objects. {CHOICE_SCHEMA_HINT} "
            "scene_description is a short image prompt for the page illustration only "
            "(describe the scene, not the art medium unless it matches the visual style)."
        )
        user = (
            f"Write page 1 of an interactive story.\n"
            f"Idea: {options.idea}\n"
            f"Genre: {options.category.value}\n"
            f"Visual style: {options.visual_style.value}\n"
            f"Story type: {options.story_type.value}\n"
            f"Main character: {options.character_name}\n"
            f"{self._audience_guidance(options)}\n"
            f"{self._scene_guidance(options)}\n"
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
            "scene_description must match the visual style (describe the scene, not conflicting art mediums). "
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
            f"{self._scene_guidance(options)}\n"
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
        journey = "\n".join(f"Page {p.page_number}: {p.text}" for p in pages)
        system = (
            f"{WRITER_SYSTEM} "
            "Return valid JSON only with keys: text, scene_description, recap. "
            "text is a satisfying final page (2-4 sentences) that concludes the story. "
            "scene_description is a short image prompt for an ending illustration that matches the visual style. "
            "recap is a thoughtful 2-4 sentence summary of the whole story, "
            "highlighting the reader's choices and the character's journey."
        )
        user = (
            f"Write the final page for this interactive story.\n"
            f"Title: {title}\n"
            f"Character: {options.character_name}\n"
            f"Genre: {options.category.value}, story type: {options.story_type.value}\n"
            f"Visual style: {options.visual_style.value}\n"
            f"Reader's last choice: {last_choice_label}\n"
            f"{self._audience_guidance(options)}\n"
            f"{self._scene_guidance(options)}\n"
            f"Story so far:\n{journey}\n"
            f"End the story in a way that fits the {options.story_type.value} story type."
        )
        return self._chat(system, user)

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
