import React from 'react';
import { motion } from 'framer-motion';

export default function HexagonalPattern({ animated = true }) {
  const hexagons = [];
  const size = 80;
  const rows = 15;
  const cols = 20;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * size * 1.5 + (row % 2) * size * 0.75;
      const y = row * size * 0.866;
      hexagons.push({ x, y, row, col });
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <svg className="w-full h-full opacity-10">
        <defs>
          <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5a623" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#e91e8c" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        
        {hexagons.map((hex, i) => {
          const delay = (hex.row + hex.col) * 0.05;
          
          return (
            <motion.path
              key={i}
              d={`M ${hex.x + size * Math.cos(0)} ${hex.y + size * Math.sin(0)}
                  L ${hex.x + size * Math.cos(Math.PI / 3)} ${hex.y + size * Math.sin(Math.PI / 3)}
                  L ${hex.x + size * Math.cos(2 * Math.PI / 3)} ${hex.y + size * Math.sin(2 * Math.PI / 3)}
                  L ${hex.x + size * Math.cos(Math.PI)} ${hex.y + size * Math.sin(Math.PI)}
                  L ${hex.x + size * Math.cos(4 * Math.PI / 3)} ${hex.y + size * Math.sin(4 * Math.PI / 3)}
                  L ${hex.x + size * Math.cos(5 * Math.PI / 3)} ${hex.y + size * Math.sin(5 * Math.PI / 3)}
                  Z`}
              fill="none"
              stroke="url(#hexGrad)"
              strokeWidth="1"
              initial={{ opacity: 0, scale: 0 }}
              animate={animated ? {
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.02, 1],
              } : { opacity: 0.4 }}
              transition={animated ? {
                duration: 4,
                repeat: Infinity,
                delay: delay,
              } : {}}
            />
          );
        })}
      </svg>
    </div>
  );
}