import React from 'react';
import { Clock3, Music } from 'lucide-react';

export default function BeatMetadata({ metadata = {} }) {
  const { beat_bpm, timecode_start, timecode_format } = metadata || {};
  if (!beat_bpm && !timecode_start) return null;

  return (
    <div className="flex items-center gap-3 text-xs text-white/60 mt-2">
      {beat_bpm ? (
        <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
          <Music className="w-3 h-3 text-[#f5a623]" />
          <span>{beat_bpm} BPM</span>
        </div>
      ) : null}
      {timecode_start ? (
        <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
          <Clock3 className="w-3 h-3 text-[#00eaff]" />
          <span>{timecode_start}{timecode_format ? ` (${timecode_format})` : ''}</span>
        </div>
      ) : null}
    </div>
  );
}
