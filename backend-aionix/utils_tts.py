import os
import httpx 
# CRITICAL: Import the correct libraries for dedicated TTS
from google.cloud import texttospeech 
from pathlib import Path
import uuid
from typing import Optional

# --- Initialization ---
TEMP_AUDIO_DIR = Path("tmp_audio")
TEMP_AUDIO_DIR.mkdir(exist_ok=True)

# Helper function to get the required voice name (GCP standard)
def get_voice_id(persona_id: str, personas: dict) -> str:
    """Retrieves the default GCP voice name, as custom voices are not used."""
    # Using a high-quality Wavenet voice as the stable default
    return "en-US-Wavenet-A" 


async def gemini_tts(text: str, voice_name: str, filename: str) -> Optional[str]:
    """
    Generates audio using Google Cloud Text-to-Speech (GCP TTS) API.
    This is the sole, robust service for speech synthesis.
    """
    
    # The dedicated TTS client relies on Application Default Credentials (ADC)
    try:
        # 1. Initialize the dedicated client (Asynchronous)
        tts_client = texttospeech.TextToSpeechAsyncClient()
    except Exception as e:
        print(f"GCP TTS Client Initialization Failed. Error: {e}. Check default project credentials.")
        return None

    print(f"Using Google Cloud TTS (reliable service).")
    
    try:
        # 2. Define the request configuration using GCP TTS API structure
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # Use a high-quality Wavenet voice
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name=voice_name 
        )
        
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        
        # 3. Call the dedicated GCP TTS service (Asynchronously)
        response = await tts_client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        
        # 4. Save Audio
        audio_path = TEMP_AUDIO_DIR / filename
        with open(audio_path, "wb") as f:
            f.write(response.audio_content)
            
        return f"/api/audio/{filename}"
    
    except Exception as e:
        # This catches any rejection due to permission scope or server issues
        print(f"GCP Text-to-Speech API Error: {e}")
        return None


# Removed: async def elevenlabs_tts(...)

async def generate_tts(persona_id: str, text: str, personas: dict) -> Optional[str]:
    """Master function that strictly uses the reliable GCP TTS service."""
    voice_name = get_voice_id(persona_id, personas)
    filename = f"{persona_id}-{uuid.uuid4().hex}.mp3"
    
    # Directly call GCP TTS
    return await gemini_tts(text, voice_name, filename)