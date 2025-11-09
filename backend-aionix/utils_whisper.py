import os
from google import genai
from google.genai import types
from fastapi import UploadFile
from pathlib import Path

# --- Initialization ---
TEMP_AUDIO_DIR = Path("tmp_audio")
TEMP_AUDIO_DIR.mkdir(exist_ok=True)

# NOTE: We do not use the hardcoded key or os.getenv() globally here.
# The key is retrieved inside the function.

async def transcribe_audio(audio_file: UploadFile) -> str:
    """
    Transcribes the audio into text using Gemini's multimodal capability.
    This function's sole purpose is to return the user's spoken question.
    """
    
    # 1. Initialize client inside the function (CRITICAL FIX)
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        print("Gemini client initialization failed: GEMINI_API_KEY missing in transcribe function.")
        raise RuntimeError("transcribe_unavailable")

    try:
        local_client = genai.Client(api_key=gemini_key)
    except Exception as e:
        print(f"Gemini client failed to initialize with key: {e}")
        raise RuntimeError("transcribe_unavailable")


    # 2. Prepare the Multimodal Instruction (Focus ONLY on Transcription)
    # The persona instruction is handled later in main.py's chat call.
    audio_instruction = "Transcribe the speech found in the audio file into text."
    
    # Read file content
    file_content = await audio_file.read()
    
    try:
        # 3. Make the Multimodal Call
        response = local_client.models.generate_content(
            model='gemini-2.5-flash-lite', 
            contents=[
                types.Part.from_text(text=audio_instruction),
                types.Part.from_bytes(
                    data=file_content,
                    mime_type=audio_file.content_type or 'audio/mpeg', 
                )
            ]
        )
        
        # 4. Return the Model's Text Output (The Transcription)
        if response.text:
            return response.text.strip()
        else:
            print("Gemini Transcription Warning: Received empty text response.")
            return ""
    
    except Exception as e:
        print(f"Gemini Transcription Error: {e}")
        raise RuntimeError("transcribe_unavailable")
