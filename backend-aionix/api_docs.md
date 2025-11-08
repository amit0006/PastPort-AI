# PastPort AI Backend API Documentation

The backend is a **FastAPI** application running on port 5000. All data is transferred via JSON (except file uploads for transcription).

---

## 1. GET /api/personas

Returns a JSON object containing metadata for all historical figures.

**Response (200 OK):**
```json
{
  "einstein": {
    "name": "Albert Einstein",
    "era": "Early 20th century",
    "portrait": "/src/assets/portrait_einstein.png",
    "tts_voice": "alloy",
    "prompt": "..."
  },
  "...": "..."
}