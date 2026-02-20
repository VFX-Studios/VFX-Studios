import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Copy, Palette, Layers, Save } from 'lucide-react';
import { toast } from 'sonner';
import VJControlPanel from '@/components/vj/VJControlPanel';

export default function CollaborationRoom() {
  const [user, setUser] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [sharedState, setSharedState] = useState({});

  useEffect(() => {
    const init = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Get or create room from URL
      const urlParams = new URLSearchParams(window.location.search);
      const room = urlParams.get('room') || `room_${Date.now()}`;
      setRoomId(room);
      
      // Subscribe to room changes (real-time sync)
      // In production: Use WebSocket or Server-Sent Events
    };
    init();
  }, []);

  const copyRoomLink = () => {
    const link = `${window.location.origin}/collaboration-room?room=${roomId}`;
    navigator.clipboard.writeText(link);
    toast.success('Room link copied! Share with collaborators.');
  };

  const saveAsTemplate = async () => {
    try {
      // Save current state as marketplace template
      await base44.entities.VJPreset.create({
        user_id: user.id,
        name: `Collaborative Session ${new Date().toLocaleDateString()}`,
        parameters: sharedState,
        is_public: true
      });
      toast.success('Session saved as template!');
    } catch (error) {
      toast.error('Save failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Collaboration Room</h1>
            <p className="text-white/60 text-sm">Real-time multi-user VFX editing</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={copyRoomLink} variant="outline" className="border-white/20 text-white">
              <Copy className="w-4 h-4 mr-2" />
              Share Room Link
            </Button>
            <Button onClick={saveAsTemplate} className="bg-[#f5a623]">
              <Save className="w-4 h-4 mr-2" />
              Save as Template
            </Button>
          </div>
        </div>

        {/* Collaborators Bar */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="flex items-center gap-4">
            <Users className="w-5 h-5 text-[#f5a623]" />
            <div className="flex gap-2 flex-1">
              {collaborators.map((collab, i) => (
                <Badge key={i} className="bg-[#f5a623]/20 text-[#f5a623]">
                  {collab.name}
                </Badge>
              ))}
              {collaborators.length === 0 && (
                <span className="text-white/60 text-sm">No collaborators yet - share the room link!</span>
              )}
            </div>
            <Badge className="bg-green-500/20 text-green-400">
              {collaborators.length + 1} active
            </Badge>
          </div>
        </Card>

        {/* Shared VJ Control Panel */}
        <VJControlPanel
          onStateChange={(newState) => {
            setSharedState(newState);
            // Broadcast to all users in room via WebSocket
          }}
          isCollaborative={true}
        />

        {/* Activity Feed */}
        <Card className="bg-white/5 border-white/10 p-6 mt-6">
          <h3 className="text-white font-semibold mb-4">Activity Feed</h3>
          <div className="space-y-2 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>User123 changed color palette</span>
              <span className="text-white/40 text-xs ml-auto">2 min ago</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>DJ_Alex adjusted layer opacity</span>
              <span className="text-white/40 text-xs ml-auto">5 min ago</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}