import base64
from pathlib import Path

import httpx

from app.config import settings

GENERATED_DIR = Path(__file__).resolve().parents[2] / "generated"

STYLE_HINTS = {
    "cartoon": "vibrant cartoon illustration, children's picture book, bold outlines",
    "watercolor": "soft watercolor painting, gentle washes, picture book art",
    "pixel": "charming 16-bit pixel art, retro game aesthetic, limited palette",
    "realistic": "detailed digital painting, warm lighting, storybook realism",
    "storybook": "classic hand-drawn storybook illustration, whimsical and cozy",
}


class ImageService:
    def build_prompt(
        self,
        scene_description: str,
        visual_style: str,
        character_name: str,
    ) -> str:
        style_hint = STYLE_HINTS.get(visual_style, STYLE_HINTS["storybook"])
        return (
            f"{scene_description}. "
            f"Feature the main character {character_name}. "
            f"Style: {style_hint}. "
            "No text, no words, no letters in the image. "
            "Safe for children, single scene composition."
        )

    def _dest_path(self, story_id: str, page_number: int) -> Path:
        dest_dir = GENERATED_DIR / story_id
        dest_dir.mkdir(parents=True, exist_ok=True)
        return dest_dir / f"page_{page_number}.png"

    def save_from_bytes(self, data: bytes, story_id: str, page_number: int) -> str:
        self._dest_path(story_id, page_number).write_bytes(data)
        return self.public_path(story_id, page_number)

    def save_from_b64(self, b64_data: str, story_id: str, page_number: int) -> str:
        return self.save_from_bytes(base64.b64decode(b64_data), story_id, page_number)

    def save_from_url(self, url: str, story_id: str, page_number: int) -> str:
        with httpx.Client(timeout=60.0) as client:
            response = client.get(url)
            response.raise_for_status()
            return self.save_from_bytes(response.content, story_id, page_number)

    def public_path(self, story_id: str, page_number: int) -> str:
        return f"{settings.api_public_url.rstrip('/')}/generated/{story_id}/page_{page_number}.png"

    def placeholder_path(self, story_id: str, page_number: int) -> str:
        seed = f"{story_id}-{page_number}"
        return f"https://picsum.photos/seed/{seed}/1024/1024"
