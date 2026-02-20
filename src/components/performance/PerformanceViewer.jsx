import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame, Zap, Heart, Brain, Palette, Sparkles, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const reactionTypes = [
  { type: 'fire', icon: Flame, color: 'bg-orange-500', label: 'Fire' },
  { type: 'energy', icon: Zap, color: 'bg-yellow-400', label: 'Energy' },
  { type: 'love', icon: Heart, color: 'bg-pink-500', label: 'Love' },
  { type: 'mind_blown', icon: Brain, color: 'bg-purple-500', label: 'Mind Blown' },
  { type: 'colors', icon: Palette, color: 'bg-cyan-400', label: 'Colors' },
  { type: 'chill', icon: Sparkles, color: 'bg-blue-400', label: 'Chill' }
];

export default function PerformanceViewer({ streamKey }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: performance } = useQuery({
    queryKey: ['live-performance', streamKey],
    queryFn: async () => {
      const performances = await base44.entities.LivePerformance.filter({ 
        stream_key: streamKey,
        is_live: true 
      });
      return performances[0];
    },
    refetchInterval: 2000,
    enabled: !!streamKey
  });

  const sendReaction = async (reactionType) => {
    if (!currentUser || !performance) {
      toast.error('Must be logged in to react');
      return;
    }

    try {
      await base44.entities.PerformanceReaction.create({
        performance_id: performance.id,
        user_id: currentUser.id,
        reaction_type: reactionType,
        timestamp_seconds: performance.current_time || 0,
        intensity: 8
      });
      
      toast.success('Reaction sent!');
    } catch (error) {
      toast.error('Failed to send reaction');
    }
  };

  if (!performance) {
    return (
      <div className="bg-black/40 rounded-xl border border-white/10 p-8 text-center">
        <div className="text-white/40">Stream not found or ended</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-500/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white text-lg font-medium">{performance.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge className="bg-red-500 text-white text-[10px] animate-pulse">LIVE</Badge>
            <div className="flex items-center gap-1 text-white/40 text-xs">
              <Users className="w-3 h-3" />
              <span>{performance.viewer_count || 0} watching</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Representation */}
      <div className="bg-black/40 rounded-lg p-6 mb-6 min-h-[300px] flex items-center justify-center">
        <div className="text-white/40 text-sm">
          Live visual stream display
        </div>
      </div>

      {/* Reactions */}
      <div>
        <div className="text-white/60 text-sm mb-3">Send Reaction</div>
        <div className="grid grid-cols-6 gap-2">
          {reactionTypes.map(({ type, icon: Icon, color, label }) => (
            <motion.button
              key={type}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => sendReaction(type)}
              className={`${color} p-3 rounded-lg hover:opacity-90 transition-opacity`}
              title={label}
            >
              <Icon className="w-5 h-5 text-white mx-auto" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}