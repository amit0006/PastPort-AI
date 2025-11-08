# import os
# import json
# import time
# from pathlib import Path
# from dotenv import load_dotenv

# # --- Load Environment Variables FIRST (FIXED PATH) ---
# DOTENV_PATH = Path(__file__).parent / ".env"
# load_dotenv(dotenv_path=DOTENV_PATH) 
# # --- END LOAD ---

# from fastapi import FastAPI, HTTPException, UploadFile, File
# from fastapi.responses import JSONResponse, FileResponse
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from google import genai
# from google.genai import types
# from typing import List, Optional

# # --- FIX FOR ModuleNotFoundError / ImportError ---
# import sys
# sys.path.append(str(Path(__file__).parent)) 
# # --- END FIX ---

# # Import local utilities
# from utils_tts import generate_tts, TEMP_AUDIO_DIR
# from utils_whisper import transcribe_audio

# # --- SETUP AND CONFIGURATION ---

# # 1. Read the key explicitly
# GEMINI_KEY = "AIzaSyAydDfeFKmJ8y6ygiz1ROdUsWvrPJNS_1o"

# try:
#     if not GEMINI_KEY:
#         raise ValueError("GEMINI_API_KEY environment variable is not set or loaded.")

#     # 2. Initialize the native Gemini client by passing the key directly
#     client = genai.Client(api_key=GEMINI_KEY) 
    
# except Exception as e:
#     print(f"FATAL: Gemini client initialization failed. Error: {e}")
#     client = None 

# LLM_MODEL = "gemini-2.5-flash-lite" # The model used for chat completions

# # Load personas data
# try:
#     with open('personas.json', 'r') as f:
#         PERSONAS = json.load(f)
# except FileNotFoundError:
#     print("Error: personas.json not found.")
#     PERSONAS = {}
    
# TEMP_AUDIO_DIR.mkdir(exist_ok=True)
# BANNED_WORDS = ["bomb", "kill", "attack", "suicide", "harm"]

# app = FastAPI(title="PastPort AI Backend (Gemini)")

# # Configure CORS
# ALLOW_ORIGINS = os.getenv("ALLOW_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[o.strip() for o in ALLOW_ORIGINS if o.strip()],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # --- Pydantic Schemas for Request Bodies ---

# class HistoryItem(BaseModel):
#     role: str
#     text: str

# class ChatPayload(BaseModel):
#     persona: str
#     message: str
#     history: List[HistoryItem] = []

# class TTSPayload(BaseModel):
#     persona: str
#     text: str

# # --- HELPER FUNCTIONS ---

# def sanitize_message(message: str) -> bool:
#     """Simple safety check for banned words."""
#     message_lower = message.lower()
#     return any(word in message_lower for word in BANNED_WORDS)

# def convert_history_to_gemini_format(history: List[HistoryItem], system_prompt: str, user_message: str) -> List[types.Content]:
#     """
#     Converts the history list into the Gemini SDK Content format.
#     """
    
#     gemini_contents = []
    
#     # 1. Start the content list with the system instruction and the first message
#     if not history:
#         # CASE 1: New Conversation (history is empty)
#         gemini_contents.append(
#             types.Content(
#                 role="user", 
#                 parts=[types.Part.from_text(text=f"[SYSTEM INSTRUCTION: {system_prompt}] {user_message}")]
#             )
#         )
#         return gemini_contents

#     else:
#         # CASE 2: Continuing Conversation (history exists)
        
#         # Combine system prompt with the *first* historical user message (history[0])
#         first_turn_user_text = history[0].text
        
#         gemini_contents.append(
#             types.Content(
#                 role="user", 
#                 parts=[types.Part.from_text(text=f"[SYSTEM INSTRUCTION: {system_prompt}] {first_turn_user_text}")]
#             )
#         )

#         # Append the rest of the turns from history (skip the first element which we just handled)
#         for turn in history[1:]: 
#             role = "user" if turn.role == "user" else "model" 
#             gemini_contents.append(
#                 types.Content(
#                     role=role, 
#                     parts=[types.Part.from_text(text=turn.text)]
#                 )
#             )
        
#         # Append the current user message separately
#         gemini_contents.append(
#             types.Content(
#                 role="user", 
#                 parts=[types.Part.from_text(text=user_message)]
#             )
#         )
#         return gemini_contents


# # --- ENDPOINTS ---

# @app.get('/')
# async def home():
#     """Simple root endpoint."""
#     return {"message": "PastPort AI Backend is running."}

# @app.get('/api/personas')
# async def list_personas():
#     """GET /api/personas: Returns metadata for all personas."""
#     return PERSONAS

# @app.post('/api/chat')
# async def chat(data: ChatPayload):
#     """POST /api/chat: Handles chat interaction with a persona."""
    
#     if not client: 
#         raise HTTPException(status_code=503, detail="LLM_api_unavailable: Gemini Client not initialized.")

#     if data.persona not in PERSONAS:
#         raise HTTPException(status_code=404, detail="Persona not found")
    
#     if sanitize_message(data.message):
#         return JSONResponse(content={"reply": "I cannot help with that request."})

#     persona = PERSONAS[data.persona]
#     system_prompt = persona['prompt']
    
#     # Truncate history to last 3 pairs (6 messages) before conversion
#     gemini_contents = convert_history_to_gemini_format(data.history[-6:], system_prompt, data.message)

#     try:
#         response = client.models.generate_content(
#             model=LLM_MODEL, 
#             contents=gemini_contents,
#             config=types.GenerateContentConfig(
#                 temperature=0.7,
#                 max_output_tokens=300
#             )
#         )
        
#         # --- FIX: Null Check for Empty Response ---
#         if response.text is None:
#             # This happens if content is blocked by safety filter or model returns empty text.
#             print(f"Gemini Chat Warning: Received empty response from model.")
#             ai_reply = "I apologize, the stream of history is momentarily obscured. Please rephrase your question."
#         else:
#             ai_reply = response.text.strip()
#         # --- END FIX ---
        
#     except Exception as e:
#         print(f"Gemini Chat Error: {e}")
#         # This will be raised if the API key is rejected or quota is exceeded
#         raise HTTPException(status_code=503, detail="LLM_api_unavailable")

#     return {"reply": ai_reply}


# @app.post('/api/transcribe')
# async def transcribe_endpoint(audio: UploadFile = File(...)):
#     """POST /api/transcribe: Transcribes an uploaded audio file using Gemini."""
    
#     try:
#         # utils_whisper.py uses the global Gemini client for transcription
#         transcribed_text = await transcribe_audio(audio) 
#         return {"text": transcribed_text}
#     except RuntimeError as e:
#         if str(e) == "transcribe_unavailable":
#             raise HTTPException(status_code=503, detail="transcribe_unavailable")
#         raise HTTPException(status_code=500, detail="Transcription failed")
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")


# @app.post('/api/tts')
# async def tts_endpoint(data: TTSPayload):
#     """POST /api/tts: Generates text-to-speech audio."""
#     # utils_tts.py uses Gemini TTS or ElevenLabs fallback
#     audio_url = await generate_tts(data.persona, data.text, PERSONAS)
    
#     if not audio_url:
#         return JSONResponse(status_code=204, content={"error": "TTS unavailable or failed. Showing text only."})

#     return {"audio_url": audio_url}


# @app.get('/api/audio/{filename}')
# async def serve_audio(filename: str):
#     """GET /api/audio/{filename}: Serves the temporary audio file."""
    
#     file_path = TEMP_AUDIO_DIR / filename
    
#     if not file_path.is_file():
#         raise HTTPException(status_code=404, detail="File not found")
        
#     return FileResponse(file_path, media_type='audio/mpeg')

import os
import json
import time
from pathlib import Path
from dotenv import load_dotenv

# --- Load Environment Variables FIRST (FIXED PATH) ---
DOTENV_PATH = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=DOTENV_PATH) 
# --- END LOAD ---

from fastapi import FastAPI, HTTPException, UploadFile, File
# CRITICAL FIX 1: Add Response import for 204 status code
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

# Import local utilities (They will now see the loaded environment variables)
from utils_tts import generate_tts, TEMP_AUDIO_DIR
from utils_whisper import transcribe_audio

# --- SETUP AND CONFIGURATION ---

# 1. Read the key explicitly from the environment
# CRITICAL FIX 2: Revert hardcoding; read key from environment variable
GEMINI_KEY = "AIzaSyAydDfeFKmJ8y6ygiz1ROdUsWvrPJNS_1o"

try:
    if not GEMINI_KEY:
        # If the key is not found, raise a configuration error
        raise ValueError("GEMINI_API_KEY environment variable is not set or loaded.")

    # 2. ***CRITICAL FIX 3: Explicitly set the key in os.environ***
    # This guarantees the key is available for Uvicorn's subprocesses and utility files.
    os.environ['GEMINI_API_KEY'] = GEMINI_KEY
    
    # 3. Initialize the native Gemini client (it will now read from os.environ or the direct key argument)
    client = genai.Client(api_key=GEMINI_KEY) 
    
except Exception as e:
    print(f"FATAL: Gemini client initialization failed. Error: {e}")
    client = None 

LLM_MODEL = "gemini-2.5-flash-lite" # The model used for chat completions

# Load personas data
try:
    with open('personas.json', 'r') as f:
        PERSONAS = json.load(f)
except FileNotFoundError:
    print("Error: personas.json not found.")
    PERSONAS = {}
    
TEMP_AUDIO_DIR.mkdir(exist_ok=True)
BANNED_WORDS = ["bomb", "kill", "attack", "suicide", "harm"]

app = FastAPI(title="PastPort AI Backend (Gemini)")

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

# --- HELPER FUNCTIONS ---

def sanitize_message(message: str) -> bool:
    """Simple safety check for banned words."""
    message_lower = message.lower()
    return any(word in message_lower for word in BANNED_WORDS)

def convert_history_to_gemini_format(history: List[HistoryItem], system_prompt: str, user_message: str) -> List[types.Content]:
    """
    Converts the history list into the Gemini SDK Content format.
    """
    
    gemini_contents = []
    
    # 1. Start the content list with the system instruction and the first message
    if not history:
        # CASE 1: New Conversation (history is empty)
        gemini_contents.append(
            types.Content(
                role="user", 
                parts=[types.Part.from_text(text=f"[SYSTEM INSTRUCTION: {system_prompt}] {user_message}")]
            )
        )
        return gemini_contents

    else:
        # CASE 2: Continuing Conversation (history exists)
        
        # Combine system prompt with the *first* historical user message (history[0])
        first_turn_user_text = history[0].text
        
        gemini_contents.append(
            types.Content(
                role="user", 
                parts=[types.Part.from_text(text=f"[SYSTEM INSTRUCTION: {system_prompt}] {first_turn_user_text}")]
            )
        )

        # Append the rest of the turns from history (skip the first element which we just handled)
        for turn in history[1:]: 
            role = "user" if turn.role == "user" else "model" # Gemini uses 'model' for assistant role
            gemini_contents.append(
                types.Content(
                    role=role, 
                    parts=[types.Part.from_text(text=turn.text)]
                )
            )
        
        # Append the current user message separately
        gemini_contents.append(
            types.Content(
                role="user", 
                parts=[types.Part.from_text(text=user_message)]
            )
        )
        return gemini_contents


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
    """POST /api/chat: Handles chat interaction with a persona."""
    
    if not client: 
        raise HTTPException(status_code=503, detail="LLM_api_unavailable: Gemini Client not initialized.")

    if data.persona not in PERSONAS:
        raise HTTPException(status_code=404, detail="Persona not found")
    
    if sanitize_message(data.message):
        return JSONResponse(content={"reply": "I cannot help with that request."})

    persona = PERSONAS[data.persona]
    system_prompt = persona['prompt']
    
    # Truncate history to last 3 pairs (6 messages) before conversion
    gemini_contents = convert_history_to_gemini_format(data.history[-6:], system_prompt, data.message)

    try:
        response = client.models.generate_content(
            model=LLM_MODEL, 
            contents=gemini_contents,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=300
            )
        )
        
        # FIX: Null Check for Empty Response
        ai_reply = response.text.strip() if response.text else "I apologize, the stream of history is momentarily obscured. Please rephrase your question."
        
    except Exception as e:
        print(f"Gemini Chat Error: {e}")
        raise HTTPException(status_code=503, detail="LLM_api_unavailable")

    return {"reply": ai_reply}


@app.post('/api/transcribe')
async def transcribe_endpoint(audio: UploadFile = File(...)):
    """POST /api/transcribe: Transcribes an uploaded audio file using Gemini."""
    
    if not client: 
        raise HTTPException(status_code=503, detail="transcribe_unavailable: Gemini Client not initialized.")
        
    try:
        # NOTE: utils_whisper.py now uses the global client implicitly
        transcribed_text = await transcribe_audio(audio) 
        return {"text": transcribed_text}
    except RuntimeError as e:
        if str(e) == "transcribe_unavailable":
            raise HTTPException(status_code=503, detail="transcribe_unavailable")
        raise HTTPException(status_code=500, detail="Transcription failed")
    except Exception as e:
        print(f"Transcription failure detail: {e}")
        raise HTTPException(status_code=503, detail="transcribe_unavailable")


@app.post('/api/tts')
async def tts_endpoint(data: TTSPayload):
    """POST /api/tts: Generates text-to-speech audio."""
    # utils_tts.py uses Gemini TTS or ElevenLabs fallback
    audio_url = await generate_tts(data.persona, data.text, PERSONAS)
    
    if not audio_url:
        # CRITICAL FIX: Return an empty Response with status 204 to adhere to protocol
        return Response(status_code=204)

    return {"audio_url": audio_url}


@app.get('/api/audio/{filename}')
async def serve_audio(filename: str):
    """GET /api/audio/{filename}: Serves the temporary audio file."""
    
    file_path = TEMP_AUDIO_DIR / filename
    
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(file_path, media_type='audio/mpeg')