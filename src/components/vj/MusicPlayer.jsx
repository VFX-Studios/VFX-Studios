import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

export default function MusicPlayer({ song, onTimeUpdate, onEnded, onNext, onPrev }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const time = audioRef.current.currentTime;
    setCurrentTime(time);
    onTimeUpdate?.(time);
  };

  const handleSeek = (value) => {
    if (!audioRef.current || !song || !song.duration_seconds) return;
    const time = (value[0] / 100) * song.duration_seconds;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleEnded = () => {
    if (repeat) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      setIsPlaying(false);
      onEnded?.();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = song?.duration_seconds ? (currentTime / song.duration_seconds) * 100 : 0;

  // Mock audio source - in production this would be actual audio files
  const audioSrc = `https://example.com/audio/${song?.id}.mp3`;

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-4">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={() => console.log('Audio not available - demo mode')}
      />

      {/* Track info */}
      <div className="mb-4">
        <h3 className="text-white font-medium text-sm truncate">{song?.title || 'No track selected'}</h3>
        <p className="text-white/40 text-xs">{song?.album}</p>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <Slider
          value={[progress]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="mb-2"
        />
        <div className="flex justify-between text-white/40 text-[10px] font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{song?.duration || '0:00'}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShuffle(!shuffle)}
            className={`h-8 w-8 ${shuffle ? 'text-[#f5a623]' : 'text-white/40'}`}
          >
            <Shuffle className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onPrev}
            className="h-8 w-8 text-white/60 hover:text-white"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            onClick={togglePlayPause}
            className="h-10 w-10 bg-[#f5a623] hover:bg-[#e91e8c]"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onNext}
            className="h-8 w-8 text-white/60 hover:text-white"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setRepeat(!repeat)}
            className={`h-8 w-8 ${repeat ? 'text-[#f5a623]' : 'text-white/40'}`}
          >
            <Repeat className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMuted(!isMuted)}
            className="h-8 w-8 text-white/60"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Slider
            value={[volume]}
            onValueChange={([v]) => setVolume(v)}
            max={100}
            className="w-20"
          />
        </div>
      </div>

      {/* Live indicators */}
      {isPlaying && (
        <motion.div
          className="mt-3 flex items-center justify-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-[#f5a623] rounded-full"
              animate={{
                height: [8, 16, 8],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}