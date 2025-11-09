import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv

# --- Load Environment Variables FIRST (FIXED PATH) ---
DOTENV_PATH = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=DOTENV_PATH) 
# --- END LOAD ---

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.responses import JSONResponse, FileResponse, Response 
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from typing import List, Optional

# --- FIX FOR ModuleNotFoundError / ImportError ---
import sys
sys.path.append(str(Path(__file__).parent)) 
# --- END FIX ---

# Import local utilities
from utils_tts import generate_tts, TEMP_AUDIO_DIR
from utils_whisper import transcribe_audio

# --- SETUP AND CONFIGURATION ---

# Global client variable must be defined as None
client = None 
LLM_MODEL = "gemini-2.5-flash-lite" # The model used for chat completions

# Load personas data
try:
    with open('personas.json', 'r') as f:
        PERSONAS = json.load(f)
except FileNotFoundError:
    print("Error: personas.json not found.")
    PERSONAS = {}
    
TEMP_AUDIO_DIR = Path("tmp_audio")
TEMP_AUDIO_DIR.mkdir(exist_ok=True)

BANNED_WORDS = ["bomb", "kill", "attack", "suicide", "harm"]

app = FastAPI(title="PastPort AI Backend (Text + Speech)")

# Configure CORS
ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOW_ORIGINS if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas for Request Bodies ---

class HistoryItem(BaseModel):
    role: str
    text: str

class ChatPayload(BaseModel):
    persona: str
    message: str
    history: List[HistoryItem] = []

class TTSPayload(BaseModel):
    persona: str
    text: str

# --- CORE CLIENT INITIALIZATION FIX ---

def get_or_initialize_gemini_client():
    """Initializes the global client lazily, ensuring environment secrets are loaded."""
    global client
    if client is not None:
        return client

    # Read the key only when the function is called
    GEMINI_KEY = os.getenv("GEMINI_API_KEY")
    
    if not GEMINI_KEY:
        raise HTTPException(
            status_code=503, 
            detail="LLM_api_unavailable: GEMINI_API_KEY is missing from environment secrets."
        )

    try:
        # Initialize and store the client globally
        client = genai.Client(api_key=GEMINI_KEY)
        return client
    except Exception as e:
        # Catch any connection or API key error during late initialization
        raise HTTPException(status_code=503, detail=f"LLM_api_unavailable: Gemini client failed to connect. {e}")


# --- HELPER FUNCTIONS ---

def sanitize_message(message: str) -> bool:
    """Simple safety check for banned words."""
    message_lower = message.lower()
    return any(word in message_lower for word in BANNED_WORDS)

def convert_history_to_gemini_format(history: List[HistoryItem], system_prompt: str, user_message: str) -> List[types.Content]:
    """Converts the history list into the Gemini SDK Content format."""
    
    gemini_contents = []
    
    if not history:
        gemini_contents.append(
            types.Content(
                role="user", 
                parts=[types.Part.from_text(text=f"[SYSTEM INSTRUCTION: {system_prompt}] {user_message}")]
            )
        )
        return gemini_contents

    else:
        first_turn_user_text = history[0].text
        
        gemini_contents.append(
            types.Content(
                role="user", 
                parts=[types.Part.from_text(text=f"[SYSTEM INSTRUCTION: {system_prompt}] {first_turn_user_text}")]
            )
        )

        for turn in history[1:]: 
            role = "user" if turn.role == "user" else "model" 
            gemini_contents.append(
                types.Content(
                    role=role, 
                    parts=[types.Part.from_text(text=turn.text)]
                )
            )
        
        gemini_contents.append(
            types.Content(
                role="user", 
                parts=[types.Part.from_text(text=user_message)]
            )
        )
        return gemini_contents


# --- CORE PROCESSING FUNCTION (Uses the lazy client) ---

async def generate_response_and_audio(persona_id: str, user_message: str, history: List[HistoryItem]):
    """Generates the LLM reply and the corresponding audio URL."""
    
    # CRITICAL: Initialize client here when the function is first called
    local_client = get_or_initialize_gemini_client() 

    if persona_id not in PERSONAS:
        raise HTTPException(status_code=404, detail="Persona not found")
    
    persona = PERSONAS[persona_id]
    system_prompt = persona['prompt']
    
    gemini_contents = convert_history_to_gemini_format(history[-6:], system_prompt, user_message)

    try:
        # 1. GENERATE TEXT REPLY (Using local_client)
        response = local_client.models.generate_content(
            model=LLM_MODEL, 
            contents=gemini_contents,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=300
            )
        )
        ai_reply_text = response.text.strip() if response.text else None
        
        if not ai_reply_text:
            ai_reply_text = "I apologize, the stream of history is momentarily obscured. Please rephrase your question."

        # 2. GENERATE AUDIO 
        audio_url = await generate_tts(persona_id, ai_reply_text, PERSONAS)
        
    except HTTPException as e:
        # Re-raise explicit HTTP exceptions
        raise e
    except Exception as e:
        print(f"Gemini/TTS Error: {e}")
        # If any step fails, return the error message in the reply text, and no audio.
        return {"reply": f"SYSTEM ERROR: Audio generation failed ({e}). Text reply available.", "audio_url": None}

    # 3. Return both outputs
    return {"reply": ai_reply_text, "audio_url": audio_url}


# --- ENDPOINTS ---

@app.get('/')
async def home():
    """Simple root endpoint."""
    return {"message": "PastPort AI Backend is running."}

@app.get('/api/personas')
async def list_personas():
    """GET /api/personas: Returns metadata for all personas."""
    return PERSONAS

@app.post('/api/chat')
async def chat(data: ChatPayload):
    """
    POST /api/chat: Text-in, Text/Speech-out (T2T -> TTS).
    This handles user text input and orchestrates LLM and TTS.
    """
    if sanitize_message(data.message):
        return JSONResponse(content={"reply": "I cannot help with that request."})

    # Call the shared function to get both reply text and audio URL
    result = await generate_response_and_audio(data.persona, data.message, data.history)
    return result


@app.post('/api/transcribe')
async def transcribe_endpoint(persona: str = Query(..., description="The ID of the persona to chat with"), audio: UploadFile = File(...)):
    """
    POST /api/transcribe: Audio-in, Text/Speech-out (STT -> LLM -> TTS).
    This handles user audio input and orchestrates the full pipeline.
    """
    
    # 1. STT: Transcribe Audio
    try:
        transcribed_text = await transcribe_audio(audio) 
    except Exception as e:
        # Re-raise the custom exception details
        raise HTTPException(status_code=503, detail="transcribe_unavailable")
    
    # Safety Check and Sanitization
    if not transcribed_text or sanitize_message(transcribed_text):
        return JSONResponse(content={"reply": "I could not understand the question or it was inappropriate.", "audio_url": None})

    # 2. LLM + TTS: Generate Response and Audio
    try:
        result = await generate_response_and_audio(persona, transcribed_text, [])
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Generation/TTS failure detail: {e}")
        raise HTTPException(status_code=503, detail="LLM/TTS failure")

    # 3. Add the transcribed text to the response so the frontend can display the user's input
    result["transcribed_text"] = transcribed_text
    
    return result


@app.post('/api/tts')
async def tts_endpoint(data: TTSPayload):
    """POST /api/tts: Generates text-to-speech audio (kept for external calls)."""
    # utils_tts.py uses ElevenLabs/GCP TTS
    audio_url = await generate_tts(data.persona, data.text, PERSONAS)
    
    if not audio_url:
        return Response(status_code=204)

    return {"audio_url": audio_url}


@app.get('/api/audio/{filename}')
async def serve_audio(filename: str):
    """GET /api/audio/{filename}: Serves the temporary audio file."""
    
    file_path = TEMP_AUDIO_DIR / filename
    
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(file_path, media_type='audio/mpeg')
