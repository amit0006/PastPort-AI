# File: /backend/utils_tts.py (CRITICAL AUTHENTICATION FIX)

import os
import httpx 
from google.cloud import texttospeech 
from google.oauth2 import service_account # New import for Service Account authentication
import base64
from pathlib import Path
import uuid
from typing import Optional

# ... (Imports and helper functions remain the same) ...

async def gemini_tts(text: str, voice_name: str, filename: str) -> Optional[str]:
    """
    Generates audio using Google Cloud Text-to-Speech (GCP TTS) API.
    Uses the service account key stored in the Render environment.
    """
    
    # 1. Retrieve and Decode Service Account Key from Render secret
    gcp_key_base64 = os.getenv("GCP_SERVICE_ACCOUNT_KEY")
    if not gcp_key_base64:
        print("GCP TTS Error: GCP_SERVICE_ACCOUNT_KEY secret is missing on Render.")
        return None

    try:
        # Decode the Base64 string back into JSON bytes
        key_file_content = base64.b64decode(gcp_key_base64)
        
        # 2. Create credentials object from the JSON content
        credentials = service_account.Credentials.from_service_account_info(
            json.loads(key_file_content.decode('utf-8'))
        )
        
        # 3. Initialize the dedicated client with explicit credentials
        tts_client = texttospeech.TextToSpeechAsyncClient(credentials=credentials)
    except Exception as e:
        print(f"GCP TTS Client Initialization Failed in Render. Error: {e}")
        return None

    # ... (rest of the TTS logic remains the same: synthesize_speech, saving audio) ...
    
    # Final logic structure remains the same
    try:
        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(language_code="en-US", name=voice_name)
        audio_config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)
        
        response = await tts_client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )
        
        audio_path = TEMP_AUDIO_DIR / filename
        with open(audio_path, "wb") as f:
            f.write(response.audio_content)
            
        return f"/api/audio/{filename}"
    
    except Exception as e:
        print(f"GCP Text-to-Speech API Error: {e}")
        return None
