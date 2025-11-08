// /frontend-aionix/src/api.ts

// Define the shape of a message sent in the API payload
interface APIMessage {
    role: 'user' | 'assistant';
    text: string;
}

// Function to call the chat endpoint
export const postChat = async (persona: string, message: string, history: APIMessage[]) => {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Ensure the history matches the structure required by your FastAPI backend
        body: JSON.stringify({ persona, message, history }),
    });

    if (!response.ok) {
        const errorDetail = await response.json();
        // Propagate the specific backend error details (like LLM_api_unavailable)
        throw new Error(errorDetail.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json(); 
};

// Function to call the TTS endpoint
export const postTTS = async (persona: string, text: string) => {
    const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona, text }),
    });

    if (response.status === 204) {
        // Return null URL if TTS endpoint sends 204 No Content (failure/unavailable)
        return { audio_url: null };
    }
    
    if (!response.ok) {
        throw new Error(`TTS API failed with status ${response.status}`);
    }

    return response.json(); 
};

// You will also need a postTranscribe function if you implement the mic button
/*
export const postTranscribe = async (audioFile: File) => {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
    });
    // ... handle response ...
};
*/