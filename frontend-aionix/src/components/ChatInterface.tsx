import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Mic } from 'lucide-react';
import { Persona } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';
import ChatBubble from './ChatBubble';
import AudioPlayer from './AudioPlayer';
import { postChat, postTranscribe } from '../api';

// ---------------------- Types ----------------------
type APIMessage = {
  role: 'user' | 'assistant';
  text: string;
};

interface ChatInterfaceProps {
  persona: Persona;
  onBack: () => void;
}

type Message = {
  id: string;
  sender: 'user' | 'persona';
  text: string;
  timestamp: Date;
  audioUrl?: string;
};

// ---------------------- Helper functions ----------------------
const getInitialMessages = (): Message[] => [
  {
    id: '1',
    sender: 'persona',
    text: `Greetings! I am delighted to converse with you across the ages. What questions do you have for me?`,
    timestamp: new Date(),
  },
];

// ✅ CRITICAL FIX: Ensure 'messages' is an array (use [] if undefined)
const extractHistoryForApi = (messages: Message[] | undefined): APIMessage[] => {
  // If messages is undefined, use an empty array
  const messageArray = messages || [];

  return messageArray
    .slice(1) // Skip the initial greeting message
    .filter((msg) => msg.text.trim()) // Ensure valid text
    .map((msg) => ({
      role: msg.sender === 'persona' ? 'assistant' : 'user',
      text: msg.text,
    }))
    .slice(-6); // Only last 3 turns
};

// ---------------------- Component ----------------------
export default function ChatInterface({ persona, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(getInitialMessages());
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Safe way to get last persona message
  const findLastPersonaMessage = (): Message | undefined => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'persona') return messages[i];
    }
    return undefined;
  };

  const replayAudioUrl = findLastPersonaMessage()?.audioUrl;

  // ---------------------- TEXT INPUT HANDLER ----------------------
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessageText = inputValue.trim();
    setIsLoading(true);
    setInputValue('');

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userMessageText,
      timestamp: new Date(),
    };

    const messagesAfterUser = [...messages, userMessage];
    setMessages(messagesAfterUser);

    // ✅ Use the safe helper
    const historyForApi = extractHistoryForApi(messagesAfterUser);

    try {
      const response = await postChat(persona.id, userMessageText, historyForApi);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'persona',
        text: response.reply ?? '[No reply]',
        timestamp: new Date(),
        audioUrl: response.audio_url ?? undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat API Failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'persona',
        text: `[SYSTEM ERROR] Connection failed. Check Console for details.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------- AUDIO UPLOAD HANDLER ----------------------
  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isLoading) return;

    setIsLoading(true);
    if (audioInputRef.current) audioInputRef.current.value = '';

    try {
      const s2sResponse = await postTranscribe(persona.id, file);

      const userMessage: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text: s2sResponse.transcribed_text ?? 'Audio input received.',
        timestamp: new Date(),
      };

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'persona',
        text: s2sResponse.reply ?? '[No reply]',
        timestamp: new Date(),
        audioUrl: s2sResponse.audio_url ?? undefined,
      };

      setMessages((prev) => [...prev, userMessage, aiMessage]);
    } catch (error) {
      console.error('S2S API Failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'persona',
        text: `[S2S ERROR] Audio processing failed. Try typing your question.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------- ENTER KEY HANDLER ----------------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // Defensive guard for undefined persona
  if (!persona) {
    return (
      <div className="p-6">
        <p className="text-red-600">Persona data not loaded. Please go back and reselect.</p>
        <button className="btn mt-3" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  // ---------------------- JSX RENDER ----------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAD7C3] via-[#F8F3EE] to-[#EAD7C3] relative overflow-hidden">
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
          {/* Left Panel */}
          <div className="w-80 flex-shrink-0 hidden lg:block">
            <div className="bg-[#F8F3EE] rounded-2xl p-6 shadow-xl border border-[#B8860B]/20 sticky top-6">
              <div className="flex flex-col items-center">
                <ImageWithFallback
                  src={persona.portrait}
                  alt={persona.name}
                  className="w-40 h-40 rounded-lg object-cover"
                />
                <h3 className="mt-4 text-lg font-semibold text-[#6B4B2C]">{persona.name}</h3>
                <p className="text-sm text-[#6B4B2C]/80">{persona.era}</p>
                <p className="mt-3 text-sm text-[#4b3a2a]">
                  {(persona?.prompt ?? '').slice(0, 140)}
                  {persona?.prompt ? '...' : ''}
                </p>
              </div>

              <div className="pt-4 border-t border-[#B8860B]/20">
                <p className="text-xs text-[#6B4B2C] mb-2">Voice Playback</p>
                <AudioPlayer audioUrl={replayAudioUrl} />
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 flex flex-col bg-[#F8F3EE]/50 backdrop-blur-sm rounded-2xl shadow-xl border border-[#B8860B]/20 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} persona={persona} />
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-[#B8860B]/20 bg-[#F8F3EE] p-4">
              <div className="flex gap-3 items-end">
                <label
                  htmlFor="audio-upload-input"
                  className="p-3 rounded-xl bg-white hover:bg-[#B8860B]/10 text-[#B8860B] transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Mic className="w-5 h-5" />
                  <input
                    ref={audioInputRef}
                    id="audio-upload-input"
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioUpload}
                    disabled={isLoading}
                    style={{ display: 'none' }}
                  />
                </label>

                <div className="flex-1 bg-white rounded-xl border border-[#B8860B]/20 focus-within:border-[#B8860B] transition-colors">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isLoading ? 'Processing request...' : 'Ask your question...'}
                    className="w-full px-4 py-3 bg-transparent resize-none outline-none max-h-32"
                    rows={1}
                    disabled={isLoading}
                  />
                </div>

                <button
                  onClick={() => void handleSend()}
                  disabled={!inputValue.trim() || isLoading}
                  className="p-3 rounded-xl bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
