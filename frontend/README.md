# Storybook Generator — Frontend

Next.js (React) app for creating and reading AI-generated interactive storybooks.

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

## Run

Start the [backend](../backend) on port 8000, then:

```bash
npm run dev
```

Open http://localhost:3000

## Features

- Story creation: idea, category, visual style, story type, character name
- Reader layouts: side-by-side (split) and stacked (vertical)
- Page navigation and branching choices
- AI-generated page illustrations (OpenAI DALL·E 3 via the backend)

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | FastAPI backend URL |
