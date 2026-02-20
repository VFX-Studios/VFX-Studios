import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Music, Zap, Star, Eye } from 'lucide-react';

const stats = [
  { label: "Total Runtime", value: "90 min + Encore", icon: Clock },
  { label: "Tracks in Set", value: "21", icon: Music },
  { label: "Peak Energy", value: "10/10", icon: Zap },
  { label: "Encore Tracks", value: "3", icon: Star },
];

export default function SetOverview() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <div className="relative min-h-[70vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a2e] via-[#1a0a3e] to-[#050510]" />
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(ellipse at 30% 20%, rgba(245,166,35,0.3) 0%, transparent 50%),
                              radial-gradient(ellipse at 70% 60%, rgba(233,30,140,0.2) 0%, transparent 50%),
                              radial-gradient(ellipse at 50% 80%, rgba(0,212,255,0.15) 0%, transparent 50%)`
          }}
        />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#f5a623]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.1,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.6, 0.1],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <Eye className="w-8 h-8 text-[#f5a623]" />
              <span className="text-[#f5a623] text-sm tracking-[0.4em] uppercase font-light">
                Visual Storyboard
              </span>
              <Eye className="w-8 h-8 text-[#f5a623]" />
            </div>
            
            <h1 className="text-5xl md:text-8xl font-extralight text-white tracking-tight leading-none mb-4">
              ubiquitously
            </h1>
            <h1 className="text-5xl md:text-8xl font-extralight text-transparent bg-clip-text bg-gradient-to-r from-[#f5a623] via-[#e91e8c] to-[#00d4ff] tracking-tight leading-none mb-8">
              nowhere
            </h1>
            
            <p className="text-white/40 text-lg md:text-xl font-extralight tracking-wide max-w-2xl mx-auto mb-4">
              HEADLINER SET — 90 MINUTES + ENCORE
            </p>
            <p className="text-white/25 text-sm tracking-[0.3em] uppercase">
              Somewhere the Fractals Reside World Festival Tour
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-2xl p-5"
              >
                <stat.icon className="w-5 h-5 text-[#f5a623] mb-3 mx-auto" />
                <div className="text-white text-xl font-light">{stat.value}</div>
                <div className="text-white/30 text-xs tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Energy Arc Visualization */}
      <div className="bg-[#050510] px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-white/50 text-xs tracking-[0.4em] uppercase text-center mb-8">Set Energy Arc</h2>
          <div className="flex items-end justify-center gap-[2px] h-32">
            {[3,4,4,5,6,6,7,7,8,8,9,9,10,10,10,9,8,7,6,5,4, 9,10,8].map((level, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${level * 10}%` }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
                className="w-3 md:w-5 rounded-t-sm"
                style={{
                  background: i >= 21
                    ? `linear-gradient(to top, #f5a623, #e91e8c)`
                    : level >= 9
                      ? `linear-gradient(to top, #e91e8c, #ff4444)`
                      : level >= 7
                        ? `linear-gradient(to top, #f5a623, #e91e8c)`
                        : level >= 5
                          ? `linear-gradient(to top, #00d4ff, #f5a623)`
                          : `linear-gradient(to top, #1a0a3e, #00d4ff)`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between text-white/20 text-[10px] tracking-widest uppercase mt-4 px-2">
            <span>Opener</span>
            <span>Build</span>
            <span>Peak</span>
            <span>Cooldown</span>
            <span>Encore</span>
          </div>
        </div>
      </div>
    </div>
  );
}