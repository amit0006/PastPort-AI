# 🏛️ PastPort AI — Talk to History

**Tagline:** "Talk to history, not just read it."

## 🎯 Project Goal
PastPort AI solves the problem of passive history education by turning it into an emotional, two-way experience. Users converse directly with historical legends—Albert Einstein, Mahatma Gandhi, and Cleopatra—in their era-accurate tone and voice.

## 🚀 Demo Script (60-90 seconds)
This script is designed for a live presentation or a quick demo video.

1.  **(0-10s) Introduction:** "Hello! We are PastPort AI. We believe history should be experienced, not just read. We built an interactive AI platform that lets you talk to historical legends in their own voice and style." (Show Persona Selection Screen)
2.  **(10-25s) Demo: Albert Einstein:** "Let's ask Albert Einstein a complex question." (Click Einstein, type question). **User:** "How did you first conceive of time and gravity?" (Show chat/speech). **AI (Voice plays):** (AI provides a simple metaphor about a moving train and light.)
3.  **(25-40s) Demo: Mahatma Gandhi:** "Now, let us seek guidance from Mahatma Gandhi." (Select Gandhi, type question). **User:** "What is the true power of non-violence in a conflict?" (Show chat/speech). **AI (Voice plays):** (AI answers calmly with a metaphor about inner truth and love.)
4.  **(40-55s) Demo: Cleopatra:** (Select Cleopatra, type question). **User:** "Finally, a quick word with the Queen of the Nile." (Select Cleopatra, type question). **User:** "How did you lead during hard times?" (Audio plays).
5.  **(55-65s) Conclusion:** "Imagine this platform in museums or classrooms—that’s the future of learning we’re creating with PastPort AI."

## 💻 Local Setup & Run Instructions

**Prerequisites:** Python 3.8+, Node.js/npm, and your API keys.

### 1. Configure Environment Variables
1.  Navigate to the `/backend` directory.
2.  **Rename `.env.template` to `.env`.**
3.  Fill in your keys in the new `.env` file (see the file contents below).

### 2. Start the Backend (FastAPI on Port 5000)
```bash
# In the repository root
cd backend
pip install -r requirements.txt
# Use uvicorn to run the FastAPI application: main.py::app
uvicorn main:app --reload --port 5000 --host 0.0.0.0
# Server will run on [http://0.0.0.0:5000](http://0.0.0.0:5000)