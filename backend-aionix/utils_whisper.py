import os
from google import genai
from google.genai import types
from fastapi import UploadFile
from pathlib import Path

# --- TEMPORARY DEBUG FIX ---
# NOTE: Replace the key here if you are still debugging the 400 error.
TEMP_HARDCODED_GEMINI_KEY = "AIzaSyAydDfeFKmJ8y6ygiz1ROdUsWvrPJNS_1o"
# --- END TEMPORARY DEBUG FIX ---

TEMP_AUDIO_DIR = Path("tmp_audio")
TEMP_AUDIO_DIR.mkdir(exist_ok=True)


async def transcribe_audio(audio_file: UploadFile) -> str:
    """
    Directly answers the question in the audio file by instructing the model 
    to combine transcription and response generation.
    """
    
    # Initialization and error handling (relies on key being hardcoded/set)
    try:
        if not TEMP_HARDCODED_GEMINI_KEY or "YOUR_ACTUAL_GEMINI_KEY" in TEMP_HARDCODED_GEMINI_KEY:
            raise EnvironmentError("Temporary key is missing or is the placeholder value.")
            
        local_client = genai.Client(api_key=TEMP_HARDCODED_GEMINI_KEY)
        
    except Exception as e:
        print(f"Gemini client initialization failed: {e}")
        # The 400 API_KEY_INVALID error is caught here
        raise RuntimeError("transcribe_unavailable")


    # 1. Prepare the Multimodal Instruction
    # We must explicitly tell the model to *answer* the audio content.
    audio_instruction = (
        "The audio contains a question from the user. "
        "Answer the question in the audio using the persona system prompt "
        "defined for the chat session. Do not just transcribe the speech; answer it directly."
    )
    
    # Read file content
    file_content = await audio_file.read()
    
    try:
        # 2. Make the Multimodal Call
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
        
        # 3. Return the Model's Answer
        # This will be the actual response to the question in the audio.
        return response.text.strip()
    
    except Exception as e:
        print(f"Gemini Transcription Error: {e}")
        raise RuntimeError("transcribe_unavailable")