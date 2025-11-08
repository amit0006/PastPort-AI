import { useState } from 'react';
import { ArrowLeft, Send, Mic } from 'lucide-react';
import { Persona } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';
import ChatBubble from './ChatBubble';
import AudioPlayer from './AudioPlayer';

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

// Mock initial messages
const getInitialMessages = (personaName: string): Message[] => [
  {
    id: '1',
    sender: 'persona',
    text: `Greetings! I am delighted to converse with you across the ages. What questions do you have for me?`,
    timestamp: new Date(),
  },
];

export default function ChatInterface({ persona, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(getInitialMessages(persona.name));
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response after a delay
    setTimeout(() => {
      const responses = getPersonaResponse(persona.id, inputValue);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'persona',
        text: responses,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAD7C3] via-[#F8F3EE] to-[#EAD7C3] relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-20">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1690983331198-b32a245b13cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwcGFyY2htZW50JTIwdGV4dHVyZXxlbnwxfHx8fDE3NjI1NzI0MTh8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Background texture"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/30 pointer-events-none" />

      {/* Content */}
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
          {/* Left Panel - Persona Profile */}
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <div className="bg-[#F8F3EE] rounded-2xl p-6 shadow-xl border border-[#B8860B]/20 sticky top-6">
              {/* Portrait */}
              <div className="mb-4">
                <div className="w-full aspect-square rounded-xl overflow-hidden ring-4 ring-[#B8860B]/30">
                  <ImageWithFallback
                    src={persona.image}
                    alt={persona.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Info */}
              <h3 className="text-2xl text-[#1E1E1E] mb-2 font-serif">
                {persona.name}
              </h3>
              <p className="text-sm text-[#B8860B] mb-4 tracking-wide">
                {persona.era}
              </p>
              <p className="text-sm text-[#6B4B2C] leading-relaxed mb-6">
                {persona.bio}
              </p>

              {/* Audio Player */}
              <div className="pt-4 border-t border-[#B8860B]/20">
                <p className="text-xs text-[#6B4B2C] mb-2">Voice Playback</p>
                <AudioPlayer />
              </div>
            </div>
          </div>

          {/* Right Panel - Chat Area */}
          <div className="flex-1 flex flex-col bg-[#F8F3EE]/50 backdrop-blur-sm rounded-2xl shadow-xl border border-[#B8860B]/20 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <ChatBubble key={message.id} message={message} persona={persona} />
              ))}
            </div>

            {/* Input Area */}
            <div className="border-t border-[#B8860B]/20 bg-[#F8F3EE] p-4">
              <div className="flex gap-3 items-end">
                <button className="p-3 rounded-xl bg-white hover:bg-[#B8860B]/10 text-[#B8860B] transition-colors flex-shrink-0">
                  <Mic className="w-5 h-5" />
                </button>
                
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

                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
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

// Mock AI responses
function getPersonaResponse(personaId: string, userMessage: string): string {
  const responses: Record<string, string[]> = {
    einstein: [
      "Imagination is more important than knowledge. Knowledge is limited, whereas imagination embraces the entire world. What aspect of the universe intrigues you most?",
      "The distinction between past, present and future is only a stubbornly persistent illusion. Time is relative, you see.",
      "Try not to become a man of success, but rather try to become a man of value. This is wisdom I learned through my journey.",
    ],
    gandhi: [
      "Be the change you wish to see in the world. These words have guided my path of nonviolent resistance.",
      "The weak can never forgive. Forgiveness is the attribute of the strong. This is the foundation of satyagraha.",
      "In a gentle way, you can shake the world. Nonviolence is the greatest force at the disposal of mankind.",
    ],
    cleopatra: [
      "I will not be triumphed over. As the ruler of Egypt, I have learned that power must be wielded with both strength and wisdom.",
      "The Nile has seen empires rise and fall, yet Egypt endures. What would you like to know of my kingdom?",
      "Leadership requires both strategic alliances and the courage to stand alone when necessary. This is how I ruled Egypt.",
    ],
  };

  const personaResponses = responses[personaId] || responses.einstein;
  return personaResponses[Math.floor(Math.random() * personaResponses.length)];
}
