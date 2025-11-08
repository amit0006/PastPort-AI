// /frontend-aionix/src/components/AudioPlayer.tsx

import React, { useRef, useEffect, useState } from 'react';

interface AudioPlayerProps {
    audioUrl?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState('0:00');

  // Utility to format time
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    // Reset state when URL changes
    setProgress(0);
    setIsPlaying(false);
    setIsReady(false);
    setDuration('0:00');

    if (audioUrl) {
      // Load and attempt to play the new audio source
      audio.load();
      audio.oncanplay = () => {
        setIsReady(true);
        setDuration(formatTime(audio.duration));
        // Auto-play logic
        audio.play().then(() => setIsPlaying(true)).catch(e => {
            console.warn("Auto-play blocked by browser. User intervention needed.", e);
            setIsPlaying(false);
        });
      };
      
      // Error handling for when the browser can't load the file
      audio.onerror = () => {
          console.error("Audio failed to load from URL:", audioUrl);
          setIsReady(false);
          // Optional: Display an error message to the user
      };
    }

    // Setup event listeners
    const updateTime = () => setProgress((audio.currentTime / audio.duration) * 100 || 0);
    const setEnded = () => setIsPlaying(false);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', setEnded);
    
    return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('ended', setEnded);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || !isReady) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => console.error("Play failed:", e));
    }
    setIsPlaying(!isPlaying);
  };

  if (!audioUrl) {
      return <div className="text-xs text-[#6B4B2C]/50">Waiting for response...</div>;
  }

  return (
    <div className="audio-player flex items-center gap-3">
      <audio ref={audioRef} src={audioUrl} preload="auto" hidden />
      
      <button 
        onClick={togglePlayPause} 
        disabled={!isReady}
        className="text-[#B8860B] hover:text-[#D4AF37] disabled:opacity-50 transition-colors p-2 bg-white rounded-full shadow"
      >
        {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-[1px]"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="w-full h-1 bg-[#B8860B]/20 rounded-full overflow-hidden">
          <div style={{width: `${progress}%`}} className="h-full bg-[#B8860B] transition-all duration-100" />
        </div>
      </div>
      
      <div className="text-xs text-[#6B4B2C] flex-shrink-0">
          {formatTime(audioRef.current?.currentTime || 0)} / {duration}
      </div>
    </div>
  );
};

export default AudioPlayer;
