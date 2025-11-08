// /frontend-aionix/src/api.ts

// Define the shape of a message sent in the API payload
interface APIMessage {
  role: 'user' | 'assistant';
  text: string;
}

// Function to call the chat endpoint
export const postChat = async (persona: string, message: string, history: APIMessage[]) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Match the FastAPI backend body structure
      body: JSON.stringify({ persona, message, history }),
    });

    if (!response.ok) {
      const errorDetail = await response.json().catch(() => ({}));
      throw new Error(errorDetail.detail || `HTTP error! status: ${response.status}`);
    }

    // ✅ Return the backend response object, which contains: { reply: "...text..." }
    return response.json();
  } catch (error) {
    console.error('Chat API failed:', error);
    throw error;
  }
};

// Function to call the Text-to-Speech (TTS) endpoint
export const postTTS = async (persona: string, text: string) => {
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona, text }),
    });

    if (response.status === 204) {
      // Return null if backend couldn’t generate audio
      return { audio_url: null };
    }

    if (!response.ok) {
      throw new Error(`TTS API failed with status ${response.status}`);
    }

    // ✅ Backend returns something like: { audio_url: "/api/audio/cleopatra-1234.mp3" }
    return response.json();
  } catch (error) {
    console.error('TTS API failed:', error);
    throw error;
  }
};

// Optional: Speech-to-text transcription (mic button)
export const postTranscribe = async (audioFile: File) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed with status ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Transcription API failed:', error);
    throw error;
  }
};
