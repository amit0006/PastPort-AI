import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables from the .env file in the parent directory (backend/)
# This ensures API keys are available for testing.
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

# Ensure this matches the port your FastAPI server is running on
BASE_URL = "http://localhost:5000/api"

def test_chat_endpoint(persona_id: str, question: str):
    """Sends a test message to the /api/chat endpoint and prints the response."""
    print(f"\n--- Testing Persona: {persona_id.upper()} ---")
    
    payload = {
        "persona": persona_id,
        "message": question,
        "history": [] # Start with clean history for a fresh test
    }
    
    try:
        # Check if API key is present before proceeding
        if not os.getenv("OPENAI_API_KEY"):
            print("Skipping chat test: OPENAI_API_KEY not set.")
            return

        response = requests.post(f"{BASE_URL}/chat", json=payload)
        response.raise_for_status() # Raise error for bad status codes

        data = response.json()
        print(f"Question: {question}")
        print(f"Status: {response.status_code}")
        print(f"AI Reply: {data.get('reply', 'No reply received.')[:150]}...") # Print first 150 chars

    except requests.exceptions.HTTPError as err:
        print(f"HTTP Error: {err}")
        try:
            # Try to decode FastAPI error response detail
            print(f"Response Detail: {response.json().get('detail', 'N/A')}")
        except json.JSONDecodeError:
            print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    
    if not os.getenv("OPENAI_API_KEY"):
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        print("!!! WARNING: OPENAI_API_KEY not found. Chat tests skipped. !!!")
        print("!!! Please fill in .env and run again.                     !!!")
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    else:
        # Test cases for each persona
        test_chat_endpoint("einstein", "What is curiosity?")
        test_chat_endpoint("gandhi", "How should we respond to injustice?")
        test_chat_endpoint("cleopatra", "How did you lead during hard times?")

    # Simple check for the /api/personas endpoint
    try:
        res = requests.get(f"{BASE_URL}/personas")
        res.raise_for_status()
        print(f"\n--- Testing GET /api/personas ---")
        print(f"Status: {res.status_code}. Personas found: {len(res.json())}")
    except Exception as e:
        print(f"Failed to get personas: {e}")