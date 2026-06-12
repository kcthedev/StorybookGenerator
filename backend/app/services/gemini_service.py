import json
import logging
from pathlib import Path
from typing import Any, Optional

from google import genai
from google.genai import types
from google.oauth2 import service_account

from app.config import settings
from app.services.llm_json import parse_llm_json
from app.services.story_text_service import StoryTextService

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[2]


def _resolve_credentials_path(credentials_path: str) -> Path | None:
    if not credentials_path.strip():
        return None
    path = Path(credentials_path.strip())
    if not path.is_absolute():
        path = BACKEND_DIR / path
    if not path.is_file():
        logger.warning("Gemini service account file not found: %s", path)
        return None
    return path


def _project_id_from_service_account(path: Path) -> str | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Could not read Gemini service account file %s: %s", path, exc)
        return None
    project_id = data.get("project_id")
    if isinstance(project_id, str) and project_id.strip():
        return project_id.strip()
    logger.warning("Gemini service account file %s has no project_id", path)
    return None


class GeminiService(StoryTextService):
    def __init__(self) -> None:
        self._model = settings.gemini_model
        self._client: Optional[genai.Client] = None

        credentials_path = settings.gemini_service_account_file.strip()
        path = _resolve_credentials_path(credentials_path) if credentials_path else None

        project_id = settings.gemini_project_id.strip()
        if not project_id and path:
            project_id = _project_id_from_service_account(path) or ""
        if not project_id:
            return

        if path:
            credentials = service_account.Credentials.from_service_account_file(
                str(path),
                scopes=["https://www.googleapis.com/auth/cloud-platform"],
            )
            self._client = genai.Client(
                vertexai=True,
                project=project_id,
                location=settings.gemini_location,
                credentials=credentials,
            )
        else:
            self._client = genai.Client(
                vertexai=True,
                project=project_id,
                location=settings.gemini_location,
            )

    @property
    def is_configured(self) -> bool:
        return self._client is not None

    def _chat(self, system: str, user: str) -> dict[str, Any]:
        if not self._client:
            return self._mock_response(user)

        last_error: json.JSONDecodeError | None = None
        for attempt in range(2):
            response = self._client.models.generate_content(
                model=self._model,
                contents=user,
                config=types.GenerateContentConfig(
                    system_instruction=system,
                    response_mime_type="application/json",
                    temperature=0.8,
                ),
            )
            content = response.text or "{}"
            try:
                return parse_llm_json(content)
            except json.JSONDecodeError as exc:
                last_error = exc
                logger.warning(
                    "Gemini JSON parse failed on attempt %s: %s",
                    attempt + 1,
                    exc,
                )

        assert last_error is not None
        raise last_error
