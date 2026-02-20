import React, { useRef, useState, useEffect } from 'react';
import { Pencil, Circle, Type, ArrowRight, Eraser, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const tools = [
  { id: 'draw', icon: Pencil, label: 'Draw' },
  { id: 'arrow', icon: ArrowRight, label: 'Arrow' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' }
];

const colors = ['#f5a623', '#e91e8c', '#00d4ff', '#10b981', '#8b5cf6', '#ffffff'];

export default function WhiteboardLayer({ sessionId, annotations = [] }) {
  const canvasRef = useRef(null);
  const [activeTool, setActiveTool] = useState('draw');
  const [activeColor, setActiveColor] = useState('#f5a623');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const queryClient = useQueryClient();

  const createAnnotationMutation = useMutation({
    mutationFn: (data) => base44.entities.WhiteboardAnnotation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-annotations', sessionId] });
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const allAnnotations = await base44.entities.WhiteboardAnnotation.filter({ session_id: sessionId });
      await Promise.all(allAnnotations.map(a => base44.entities.WhiteboardAnnotation.delete(a.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-annotations', sessionId] });
    }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all annotations
    annotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      if (annotation.annotation_type === 'draw') {
        const points = annotation.data.points;
        if (points && points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          points.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }
      } else if (annotation.annotation_type === 'circle') {
        ctx.beginPath();
        ctx.arc(annotation.data.x, annotation.data.y, annotation.data.radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
  }, [annotations]);

  const startDrawing = (e) => {
    if (activeTool === 'eraser') return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPath([{ x, y }]);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentPath(prev => [...prev, { x, y }]);

    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = async () => {
    if (!isDrawing || currentPath.length < 2) {
      setIsDrawing(false);
      return;
    }

    // Save annotation to database
    await createAnnotationMutation.mutateAsync({
      session_id: sessionId,
      annotation_type: activeTool,
      data: { points: currentPath },
      color: activeColor,
      timestamp_seconds: Date.now() / 1000
    });

    setIsDrawing(false);
    setCurrentPath([]);
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 flex gap-2 pointer-events-auto">
        <div className="bg-black/80 backdrop-blur-md rounded-lg border border-white/20 p-2 flex gap-1">
          {tools.map(tool => {
            const Icon = tool.icon;
            return (
              <Button
                key={tool.id}
                size="sm"
                variant={activeTool === tool.id ? 'default' : 'ghost'}
                onClick={() => setActiveTool(tool.id)}
                className="w-8 h-8 p-0"
                title={tool.label}
              >
                <Icon className="w-4 h-4" />
              </Button>
            );
          })}
          <div className="w-px bg-white/20 mx-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clearAllMutation.mutate()}
            className="w-8 h-8 p-0 text-red-400 hover:text-red-300"
            title="Clear All"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-black/80 backdrop-blur-md rounded-lg border border-white/20 p-2 flex gap-1">
          {colors.map(color => (
            <button
              key={color}
              onClick={() => setActiveColor(color)}
              className={`w-6 h-6 rounded border-2 transition-transform ${
                activeColor === color ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full pointer-events-auto cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
    </div>
  );
}