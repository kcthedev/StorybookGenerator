# Storybook Generator — Backend

Python FastAPI service for AI-powered interactive story generation.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env     # add OPENAI_API_KEY
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/stories` | List stories |
| POST | `/api/stories` | Create story (first page) |
| GET | `/api/stories/{id}` | Get story state |
| POST | `/api/stories/{id}/choice` | Branch via character action |
| POST | `/api/stories/{id}/navigate/{page}` | Go to a previous page |

Without `OPENAI_API_KEY`, the API returns mock story text and placeholder images.

Each page calls OpenAI image generation (`OPENAI_IMAGE_MODEL`, default `gpt-image-1`) with automatic fallback to `dall-e-2` / `dall-e-3`. Images are saved under `backend/generated/` and served at `/generated/{story_id}/page_{n}.png`.
