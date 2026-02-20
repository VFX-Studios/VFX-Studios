import React from 'react';
import { Play } from 'lucide-react';

const DEMO_LOOPS = [
  {
    title: 'Neon Pulse',
    src: 'https://storage.googleapis.com/coverr-main/mp4/Footboys.mp4'
  },
  {
    title: 'Laser Horizon',
    src: 'https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4'
  },
  {
    title: 'Cyber Wave',
    src: 'https://storage.googleapis.com/coverr-main/mp4/Night_City.mp4'
  }
];

export default function LoopPreviewGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {DEMO_LOOPS.map((loop, i) => (
        <div
          key={loop.title}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <video
            className="w-full h-48 object-cover"
            src={loop.src}
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="text-white font-semibold">{loop.title}</div>
            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <Play className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="absolute inset-0 pointer-events-none animate-pulse-glow" style={{ opacity: 0.25 }} />
          <div className="absolute inset-0 pointer-events-none animate-scanline bg-[linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[length:100%_6px]" />
        </div>
      ))}
    </div>
  );
}
