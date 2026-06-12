import json
import re
from typing import Any

_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)
_TRAILING_COMMA_RE = re.compile(r",\s*([}\]])")


def _strip_fences(text: str) -> str:
    stripped = text.strip()
    if stripped.startswith("```"):
        return _FENCE_RE.sub("", stripped).strip()
    return stripped


def parse_llm_json(content: str) -> dict[str, Any]:
    text = _strip_fences(content)
    last_error: json.JSONDecodeError | None = None
    candidates: list[str] = []

    if text:
        candidates.append(text)
        candidates.append(_TRAILING_COMMA_RE.sub(r"\1", text))

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        fragment = match.group(0)
        candidates.append(fragment)
        candidates.append(_TRAILING_COMMA_RE.sub(r"\1", fragment))

    seen: set[str] = set()
    for candidate in candidates:
        if candidate in seen:
            continue
        seen.add(candidate)
        try:
            data = json.loads(candidate)
            if isinstance(data, dict):
                return data
        except json.JSONDecodeError as exc:
            last_error = exc

    if last_error is not None:
        raise last_error
    raise json.JSONDecodeError("Empty LLM response", content or "", 0)
