import { useState } from 'react';
import { ArrowLeft, Send, Mic } from 'lucide-react';
import { Persona } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';
import ChatBubble from './ChatBubble';
import AudioPlayer from './AudioPlayer';
import { postChat } from '../api'; // ✅ Calls backend

interface ChatInterfaceProps {
  persona: Persona;
  onBack: () => void;
}

type Message = {
  id: string;
  sender: 'user' | 'persona';
  text: string;
  timestamp: Date;
};

export default function ChatInterface({ persona, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'persona',
      text: `Greetings! I am delighted to converse with you across the ages. What questions do you have for me?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // 🎤 Track mic state

  // 🧠 Function to send message to backend
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const history = messages.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        text: msg.text,
      }));

      // ✅ Fetch AI reply from backend (FastAPI)
      const response = await postChat(persona.id, userMessage.text, history);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'persona',
        text: response.reply || 'No reply received from the server.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat API error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        sender: 'persona',
        text: 'Sorry, I am unable to respond right now. Please try again later.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🎤 Improved Function for speech-to-text (mic)
  const handleRecord = async () => {
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert('Speech recognition is not supported in this browser.');
        return;
      }

      // Stop any old sessions that might still be active
      if ((window as any).activeRecognition) {
        (window as any).activeRecognition.stop();
        (window as any).activeRecognition = null;
      }

      const recognition = new SpeechRecognition();
      (window as any).activeRecognition = recognition;

      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        console.log('🎙️ Listening...');
        setIsRecording(true);
        alert('🎙️ Listening... Speak now!');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Transcribed text:', transcript);
        setInputValue(transcript); // Automatically fill input box
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        alert(`Speech recognition error: ${event.error}`);
        (window as any).activeRecognition = null;
        setIsRecording(false);
      };

      recognition.onend = () => {
        console.log('🎤 Recording ended');
        (window as any).activeRecognition = null;
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Mic access error:', err);
      alert('Could not access microphone. Please check browser permissions.');
      setIsRecording(false);
    }
  };

  // Enter key trigger
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAD7C3] via-[#F8F3EE] to-[#EAD7C3] relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1690983331198-b32a245b13cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
          alt="Background texture"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/30 pointer-events-none" />

      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <div className="bg-[#F8F3EE]/90 backdrop-blur-sm border-b border-[#B8860B]/20 px-6 py-4 shadow-md">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#6B4B2C] hover:text-[#B8860B] transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Selection</span>
          </button>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex gap-6 p-6 overflow-hidden">
          {/* Left Persona Panel */}
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <div className="bg-[#F8F3EE] rounded-2xl p-6 shadow-xl border border-[#B8860B]/20 sticky top-6">
              <div className="mb-4">
                <div className="w-full aspect-square rounded-xl overflow-hidden ring-4 ring-[#B8860B]/30">
                  <ImageWithFallback
                    src={persona.image}
                    alt={persona.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <h3 className="text-2xl text-[#1E1E1E] mb-2 font-serif">{persona.name}</h3>
              <p className="text-sm text-[#B8860B] mb-4 tracking-wide">{persona.era}</p>
              <p className="text-sm text-[#6B4B2C] leading-relaxed mb-6">{persona.bio}</p>

              <div className="pt-4 border-t border-[#B8860B]/20">
                <p className="text-xs text-[#6B4B2C] mb-2">Voice Playback</p>
                <AudioPlayer />
              </div>
            </div>
          </div>

          {/* Right Chat Section */}
          <div className="flex-1 flex flex-col bg-[#F8F3EE]/50 backdrop-blur-sm rounded-2xl shadow-xl border border-[#B8860B]/20 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} persona={persona} />
              ))}
              {isLoading && (
                <p className="text-center text-[#B8860B] italic">Thinking...</p>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-[#B8860B]/20 bg-[#F8F3EE] p-4">
              <div className="flex gap-3 items-end">
                {/* 🎤 Mic button */}
                <button
                  onClick={handleRecord}
                  disabled={isRecording}
                  className={`p-3 rounded-xl bg-white text-[#B8860B] transition-all flex-shrink-0 ${
                    isRecording
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-[#B8860B]/10'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* Textbox */}
                <div className="flex-1 bg-white rounded-xl border border-[#B8860B]/20 focus-within:border-[#B8860B] transition-colors">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask your question..."
                    className="w-full px-4 py-3 bg-transparent resize-none outline-none max-h-32"
                    rows={1}
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-3 rounded-xl bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-white hover:shadow-lg hover:shadow-[#B8860B]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-[#6B4B2C]/70 mt-3 text-center">
                AI responses are reconstructions based on historical records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
