import { useState } from 'react';
import { Play, Pause } from 'lucide-react';

export default function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      // Simulate playback
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsPlaying(false);
            return 0;
          }
          return prev + 2;
        });
      }, 100);
    } else {
      setIsPlaying(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-[#B8860B]/20">
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-gradient-to-r from-[#B8860B] to-[#D4AF37] flex items-center justify-center text-white hover:shadow-lg hover:shadow-[#B8860B]/30 transition-all flex-shrink-0"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      {/* Waveform/Progress */}
      <div className="flex-1">
        <div className="flex items-center gap-0.5 h-8">
          {Array.from({ length: 20 }).map((_, i) => {
            const height = Math.random() * 60 + 40;
            const isActive = (i / 20) * 100 <= progress;
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-200"
                style={{
                  height: `${height}%`,
                  backgroundColor: isActive ? '#B8860B' : '#EAD7C3',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Time */}
      <span className="text-xs text-[#6B4B2C] flex-shrink-0">
        {isPlaying ? '0:' + Math.floor(progress / 10).toString().padStart(2, '0') : '0:00'}
      </span>
    </div>
  );
}
