import { ArrowLeft, Scroll } from 'lucide-react';
import { Persona } from '../App';
import PersonaCard from './PersonaCard';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface PersonaSelectionProps {
  onSelectPersona: (persona: Persona) => void;
  onBack: () => void;
}

const personas: Persona[] = [
  {
    id: 'einstein',
    name: 'Albert Einstein',
    era: '1879-1955',
    description: 'Theoretical physicist who developed the theory of relativity',
    bio: 'One of the most influential physicists of the 20th century, Einstein revolutionized our understanding of space, time, gravity, and the universe.',
    image: 'https://images.unsplash.com/photo-1630635280270-00799dd04da6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbGJlcnQlMjBlaW5zdGVpbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc2MjU3MjQxN3ww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'gandhi',
    name: 'Mahatma Gandhi',
    era: '1869-1948',
    description: 'Leader of Indian independence through nonviolent resistance',
    bio: 'Gandhi pioneered the philosophy of nonviolent resistance, leading India to independence and inspiring civil rights movements worldwide.',
    image: 'https://images.unsplash.com/photo-1733255024979-8620deee5245?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWhhdG1hJTIwZ2FuZGhpJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzYyNTcyNDE3fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'cleopatra',
    name: 'Cleopatra VII',
    era: '69-30 BCE',
    description: 'Last active ruler of the Ptolemaic Kingdom of Egypt',
    bio: 'Known for her intelligence, political acumen, and relationships with Julius Caesar and Mark Antony, Cleopatra was one of history\'s most powerful women.',
    image: 'https://images.unsplash.com/photo-1630301812438-8e5fd7a36aba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwZWd5cHQlMjBjbGVvcGF0cmF8ZW58MXx8fHwxNzYyNTcyNDE4fDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

export default function PersonaSelection({ onSelectPersona, onBack }: PersonaSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAD7C3] via-[#F8F3EE] to-[#EAD7C3] relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 opacity-30">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1690983331198-b32a245b13cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwcGFyY2htZW50JTIwdGV4dHVyZXxlbnwxfHx8fDE3NjI1NzI0MTh8MA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Parchment texture"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20 pointer-events-none" />

      {/* Decorative scrolls */}
      <div className="absolute top-10 left-10 opacity-10 rotate-12">
        <Scroll className="w-24 h-24 text-[#6B4B2C]" />
      </div>
      <div className="absolute bottom-10 right-10 opacity-10 -rotate-12">
        <Scroll className="w-24 h-24 text-[#6B4B2C]" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#6B4B2C] hover:text-[#B8860B] transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl text-[#1E1E1E] mb-4 font-serif">
            Choose a Historical Figure
          </h2>
          <p className="text-lg text-[#6B4B2C]">
            Select a figure from the past to begin your conversation
          </p>
        </div>

        {/* Persona Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {personas.map((persona) => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onSelect={() => onSelectPersona(persona)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
