import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function WaveformDisplay({ currentTime, duration, waveformData, onSeek }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !waveformData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Parse waveform data if string
    let peaks = waveformData;
    if (typeof waveformData === 'string') {
      try {
        peaks = JSON.parse(waveformData);
      } catch (e) {
        return;
      }
    }
    
    if (!Array.isArray(peaks) || peaks.length === 0) return;
    
    // Draw waveform
    const barWidth = width / peaks.length;
    const midY = height / 2;
    
    peaks.forEach((peak, i) => {
      const x = i * barWidth;
      const barHeight = Math.abs(peak) * height * 0.8;
      const progress = (i / peaks.length) * duration;
      
      // Color based on playback position
      if (progress < currentTime) {
        // Played: gradient
        ctx.fillStyle = `rgba(245, 166, 35, ${0.6 + peak * 0.4})`;
      } else {
        // Not played: muted
        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + peak * 0.15})`;
      }
      
      ctx.fillRect(x, midY - barHeight / 2, Math.max(barWidth - 1, 1), barHeight);
    });
    
    // Draw playhead
    const playheadX = (currentTime / duration) * width;
    ctx.strokeStyle = '#e91e8c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
    
  }, [currentTime, duration, waveformData]);

  const handleClick = (e) => {
    if (!containerRef.current || !duration || !onSeek) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickProgress = x / rect.width;
    const seekTime = clickProgress * duration;
    
    onSeek(seekTime);
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-16 bg-black/40 rounded-lg border border-white/10 overflow-hidden cursor-pointer hover:border-[#f5a623]/50 transition-colors"
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={64}
        className="w-full h-full"
      />
      
      {/* Time markers */}
      <div className="absolute bottom-1 left-2 right-2 flex justify-between text-[9px] text-white/40 pointer-events-none">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </motion.div>
  );
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}