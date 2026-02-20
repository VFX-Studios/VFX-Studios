import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Clock, Palette, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export default function PerformanceDirector({ song, currentTime, currentState, emotionalArc, onApplySuggestion }) {
  const [direction, setDirection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoMode, setAutoMode] = useState(false);

  useEffect(() => {
    if (autoMode && song) {
      const interval = setInterval(() => {
        fetchDirection();
      }, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoMode, song]);

  const fetchDirection = async () => {
    if (!song) return;

    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('performance-director', {
        songId: song.id,
        currentTime,
        currentState,
        emotionalArc
      });

      setDirection(data.direction);
    } catch (error) {
      console.error('Director error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyPresetSuggestion = () => {
    if (direction?.preset_recommendation?.should_change) {
      toast.success(`Preset change recommended: ${direction.preset_recommendation.preset_name}`);
      // Trigger preset load
    }
  };

  const applyParameterAdjustments = () => {
    if (direction?.parameter_adjustments && onApplySuggestion) {
      onApplySuggestion({
        effects: direction.parameter_adjustments.effects,
        color_grading: direction.parameter_adjustments.color_grading
      });
      toast.success('Parameters adjusted');
    }
  };

  const priorityColors = {
    low: 'border-blue-400/20 bg-blue-900/10',
    medium: 'border-yellow-400/20 bg-yellow-900/10',
    high: 'border-orange-400/20 bg-orange-900/10',
    critical: 'border-red-400/20 bg-red-900/10 animate-pulse'
  };

  if (!song) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-xl border border-indigo-500/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-400" />
          <h3 className="text-white/90 font-medium text-sm">Performance Director</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchDirection}
            disabled={loading}
            className="h-7 text-xs border-indigo-400/30"
          >
            {loading ? 'Analyzing...' : 'Get Direction'}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {direction && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-lg border p-4 ${priorityColors[direction.priority || 'medium']}`}
          >
            {/* Overall Direction */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${
                  direction.priority === 'critical' ? 'bg-red-500' :
                  direction.priority === 'high' ? 'bg-orange-500' :
                  direction.priority === 'medium' ? 'bg-yellow-500' :
                  'bg-blue-500'
                } text-white text-[10px]`}>
                  {direction.priority?.toUpperCase()}
                </Badge>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                {direction.overall_direction}
              </p>
            </div>

            {/* Preset Recommendation */}
            {direction.preset_recommendation?.should_change && (
              <Card className="bg-black/20 border-white/10 p-3 mb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-3 h-3 text-yellow-400" />
                      <span className="text-white/90 text-xs font-medium">Preset Change</span>
                    </div>
                    <p className="text-white/60 text-[11px] mb-2">
                      {direction.preset_recommendation.reasoning}
                    </p>
                    <div className="text-white/40 text-[10px]">
                      Suggested: {direction.preset_recommendation.preset_name}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={applyPresetSuggestion}
                    className="h-7 text-xs bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                  >
                    Apply
                  </Button>
                </div>
              </Card>
            )}

            {/* Asset Suggestions */}
            {direction.matched_assets && direction.matched_assets.length > 0 && (
              <Card className="bg-black/20 border-white/10 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-3 h-3 text-cyan-400" />
                  <span className="text-white/90 text-xs font-medium">Asset Suggestions</span>
                </div>
                <div className="space-y-2">
                  {direction.matched_assets.map((asset, idx) => (
                    <div key={asset.id} className="text-[11px]">
                      <span className="text-white/80">{asset.name}</span>
                      <span className="text-white/40 ml-2">
                        - {direction.asset_suggestions[idx]?.usage}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Generate Art Suggestion */}
            {direction.generate_art?.should_generate && (
              <Card className="bg-black/20 border-white/10 p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-3 h-3 text-purple-400" />
                  <span className="text-white/90 text-xs font-medium">AI Art Generation</span>
                </div>
                <p className="text-white/60 text-[11px] mb-2">
                  {direction.generate_art.reasoning}
                </p>
                <div className="text-white/40 text-[10px] mb-2">
                  Styles: {direction.generate_art.styles?.join(', ')}
                </div>
                <Button
                  size="sm"
                  className="h-7 w-full text-xs bg-purple-500/20 text-purple-400"
                >
                  Generate Now
                </Button>
              </Card>
            )}

            {/* Parameter Adjustments */}
            {direction.parameter_adjustments && (
              <Card className="bg-black/20 border-white/10 p-3 mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-green-400" />
                    <span className="text-white/90 text-xs font-medium">Parameter Tweaks</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={applyParameterAdjustments}
                    className="h-7 text-xs bg-green-500/20 text-green-400"
                  >
                    Apply
                  </Button>
                </div>
                <p className="text-white/60 text-[11px]">
                  {direction.parameter_adjustments.reasoning}
                </p>
              </Card>
            )}

            {/* Upcoming Transition */}
            {direction.upcoming_transition && (
              <Card className="bg-black/20 border-white/10 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3 text-orange-400" />
                  <span className="text-white/90 text-xs font-medium">Upcoming</span>
                </div>
                <p className="text-white/60 text-[11px]">
                  In {direction.upcoming_transition.countdown_seconds}s: {direction.upcoming_transition.suggested_action}
                </p>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}