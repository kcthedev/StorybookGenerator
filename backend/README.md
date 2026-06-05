# Storybook Generator — Backend

Python FastAPI service for AI-powered interactive story generation.

## Prerequisites

- **Recommended:** Python 3.11 or 3.12 (most reliable for local dev)
- **Also supported:** Python 3.10 and 3.13
- **Python 3.14:** supported via `pydantic>=2.12` (included in `requirements.txt`); if install still fails, use 3.12 instead
- **macOS / Linux:** `python3` on your PATH (install via [Homebrew](https://brew.sh) with `brew install python@3.12` if needed)
- **Windows:** `python` on your PATH from [python.org](https://www.python.org/downloads/) or the Microsoft Store

Check your version:

```bash
python3 --version   # macOS / Linux
python --version    # Windows
```

## Setup

From the repository root:

```bash
cd backend
```

Create a virtual environment (use `python3` on macOS/Linux if `python` is not available):

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
```

**Windows (PowerShell or CMD)**

```bash
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` and set `OPENAI_API_KEY` (and other values if needed). See `.env.example` for all options.

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Real story and image generation (optional for local dev; mock data is used if empty) |
| `OPENAI_MODEL` | OpenAI text model (default `gpt-4o-mini`) |
| `OPENAI_IMAGE_MODEL` | Image model (default `gpt-image-1`) |
| `GEMINI_PROJECT_ID` | GCP project ID for Gemini (optional if `project_id` is in the service account JSON) |
| `GEMINI_LOCATION` | Vertex AI region (default `us-central1`) |
| `GEMINI_MODEL` | Gemini text model (default `gemini-2.5-flash`) |
| `GEMINI_SERVICE_ACCOUNT_FILE` | Path to the service account JSON (default `google_config.json`) |
| `CORS_ORIGINS` | Allowed frontend origin(s) (default `http://localhost:3000`) |
| `API_PUBLIC_URL` | Base URL for generated image links (default `http://localhost:8000`) |

### Google Gemini (optional)

Story **text** can be generated with OpenAI or Gemini. **Images always use OpenAI** (`OPENAI_IMAGE_MODEL`).

To enable Gemini:

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project with the **Vertex AI API** enabled.
2. Create a **service account** with permission to use Vertex AI (for example, the *Vertex AI User* role).
3. Download the service account key as a JSON file.
4. Save it in this folder as `backend/google_config.json` (or another local path and point `GEMINI_SERVICE_ACCOUNT_FILE` at it).
5. Optionally set `GEMINI_PROJECT_ID` in `.env`. If omitted, the project ID is read from the `project_id` field in `google_config.json`.

Example `.env` entries:

```env
# GEMINI_PROJECT_ID is optional when google_config.json includes project_id
GEMINI_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash
GEMINI_SERVICE_ACCOUNT_FILE=google_config.json
```

**Keep credentials private.** `google_config.json` contains a private key and must never be committed, pushed, or published.

- It is listed in the repo root `.gitignore` as `backend/google_config.json`.
- Do not rename it to something that is not ignored, and do not paste its contents into issues, PRs, or chat.
- Before your first commit, verify Git is ignoring it:

```bash
git check-ignore -v backend/google_config.json
```

You should see a line referencing `.gitignore`. If the file was ever committed by mistake, remove it from Git history and rotate the service account key in GCP.

Check which LLM providers are ready:

```bash
curl http://localhost:8000/api/llm-providers
```

## Run

Activate the virtual environment in each new terminal session, then start the server.

**macOS / Linux**

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Windows**

```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/docs

Quick verify (macOS / Linux):

```bash
curl http://localhost:8000/health
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/llm-providers` | List configured LLM providers (OpenAI, Gemini) |
| GET | `/api/stories` | List stories |
| POST | `/api/stories` | Create story (first page) |
| GET | `/api/stories/{id}` | Get story state |
| POST | `/api/stories/{id}/choice` | Branch via character action |
| POST | `/api/stories/{id}/navigate/{page}` | Go to a previous page |

Without `OPENAI_API_KEY`, the API returns mock story text and placeholder images. Gemini requires a valid service account file; if it is missing, Gemini appears as unavailable in `/api/llm-providers`.

Each page calls OpenAI image generation (`OPENAI_IMAGE_MODEL`, default `gpt-image-1`) with automatic fallback to `dall-e-2` / `dall-e-3`. Images are saved under `backend/generated/` and served at `/generated/{story_id}/page_{n}.png`. `backend/generated/` is also gitignored.
## Troubleshooting

### `Failed building wheel for pydantic-core`

This usually means pip tried to compile `pydantic-core` from source instead of using a pre-built wheel. Common causes:

1. **Python version too new** — Homebrew or pyenv may default to Python 3.14. Older pinned `pydantic` versions do not ship wheels for it.
2. **Outdated pip** — an old pip may not pick up the correct wheel.

**Fix (try in order):**

```bash
cd backend
rm -rf .venv
python3 --version          # note the version
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If it still fails on **Python 3.14**, use Python 3.12 (recommended):

```bash
# macOS with Homebrew
brew install python@3.12
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

```bash
# macOS with pyenv
pyenv install 3.12.10
pyenv local 3.12.10
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

**Windows:** delete `.venv`, recreate with `py -3.12 -m venv .venv`, then activate and run `pip install -r requirements.txt` again.
