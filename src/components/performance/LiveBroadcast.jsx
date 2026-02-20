import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Radio, Users, StopCircle, Play, Flame, Zap, Heart, Brain, Palette, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const reactionTypes = [
  { type: 'fire', icon: Flame, color: 'text-orange-500', label: 'Fire' },
  { type: 'energy', icon: Zap, color: 'text-yellow-400', label: 'Energy' },
  { type: 'love', icon: Heart, color: 'text-pink-500', label: 'Love' },
  { type: 'mind_blown', icon: Brain, color: 'text-purple-500', label: 'Mind Blown' },
  { type: 'colors', icon: Palette, color: 'text-cyan-400', label: 'Colors' },
  { type: 'chill', icon: Sparkles, color: 'text-blue-400', label: 'Chill' }
];

export default function LiveBroadcast({ currentState, songId, currentTime, onReactionInfluence }) {
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [performanceId, setPerformanceId] = useState(null);
  const [streamKey, setStreamKey] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [title, setTitle] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [recentReactions, setRecentReactions] = useState([]);

  // Subscribe to reactions
  useEffect(() => {
    if (!performanceId) return;

    const unsubscribe = base44.entities.PerformanceReaction.subscribe((event) => {
      if (event.type === 'create' && event.data.performance_id === performanceId) {
        setRecentReactions(prev => [event.data, ...prev].slice(0, 10));
        
        // Influence AI based on reaction
        if (onReactionInfluence) {
          onReactionInfluence(event.data);
        }
      }
    });

    return unsubscribe;
  }, [performanceId]);

  // Update broadcast state periodically
  useEffect(() => {
    if (!isBroadcasting || !performanceId) return;

    const interval = setInterval(async () => {
      try {
        await base44.functions.invoke('broadcast-performance', {
          action: 'update',
          performanceId,
          state: currentState,
          songId,
          currentTime
        });
      } catch (error) {
        console.error('Failed to update broadcast:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isBroadcasting, performanceId, currentState, songId, currentTime]);

  const startBroadcast = async () => {
    try {
      const { data } = await base44.functions.invoke('broadcast-performance', {
        action: 'start',
        title: title || 'Live VJ Performance',
        state: currentState,
        songId,
        currentTime
      });

      setPerformanceId(data.performanceId);
      setStreamKey(data.streamKey);
      setIsBroadcasting(true);
      toast.success('Broadcast started!');
    } catch (error) {
      toast.error('Failed to start broadcast');
    }
  };

  const endBroadcast = async () => {
    try {
      await base44.functions.invoke('broadcast-performance', {
        action: 'end',
        performanceId
      });

      setIsBroadcasting(false);
      setPerformanceId(null);
      toast.success('Broadcast ended & recording saved');
    } catch (error) {
      toast.error('Failed to end broadcast');
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-xl border border-red-500/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className={`w-4 h-4 ${isBroadcasting ? 'text-red-500 animate-pulse' : 'text-red-400/50'}`} />
          <h3 className="text-white/90 font-medium text-sm">Live Broadcast</h3>
          {isBroadcasting && (
            <Badge className="bg-red-500 text-white text-[10px] animate-pulse">
              LIVE
            </Badge>
          )}
        </div>
        {isBroadcasting && (
          <div className="flex items-center gap-2">
            <Users className="w-3 h-3 text-white/40" />
            <span className="text-white/60 text-xs">{viewerCount}</span>
          </div>
        )}
      </div>

      {!isBroadcasting ? (
        <div className="space-y-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Performance title..."
            className="bg-white/5 border-white/10 text-white text-sm"
          />
          
          <div className="flex items-center justify-between">
            <Label className="text-white/60 text-xs">Public stream</Label>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          <Button
            onClick={startBroadcast}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:opacity-90"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Broadcasting
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-black/20 rounded-lg p-3 border border-red-500/20">
            <div className="text-white/60 text-[10px] mb-1">Stream Key</div>
            <div className="text-white/90 text-xs font-mono">{streamKey}</div>
          </div>

          {recentReactions.length > 0 && (
            <div>
              <div className="text-white/60 text-[10px] mb-2">Live Reactions</div>
              <div className="flex flex-wrap gap-1">
                {recentReactions.slice(0, 6).map((reaction, idx) => {
                  const reactionConfig = reactionTypes.find(r => r.type === reaction.reaction_type);
                  if (!reactionConfig) return null;
                  const Icon = reactionConfig.icon;
                  return (
                    <motion.div
                      key={reaction.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`p-1.5 rounded-lg bg-black/30 ${reactionConfig.color}`}
                    >
                      <Icon className="w-3 h-3" />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          <Button
            onClick={endBroadcast}
            variant="outline"
            className="w-full border-red-400/30 text-red-400 hover:bg-red-500/10"
          >
            <StopCircle className="w-4 h-4 mr-2" />
            End Broadcast
          </Button>
        </div>
      )}
    </div>
  );
}