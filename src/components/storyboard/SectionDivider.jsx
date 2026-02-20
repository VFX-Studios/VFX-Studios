import React from 'react';
import { motion } from 'framer-motion';

const sectionMeta = {
  opener: { title: 'The Awakening', desc: 'Atmospheric entry — drawing the crowd in', color: '#6366f1' },
  build: { title: 'Rising Tide', desc: 'Energy climbing — bodies start to move', color: '#00d4ff' },
  peak: { title: 'The Fractal Storm', desc: 'Maximum energy — pure controlled chaos', color: '#e91e8c' },
  cooldown: { title: 'The Descent', desc: 'Easing the crowd — emotional resolution', color: '#8b5cf6' },
  closer: { title: 'Final Horizon', desc: 'The last breath before silence', color: '#4f46e5' },
};

export default function SectionDivider({ section }) {
  const meta = sectionMeta[section];
  if (!meta) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-12 flex items-center gap-6"
    >
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${meta.color}33)` }} />
      <div className="text-center">
        <div className="text-[10px] tracking-[0.5em] uppercase mb-1" style={{ color: `${meta.color}99` }}>
          {section}
        </div>
        <h2 className="text-white/80 text-xl font-extralight tracking-wide">{meta.title}</h2>
        <p className="text-white/25 text-xs mt-1 font-light">{meta.desc}</p>
      </div>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${meta.color}33)` }} />
    </motion.div>
  );
}