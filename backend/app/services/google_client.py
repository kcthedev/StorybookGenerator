import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Optional

import google.auth.transport.requests
from google import genai
from google.oauth2 import service_account

from app.config import settings

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[2]


def resolve_credentials_path(credentials_path: str) -> Path | None:
    if not credentials_path.strip():
        return None
    path = Path(credentials_path.strip())
    if not path.is_absolute():
        path = BACKEND_DIR / path
    if not path.is_file():
        logger.warning("Google service account file not found: %s", path)
        return None
    return path


def project_id_from_service_account(path: Path) -> str | None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Could not read service account file %s: %s", path, exc)
        return None
    project_id = data.get("project_id")
    if isinstance(project_id, str) and project_id.strip():
        return project_id.strip()
    return None


def get_google_credentials() -> Optional[service_account.Credentials]:
    credentials_path = settings.gemini_service_account_file.strip()
    path = resolve_credentials_path(credentials_path) if credentials_path else None
    if not path:
        return None
    return service_account.Credentials.from_service_account_file(
        str(path),
        scopes=["https://www.googleapis.com/auth/cloud-platform"],
    )


def get_google_project_id() -> Optional[str]:
    project_id = settings.gemini_project_id.strip()
    if project_id:
        return project_id

    credentials_path = settings.gemini_service_account_file.strip()
    path = resolve_credentials_path(credentials_path) if credentials_path else None
    if path:
        return project_id_from_service_account(path)
    return None


def get_access_token() -> Optional[str]:
    credentials = get_google_credentials()
    if not credentials:
        return None
    credentials.refresh(google.auth.transport.requests.Request())
    return credentials.token


def build_vertex_client(location: str) -> Optional[genai.Client]:
    credentials_path = settings.gemini_service_account_file.strip()
    path = resolve_credentials_path(credentials_path) if credentials_path else None

    project_id = get_google_project_id()
    if not project_id:
        return None

    if path:
        credentials = service_account.Credentials.from_service_account_file(
            str(path),
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        return genai.Client(
            vertexai=True,
            project=project_id,
            location=location,
            credentials=credentials,
        )

    return genai.Client(
        vertexai=True,
        project=project_id,
        location=location,
    )


@lru_cache(maxsize=1)
def get_vertex_client() -> Optional[genai.Client]:
    return build_vertex_client(settings.gemini_location)


@lru_cache(maxsize=1)
def get_music_client() -> Optional[genai.Client]:
    return build_vertex_client(settings.lyria_location)
