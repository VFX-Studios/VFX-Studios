import React from 'react';
import { motion } from 'framer-motion';

export default function EffectPreview({ effectName, intensity, previewImage }) {
  const getEffectGradient = (name) => {
    const gradients = {
      blur: 'from-blue-500/20 to-blue-700/20',
      glow: 'from-yellow-500/20 to-orange-700/20',
      chromatic: 'from-red-500/20 via-green-500/20 to-blue-500/20',
      distortion: 'from-purple-500/20 to-pink-700/20',
      glitch: 'from-green-500/20 to-cyan-700/20',
    };
    return gradients[name] || 'from-white/10 to-white/20';
  };

  const getEffectFilter = (name, value) => {
    const filters = {
      blur: `blur(${value * 0.1}px)`,
      glow: `drop-shadow(0 0 ${value * 0.2}px rgba(255, 200, 0, 0.8))`,
      chromatic: `hue-rotate(${value * 3.6}deg)`,
      distortion: `contrast(${100 + value}%)`,
      glitch: `saturate(${100 + value * 2}%)`,
    };
    return filters[name] || 'none';
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative w-full h-12 rounded-lg overflow-hidden border border-white/10"
    >
      {/* Background gradient */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br ${getEffectGradient(effectName)}`}
      />
      
      {/* Preview content with effect applied */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ filter: getEffectFilter(effectName, intensity) }}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f5a623] to-[#e91e8c]" />
      </div>
      
      {/* Effect label */}
      <div className="absolute bottom-1 left-2 text-[9px] text-white/60 font-medium capitalize">
        {effectName}
      </div>
      
      {/* Intensity indicator */}
      <div className="absolute bottom-1 right-2 text-[9px] text-white/40">
        {Math.round(intensity)}%
      </div>
      
      {/* Intensity bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/30">
        <motion.div
          className="h-full bg-gradient-to-r from-[#f5a623] to-[#e91e8c]"
          animate={{ width: `${intensity}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </motion.div>
  );
}