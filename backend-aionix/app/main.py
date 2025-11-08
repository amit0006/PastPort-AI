import os, uuid, asyncio, httpx, openai
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
ELEVEN_API_KEY = os.getenv("ELEVEN_API_KEY")
EINSTEIN_VOICE_ID = os.getenv("EINSTEIN_VOICE_ID", "alloy")
GANDHI_VOICE_ID = os.getenv("GANDHI_VOICE_ID", "alloy")
CLEOPATRA_VOICE_ID = os.getenv("CLEOPATRA_VOICE_ID", "alloy")
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "http://localhost:5000").split(",")

app = FastAPI(title="PastPort AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOW_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

personas = [
    {
        "id": "einstein",
        "name": "Albert Einstein",
        "description": "Theoretical physicist who developed the theory of relativity",
        "system_prompt": "You are Albert Einstein. Speak thoughtfully with curiosity and humor about science and life.",
        "voice_id": EINSTEIN_VOICE_ID
    },
    {
        "id": "gandhi",
        "name": "Mahatma Gandhi",
        "description": "Leader of Indian independence through nonviolent resistance",
        "system_prompt": "You are Mahatma Gandhi. Speak calmly, with compassion and moral insight about peace and nonviolence.",
        "voice_id": GANDHI_VOICE_ID
    },
    {
        "id": "cleopatra",
        "name": "Cleopatra",
        "description": "Queen of Egypt, regal and strategic.",
        "system_prompt": "You are Cleopatra. Speak with grace and confidence, sharing thoughts on leadership and diplomacy.",
        "voice_id": CLEOPATRA_VOICE_ID
    }
]

conversations = {}

async def chat_with_openai(system_prompt, history, user_message):
    messages = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": user_message}]
    loop = asyncio.get_event_loop()
    def call_openai():
        return openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=messages)
    resp = await loop.run_in_executor(None, call_openai)
    return resp.choices[0].message.content.strip()

async def tts_elevenlabs(text, voice_id):
    out_dir = Path("static/audio"); out_dir.mkdir(parents=True, exist_ok=True)
    fname = f"{uuid.uuid4().hex}.mp3"; out_path = out_dir / fname
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {"xi-api-key": ELEVEN_API_KEY, "Content-Type": "application/json"}
    payload = {"text": text}
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(url, headers=headers, json=payload)
        if r.status_code not in (200,201):
            return None
        with open(out_path, "wb") as f: f.write(r.content)
    return f"/static/audio/{fname}"

@app.get("/")
def root(): return {"message": "PastPort AI Backend running"}

@app.get("/api/v1/personas")
def list_personas(): return personas

@app.post("/api/v1/chat")
async def chat(session_id: str, persona_id: str, content: str):
    persona = next((p for p in personas if p["id"] == persona_id), None)
    if not persona: raise HTTPException(404, "Persona not found")
    history = conversations.get(session_id, [])
    history.append({"role":"user","content":content})
    reply = await chat_with_openai(persona["system_prompt"], history, content)
    history.append({"role":"assistant","content":reply})
    conversations[session_id] = history[-10:]
    audio_url = await tts_elevenlabs(reply, persona["voice_id"]) if ELEVEN_API_KEY else None
    return {"reply": reply, "audio_url": audio_url}

@app.get("/static/audio/{filename}")
async def get_audio(filename:str):
    path = Path("static/audio")/filename
    if not path.exists(): raise HTTPException(404,"File not found")
    return FileResponse(path, media_type="audio/mpeg")
