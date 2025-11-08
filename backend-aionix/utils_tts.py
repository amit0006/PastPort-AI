import os
import httpx
from google import genai
from google.genai import types
from pathlib import Path
import uuid
import base64
from typing import Optional

# Initialize the native Gemini client (uses GEMINI_API_KEY from env automatically)
try:
    client = genai.Client()
except Exception as e:
    # Handle case where key might not be available during initial import
    print(f"Gemini client initialization failed: {e}")
    client = None

TEMP_AUDIO_DIR = Path("tmp_audio")
TEMP_AUDIO_DIR.mkdir(exist_ok=True)

def get_voice_id(persona_id: str, personas: dict) -> str:
    """Retrieves specific ElevenLabs voice ID or returns OpenAI/Gemini default voice name."""
    # For Gemini, we use specific voice names. 'alloy' is replaced by 'Kore' (Example)
    return os.getenv(f"{persona_id.upper()}_VOICE_ID", "Kore")

async def gemini_tts(text: str, voice_name: str, filename: str) -> Optional[str]:
    """Generates audio using Gemini TTS."""
    if not client: return None
    print(f"Using Gemini TTS for voice: {voice_name}")
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-tts", # Model supporting native audio output
            contents=[text],
            config=types.GenerateContentConfig(
                response_modalities=['AUDIO'],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=voice_name
                        )
                    )
                )
            )
        )
        
        # The audio data is returned as base64 in the response part
        audio_part = response.candidates[0].content.parts[0]
        audio_bytes = base64.b64decode(audio_part.inline_data.data)
        
        audio_path = TEMP_AUDIO_DIR / filename
        with open(audio_path, "wb") as f:
            f.write(audio_bytes)
            
        return f"/api/audio/{filename}"
    except Exception as e:
        print(f"Gemini TTS Error: {e}")
        return None

async def elevenlabs_tts(text: str, voice_id: str, filename: str) -> Optional[str]:
    # (This function remains largely the same, using httpx)
    eleven_api_key = os.getenv("ELEVENLABS_API_KEY")
    if not eleven_api_key: return None
    # ... (rest of the httpx logic is the same)
    
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {"xi-api-key": eleven_api_key, "Content-Type": "application/json"}
    payload = { "text": text, "model_id": "eleven_monolingual_v1", "voice_settings": {"stability": 0.5, "similarity_boost": 0.75} }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status() 
        
        audio_path = TEMP_AUDIO_DIR / filename
        with open(audio_path, "wb") as f: f.write(response.content)
            
        return f"/api/audio/{filename}"
    except Exception as e:
        print(f"ElevenLabs TTS Error: {e}. Check key and voice ID.")
        return None

async def generate_tts(persona_id: str, text: str, personas: dict) -> Optional[str]:
    """Master function to choose between ElevenLabs and Gemini TTS."""
    voice_name = get_voice_id(persona_id, personas)
    filename = f"{persona_id}-{uuid.uuid4().hex}.mp3"
    
    # 1. Try ElevenLabs first
    if os.getenv("ELEVENLABS_API_KEY"):
        audio_url = await elevenlabs_tts(text, voice_name, filename)
        if audio_url: return audio_url

    # 2. Fallback to Gemini TTS
    return await gemini_tts(text, voice_name, filename)