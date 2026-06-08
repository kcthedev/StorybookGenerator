from pathlib import Path

from app.config import settings

GENERATED_DIR = Path(__file__).resolve().parents[2] / "generated"


class AudioStorage:
    def story_dir(self, story_id: str) -> Path:
        dest = GENERATED_DIR / story_id
        dest.mkdir(parents=True, exist_ok=True)
        return dest

    def narration_path(self, story_id: str, page_number: int) -> Path:
        return self.story_dir(story_id) / f"page_{page_number}_narration.mp3"


    def save_bytes(self, data: bytes, dest: Path) -> str:
        dest.write_bytes(data)
        return self.public_url(dest)

    def public_url(self, file_path: Path) -> str:
        relative = file_path.relative_to(GENERATED_DIR).as_posix()
        return f"{settings.api_public_url.rstrip('/')}/generated/{relative}"

    def url_for_narration(self, story_id: str, page_number: int) -> str:
        return self.public_url(self.narration_path(story_id, page_number))

    def narration_exists(self, story_id: str, page_number: int) -> bool:
        return self.narration_path(story_id, page_number).is_file()

    def music_exists(self, story_id: str) -> bool:
        return self.existing_music_path(story_id) is not None
