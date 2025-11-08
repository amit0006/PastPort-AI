// /frontend-aionix/src/api.ts

// Define the shape of a message sent in the API payload
interface APIMessage {
  role: 'user' | 'assistant';
  text: string;
}

// Define the expected unified response structure
interface UnifiedChatResponse {
    reply: string;
    audio_url: string | null;
    // Optional: for the /transcribe endpoint
    transcribed_text?: string; 
}

// CRITICAL FIX: Base URL must be the public endpoint in deployment
const API_BASE_URL = import.meta.env.VITE_PUBLIC_API_URL || ''; 
// If deployed, VITE_PUBLIC_API_URL must be set (e.g., https://your-app.onrender.com)
// If running locally with Vite proxy, set to empty string: ''

// Helper to handle fetch responses and errors
async function handleResponse(response: Response): Promise<UnifiedChatResponse> {
    if (!response.ok) {
        const errorDetail = await response.json().catch(() => ({}));
        throw new Error(errorDetail.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
}

/** * ✅ PRIMARY ENDPOINT: POST /api/chat
 * Handles T2T and TTS generation in a single backend call.
 * * @returns { reply, audio_url }
 */
export const postChat = async (persona: string, message: string, history: APIMessage[]): Promise<UnifiedChatResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ persona, message, history }),
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Chat API failed:', error);
    throw error;
  }
};


/** * ✅ SECONDARY ENDPOINT: POST /api/transcribe
 * Handles the full S2S pipeline: STT -> LLM -> TTS in one backend call.
 * * @returns { reply, audio_url, transcribed_text }
 */
export const postTranscribe = async (persona: string, audioFile: File): Promise<UnifiedChatResponse> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch(`${API_BASE_URL}/api/transcribe?persona=${persona}`, {
      method: 'POST',
      body: formData,
    });

    // The backend may return 503 if the transcription service is down.
    return handleResponse(response);
  } catch (error) {
    console.error('Transcription API failed:', error);
    throw error;
  }
};

// NOTE: The separate postTTS function is REMOVED as its logic is now contained within postChat.
