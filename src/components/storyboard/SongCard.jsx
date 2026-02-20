import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, Gauge, Flame, Eye, ArrowRight, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';

const sectionColors = {
  opener: { bg: 'from-indigo-900/30 to-purple-900/20', accent: '#6366f1', label: 'OPENER' },
  build: { bg: 'from-blue-900/30 to-cyan-900/20', accent: '#00d4ff', label: 'BUILD' },
  peak: { bg: 'from-rose-900/30 to-orange-900/20', accent: '#e91e8c', label: 'PEAK' },
  cooldown: { bg: 'from-purple-900/30 to-indigo-900/20', accent: '#8b5cf6', label: 'COOLDOWN' },
  closer: { bg: 'from-slate-900/30 to-indigo-900/20', accent: '#4f46e5', label: 'CLOSER' },
  encore: { bg: 'from-amber-900/30 to-rose-900/20', accent: '#f5a623', label: 'ENCORE' },
};

const energyColor = (level) => {
  if (level >= 9) return '#ff4444';
  if (level >= 7) return '#e91e8c';
  if (level >= 5) return '#f5a623';
  if (level >= 3) return '#00d4ff';
  return '#6366f1';
};

export default function SongCard({ song, index, isEncoreStart, onOpenVJPanel }) {
  const [expanded, setExpanded] = useState(false);
  const section = sectionColors[song.set_section] || sectionColors.build;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.03 }}
    >
      {isEncoreStart && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-center gap-4 py-8"
        >
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#f5a623]/40 to-transparent" />
          <span className="text-[#f5a623] text-xs tracking-[0.5em] uppercase font-light">Encore</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#f5a623]/40 to-transparent" />
        </motion.div>
      )}

      <div
        className={`relative bg-gradient-to-r ${section.bg} border border-white/[0.04] rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 hover:border-white/[0.1]`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Energy bar */}
        <div
          className="absolute top-0 left-0 h-full w-1 rounded-l-2xl"
          style={{ background: energyColor(song.energy_level) }}
        />

        <div className="pl-6 pr-5 py-5">
          {/* Main row */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <span className="text-white/40 text-sm font-light">{song.set_position}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 rounded-full border"
                  style={{ color: section.accent, borderColor: `${section.accent}33` }}
                >
                  {section.label}
                </span>
                {song.source === 'musicmakerjam' && (
                  <span className="text-[9px] tracking-wider uppercase text-purple-400/60 bg-purple-400/10 px-2 py-0.5 rounded-full">
                    Unreleased
                  </span>
                )}
              </div>
              <h3 className="text-white font-light text-lg truncate group-hover:text-white/90 transition-colors">
                {song.title}
              </h3>
              <p className="text-white/25 text-xs mt-0.5">{song.album}</p>
            </div>

            <div className="hidden md:flex items-center gap-6 text-white/30 text-xs">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                <span>{song.duration}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Gauge className="w-3 h-3" />
                <span>~{song.tempo_bpm_estimate} BPM</span>
              </div>
              <div className="flex items-center gap-1">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-3 rounded-sm"
                    style={{
                      background: i < song.energy_level ? energyColor(song.energy_level) : 'rgba(255,255,255,0.05)',
                    }}
                  />
                ))}
              </div>
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onOpenVJPanel(song);
              }}
              className="text-[#f5a623] hover:text-[#e91e8c] hover:bg-[#f5a623]/10 transition-colors"
            >
              <Sliders className="w-4 h-4" />
            </Button>

            <ChevronDown
              className={`w-4 h-4 text-white/20 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            />
          </div>

          {/* Expanded VFX Storyboard */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-5 mt-5 border-t border-white/[0.04]">
                  {/* Mobile stats */}
                  <div className="flex md:hidden items-center gap-4 text-white/30 text-xs mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>{song.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Gauge className="w-3 h-3" />
                      <span>~{song.tempo_bpm_estimate} BPM</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3 h-3" />
                      <span>{song.energy_level}/10</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* VFX Description */}
                    <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                      <div className="flex items-center gap-2 mb-3">
                        <Eye className="w-3.5 h-3.5 text-[#f5a623]" />
                        <span className="text-white/50 text-[10px] tracking-[0.2em] uppercase">Visual Effects</span>
                      </div>
                      <p className="text-white/60 text-sm font-light leading-relaxed">
                        {song.vfx_description}
                      </p>
                    </div>

                    {/* Visual Mood + Transition */}
                    <div className="space-y-4">
                      <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                        <span className="text-white/50 text-[10px] tracking-[0.2em] uppercase">Visual Mood</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {song.visual_mood?.split(', ').map((mood, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.04] text-white/40 border border-white/[0.06]"
                            >
                              {mood}
                            </span>
                          ))}
                        </div>
                      </div>

                      {song.transition_note && (
                        <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                          <div className="flex items-center gap-2 mb-2">
                            <ArrowRight className="w-3 h-3 text-[#00d4ff]" />
                            <span className="text-white/50 text-[10px] tracking-[0.2em] uppercase">Transition</span>
                          </div>
                          <p className="text-white/50 text-xs font-light">{song.transition_note}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cumulative time */}
                  <div className="mt-4 text-right">
                    <span className="text-white/15 text-[10px] tracking-wider">
                      SET TIME: {song.cumulative_time}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}