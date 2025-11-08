import { Persona } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Message {
  id: string;
  sender: 'user' | 'persona';
  text: string;
  timestamp: Date;
}

interface ChatBubbleProps {
  message: Message;
  persona: Persona;
}

export default function ChatBubble({ message, persona }: ChatBubbleProps) {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-fade-in`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#B8860B]/30">
          <ImageWithFallback
            src={persona.image}
            alt={persona.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Message Bubble */}
      <div className={`max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`rounded-2xl px-5 py-3 shadow-md ${
            isUser
              ? 'bg-[#FFF7E0] border border-[#B8860B]/20 rounded-tr-sm'
              : 'bg-white border border-[#B8860B]/10 rounded-tl-sm'
          }`}
        >
          <p className="text-[#1E1E1E] leading-relaxed">
            {message.text}
          </p>
        </div>
        
        <span className="text-xs text-[#6B4B2C]/60 px-2">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* User Avatar Placeholder */}
      {isUser && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#B8860B] to-[#D4AF37] flex-shrink-0 flex items-center justify-center ring-2 ring-[#B8860B]/30">
          <span className="text-white text-sm">You</span>
        </div>
      )}
    </div>
  );
}
