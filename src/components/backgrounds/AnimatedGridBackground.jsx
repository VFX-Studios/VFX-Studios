import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedGridBackground({ style = 'resolume' }) {
  if (style === 'resolume') {
    // Resolume-inspired: Dark grid with neon accents
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0514] via-[#150a28] to-[#050510]" />
        
        {/* Animated grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(245,166,35,0.3)" strokeWidth="0.5"/>
            </pattern>
            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5a623" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#e91e8c" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Scanning lines (Resolume style) */}
        <motion.div
          className="absolute inset-0"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(245,166,35,0.03) 50%, transparent 100%)',
            backgroundSize: '200% 200%'
          }}
        />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#f5a623] opacity-10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#e91e8c] opacity-10 blur-3xl" />
      </div>
    );
  }

  if (style === 'touchdesigner') {
    // TouchDesigner-inspired: Node network aesthetic
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d1a] via-[#1a1a2e] to-[#16213e]" />
        
        {/* Network nodes */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-cyan-400"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <motion.line
            x1="10%" y1="20%" x2="90%" y2="80%"
            stroke="url(#tdGradient)"
            strokeWidth="1"
            animate={{ strokeDashoffset: [0, -100] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            strokeDasharray="5,5"
          />
          <defs>
            <linearGradient id="tdGradient">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // AI platform style (Runway/Midjourney)
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a12] via-[#1a1625] to-[#050510]" />
      
      {/* Mesh gradient (modern AI aesthetic) */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(at 20% 30%, rgba(124, 58, 237, 0.2) 0px, transparent 50%),
            radial-gradient(at 80% 70%, rgba(233, 30, 140, 0.2) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(0, 212, 255, 0.15) 0px, transparent 50%)
          `
        }}
      />

      {/* Floating particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 1,
            height: Math.random() * 4 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `hsl(${Math.random() * 60 + 260}, 70%, 60%)`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
}