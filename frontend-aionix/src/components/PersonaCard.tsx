import { Persona } from '../App';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface PersonaCardProps {
  persona: Persona;
  onSelect: () => void;
}

export default function PersonaCard({ persona, onSelect }: PersonaCardProps) {
  return (
    <div className="group relative bg-[#F8F3EE] rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-[#B8860B]/20 overflow-hidden">
      {/* Gold glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#B8860B]/0 to-[#B8860B]/0 group-hover:from-[#B8860B]/10 group-hover:to-[#D4AF37]/10 transition-all duration-300 rounded-2xl pointer-events-none" />
      
      <div className="relative z-10">
        {/* Portrait */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-48 h-48 rounded-full overflow-hidden ring-4 ring-[#B8860B]/30 group-hover:ring-[#B8860B] transition-all duration-300">
            <ImageWithFallback
              src={persona.image}
              alt={persona.name}
              className="w-full h-full object-cover"
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>

        {/* Info */}
        <div className="text-center mb-6">
          <h3 className="text-2xl text-[#1E1E1E] mb-2 font-serif">
            {persona.name}
          </h3>
          <p className="text-sm text-[#B8860B] mb-3 tracking-wide">
            {persona.era}
          </p>
          <p className="text-[#6B4B2C] leading-relaxed">
            {persona.description}
          </p>
        </div>

        {/* Button */}
        <button
          onClick={onSelect}
          className="w-full py-3 bg-gradient-to-r from-[#B8860B] to-[#D4AF37] text-white rounded-xl hover:shadow-lg hover:shadow-[#B8860B]/30 transition-all duration-300 group-hover:scale-105 active:scale-95"
        >
          Talk to Me
        </button>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-[#B8860B]/10 rounded-tr-2xl group-hover:border-[#B8860B]/30 transition-colors" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-[#B8860B]/10 rounded-bl-2xl group-hover:border-[#B8860B]/30 transition-colors" />
    </div>
  );
}
