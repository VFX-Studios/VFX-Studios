import React, { useEffect, useRef } from 'react';

export default function SacredGeometryBackground({ variant = 'metatron', intensity = 0.3 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationFrame;
    let time = 0;

    const drawFlowerOfLife = (x, y, radius, rotation) => {
      ctx.strokeStyle = `rgba(245, 166, 35, ${intensity * 0.4})`;
      ctx.lineWidth = 1;

      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + rotation;
        const cx = x + Math.cos(angle) * radius;
        const cy = y + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    };

    const drawMetatronsCube = (x, y, size, rotation) => {
      const points = [];
      const outerRadius = size;
      const innerRadius = size * 0.577;

      // Outer hexagon
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + rotation;
        points.push({
          x: x + Math.cos(angle) * outerRadius,
          y: y + Math.sin(angle) * outerRadius
        });
      }

      // Inner hexagon
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + Math.PI / 6 + rotation;
        points.push({
          x: x + Math.cos(angle) * innerRadius,
          y: y + Math.sin(angle) * innerRadius
        });
      }

      // Center
      points.push({ x, y });

      // Draw connections
      ctx.strokeStyle = `rgba(233, 30, 140, ${intensity * 0.5})`;
      ctx.lineWidth = 0.5;

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    };

    const drawSriYantra = (x, y, size, rotation) => {
      const triangles = 9;
      ctx.strokeStyle = `rgba(0, 212, 255, ${intensity * 0.4})`;
      ctx.lineWidth = 1;

      for (let i = 0; i < triangles; i++) {
        const angle = rotation + (i * Math.PI * 2) / triangles;
        const r = size * (0.5 + Math.sin(time * 0.3 + i) * 0.2);
        
        ctx.beginPath();
        for (let j = 0; j < 3; j++) {
          const a = angle + (j * Math.PI * 2) / 3;
          const px = x + Math.cos(a) * r;
          const py = y + Math.sin(a) * r;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(5, 5, 16, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time += 0.005;

      if (variant === 'metatron') {
        // Grid of Metatron's Cubes
        const cols = Math.ceil(canvas.width / 400);
        const rows = Math.ceil(canvas.height / 400);

        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x = i * 400 + 200;
            const y = j * 400 + 200;
            drawMetatronsCube(x, y, 80 + Math.sin(time + i + j) * 10, time * 0.2);
          }
        }
      } else if (variant === 'flower') {
        // Flower of Life pattern
        const cols = Math.ceil(canvas.width / 300);
        const rows = Math.ceil(canvas.height / 300);

        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x = i * 300 + 150;
            const y = j * 300 + 150;
            drawFlowerOfLife(x, y, 40, time * 0.3);
          }
        }
      } else if (variant === 'sri-yantra') {
        // Central Sri Yantra
        drawSriYantra(canvas.width / 2, canvas.height / 2, 200, time * 0.5);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [variant, intensity]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: intensity }}
      />
      
      {/* Gradient overlay for depth */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-br from-[#050510] via-transparent to-[#1a0a3e] opacity-60" />
      
      {/* Radial gradient spotlight */}
      <div className="fixed inset-0 pointer-events-none z-0" 
        style={{
          background: 'radial-gradient(circle at 50% 20%, rgba(245,166,35,0.08) 0%, transparent 50%)'
        }}
      />
    </>
  );
}