# PastPort AI Backend (No-DB) — Hackathon MVP

## Overview
Small FastAPI backend matched to your Figma/React UI. Uses in-memory persona data (no database).
Provides OpenAI chat + ElevenLabs text-to-speech.

## Setup
1. Copy `.env.example` -> `.env` and fill `OPENAI_API_KEY` and `ELEVEN_API_KEY`.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

## Endpoints
- `GET /api/v1/personas` — list personas
- `POST /api/v1/chat?session_id=...&persona_id=...&content=...` — chat with persona
- `GET /static/audio/{file}` — get voice reply

Frontend runs on http://localhost:5000 (configured in CORS).
