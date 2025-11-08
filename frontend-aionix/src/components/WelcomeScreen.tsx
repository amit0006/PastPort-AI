import { Clock, Scroll, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#EAD7C3] via-[#F8F3EE] to-[#EAD7C3]">
      {/* Background decorative elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 rotate-12">
          <Scroll className="w-32 h-32" />
        </div>
        <div className="absolute top-20 right-20 -rotate-12">
          <Clock className="w-40 h-40" />
        </div>
        <div className="absolute bottom-20 left-1/4">
          <Sparkles className="w-24 h-24" />
        </div>
      </div>

      {/* Vignette effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/10 pointer-events-none" />

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Logo/Title */}
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-4">
            <Clock className="w-12 h-12 text-[#B8860B]" />
            <h1 className="text-7xl tracking-tight text-[#1E1E1E] font-serif">
              PastPort AI
            </h1>
            <Scroll className="w-12 h-12 text-[#B8860B]" />
          </div>
          
          <p className="text-2xl text-[#6B4B2C] mb-6 italic">
            Talk to history, not just read it.
          </p>
        </div>

        {/* Description */}
        <div className="mb-12 max-w-2xl mx-auto">
          <p className="text-lg text-[#1E1E1E]/80 leading-relaxed">
            Step into history and converse with iconic figures through AI-powered dialogue. 
            Experience the wisdom of the ages as you engage in conversations that transcend time itself.
            From ancient philosophers to modern revolutionaries, the past awaits your questions.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={onGetStarted}
          className="group relative px-12 py-5 bg-gradient-to-r from-[#B8860B] to-[#D4AF37] rounded-full transition-all duration-300 hover:shadow-[0_0_30px_rgba(184,134,11,0.5)] hover:scale-105 active:scale-95"
        >
          <span className="text-xl text-white tracking-wide">
            Get Started
          </span>
          <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        {/* Footer disclaimer */}
        <div className="mt-16">
          <p className="text-sm text-[#6B4B2C]/70">
            Educational experience powered by artificial intelligence • Historical responses are interpretive reconstructions
          </p>
        </div>
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-[#B8860B]/20 rounded-tl-3xl" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-[#B8860B]/20 rounded-tr-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-[#B8860B]/20 rounded-bl-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-[#B8860B]/20 rounded-br-3xl" />
    </div>
  );
}
