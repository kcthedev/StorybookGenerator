from pathlib import Path

from app.config import settings

GENERATED_DIR = Path(__file__).resolve().parents[2] / "generated"


class AudioStorage:
    def story_dir(self, story_id: str) -> Path:
        dest = GENERATED_DIR / story_id
        dest.mkdir(parents=True, exist_ok=True)
        return dest

    def narration_path(self, story_id: str, page_number: int, voice_id: str = "") -> Path:
        voice_suffix = f"_{voice_id.replace(':', '_')}" if voice_id else ""
        return self.story_dir(story_id) / f"page_{page_number}{voice_suffix}_narration.mp3"

    def music_path(self, story_id: str, extension: str = "mp3") -> Path:
        return self.story_dir(story_id) / f"background_music.{extension}"

    def music_paths(self, story_id: str) -> list[Path]:
        return [
            self.music_path(story_id, "mp3"),
            self.music_path(story_id, "wav"),
        ]

    def save_bytes(self, data: bytes, dest: Path) -> str:
        dest.write_bytes(data)
        return self.public_url(dest)

    def public_url(self, file_path: Path) -> str:
        relative = file_path.relative_to(GENERATED_DIR).as_posix()
        return f"{settings.api_public_url.rstrip('/')}/generated/{relative}"

    def url_for_narration(
        self, story_id: str, page_number: int, voice_id: str = ""
    ) -> str:
        return self.public_url(self.narration_path(story_id, page_number, voice_id))

    def existing_music_path(self, story_id: str) -> Path | None:
        for path in self.music_paths(story_id):
            if path.is_file():
                return path
        return None

    def url_for_music(self, story_id: str) -> str:
        existing = self.existing_music_path(story_id)
        if existing:
            return self.public_url(existing)
        return self.public_url(self.music_path(story_id))

    def narration_exists(
        self, story_id: str, page_number: int, voice_id: str = ""
    ) -> bool:
        return self.narration_path(story_id, page_number, voice_id).is_file()

    def music_exists(self, story_id: str) -> bool:
        return self.existing_music_path(story_id) is not None
