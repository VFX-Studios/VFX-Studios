import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Palette, Layers, Sparkles } from 'lucide-react';

export default function RealTimeEditor({ roomId, onStateChange }) {
  const [brightness, setBrightness] = useState(50);
  const [saturation, setSaturation] = useState(75);
  const [hue, setHue] = useState(180);
  const [collaborators, setCollaborators] = useState([
    { id: 1, name: 'You', color: '#f5a623' }
  ]);

  useEffect(() => {
    // Sync state changes to all users
    if (onStateChange) {
      onStateChange({ brightness, saturation, hue });
    }
    
    // In production: Use WebSocket for real-time sync
    // const ws = new WebSocket(`wss://api.vfxstudios.com/collab/${roomId}`);
    // ws.onmessage = (event) => {
    //   const update = JSON.parse(event.data);
    //   if (update.type === 'state_change') {
    //     setBrightness(update.brightness);
    //     setSaturation(update.saturation);
    //     setHue(update.hue);
    //   }
    // };
  }, [brightness, saturation, hue, roomId]);

  return (
    <div className="space-y-6">
      {/* Active Users */}
      <Card className="bg-white/5 border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-[#f5a623]" />
          <span className="text-white font-medium">Live Editing</span>
          <div className="flex gap-2 ml-auto">
            {collaborators.map(c => (
              <Badge key={c.id} style={{ backgroundColor: c.color }}>
                {c.name}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* Color Controls */}
      <Card className="bg-white/5 border-white/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">Color Adjustments</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-white/70">Brightness: {brightness}</Label>
            <Slider
              value={[brightness]}
              onValueChange={(val) => setBrightness(val[0])}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-white/70">Saturation: {saturation}</Label>
            <Slider
              value={[saturation]}
              onValueChange={(val) => setSaturation(val[0])}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label className="text-white/70">Hue: {hue}°</Label>
            <Slider
              value={[hue]}
              onValueChange={(val) => setHue(val[0])}
              max={360}
              step={1}
              className="mt-2"
            />
          </div>
        </div>
      </Card>

      {/* Preview */}
      <Card className="bg-white/5 border-white/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">Live Preview</h3>
        </div>
        <div 
          className="aspect-video rounded-lg"
          style={{
            filter: `brightness(${brightness}%) saturate(${saturation}%) hue-rotate(${hue}deg)`,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        />
      </Card>
    </div>
  );
}