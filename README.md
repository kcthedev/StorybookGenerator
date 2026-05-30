# AI-Powered Interactive Storybook Generator

Full-stack platform for generating interactive picture-book stories from a simple idea. Users choose category, visual style, and story type, then read page-by-page with branching choices.

## Project structure

```
storybook-generator/
├── backend/          # Python + FastAPI (OpenAI, REST API)
└── frontend/         # React + Next.js (UI, reader layouts)
```

## Quick start

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Set OPENAI_API_KEY in .env (required for real story text + DALL·E images)
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
copy .env.local.example .env.local
npm run dev
```

Open **http://localhost:3000** and create a story.

## Stack

| Layer | Tech |
|-------|------|
| Backend | Python, FastAPI, OpenAI API, Pydantic |
| Frontend | React, Next.js, TypeScript, Tailwind CSS |

## API overview

- `POST /api/stories` — create story (generates first page)
- `GET /api/stories/{id}` — get story state
- `POST /api/stories/{id}/choice` — branch to next page
- `POST /api/stories/{id}/navigate/{page}` — revisit a page

Interactive docs: http://localhost:8000/docs
