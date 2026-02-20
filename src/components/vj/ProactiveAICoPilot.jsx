import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Wand2, Zap, TrendingUp, Loader2, ThumbsUp, ThumbsDown, Image, Music, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ProactiveAICoPilot({ 
  song, 
  currentEnergy, 
  onApplyPreset, 
  onUpdateState, 
  currentState = {}, 
  viewerReactions = [], 
  elapsedTime = 0,
  allSongs = [],
  userAssets = []
}) {
  const [aiActive, setAiActive] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState(null);
  const [suggestionHistory, setSuggestionHistory] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Auto-refresh suggestions every 15 seconds when active
  useEffect(() => {
    if (aiActive && autoRefresh && song) {
      const interval = setInterval(() => {
        getProactiveSuggestion();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [aiActive, autoRefresh, song, elapsedTime]);

  const getProactiveSuggestion = async () => {
    if (!song) return;
    setLoadingSuggestion(true);

    try {
      const response = await base44.functions.invoke('ai-proactive-copilot', {
        song_id: song.id,
        current_energy: currentEnergy,
        current_state: currentState,
        viewer_reactions: viewerReactions,
        elapsed_time: elapsedTime,
        all_songs: allSongs.map(s => ({ id: s.id, title: s.title, set_position: s.set_position, energy_level: s.energy_level })),
        available_assets: userAssets.slice(0, 20).map(a => ({ id: a.id, name: a.name, type: a.type, tags: a.tags })),
      });

      setCurrentSuggestion(response.data.suggestion);
      toast.success('AI suggestion ready!');
    } catch (error) {
      toast.error('Failed to get AI suggestion');
      console.error(error);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const handleAcceptSuggestion = async () => {
    if (!currentSuggestion) return;

    try {
      // Apply the suggestion
      if (currentSuggestion.primary_suggestion?.parameters) {
        onUpdateState(currentSuggestion.primary_suggestion.parameters);
      }

      // Log feedback for AI training
      await base44.functions.invoke('ai-feedback', {
        suggestion_id: currentSuggestion.suggestion_id,
        feedback: 'accepted',
        song_id: song.id,
        suggestion_data: currentSuggestion,
        context: {
          elapsed_time: elapsedTime,
          energy: currentEnergy,
          viewer_reactions: viewerReactions.length,
        }
      });

      setSuggestionHistory(prev => [...prev, { ...currentSuggestion, feedback: 'accepted', timestamp: Date.now() }]);
      setCurrentSuggestion(null);
      toast.success('Suggestion applied & logged for learning!');
    } catch (error) {
      toast.error('Failed to apply suggestion');
    }
  };

  const handleRejectSuggestion = async () => {
    if (!currentSuggestion) return;

    try {
      await base44.functions.invoke('ai-feedback', {
        suggestion_id: currentSuggestion.suggestion_id,
        feedback: 'rejected',
        song_id: song.id,
        suggestion_data: currentSuggestion,
        context: {
          elapsed_time: elapsedTime,
          energy: currentEnergy,
          viewer_reactions: viewerReactions.length,
        }
      });

      setSuggestionHistory(prev => [...prev, { ...currentSuggestion, feedback: 'rejected', timestamp: Date.now() }]);
      setCurrentSuggestion(null);
      toast.success('Feedback recorded');
    } catch (error) {
      toast.error('Failed to record feedback');
    }
  };

  const generateVisualAsset = async () => {
    if (!song) return;

    try {
      setLoadingSuggestion(true);
      const response = await base44.functions.invoke('ai-generate-visual-asset', {
        song_id: song.id,
        song_metadata: {
          title: song.title,
          bpm: song.tempo_bpm_estimate,
          energy: song.energy_level,
          mood: song.visual_mood,
          section: song.set_section,
        },
        resolution: '4k', // High resolution
        format: 'animation',
      });

      toast.success('Visual asset generated and saved to library!');
      setLoadingSuggestion(false);
    } catch (error) {
      toast.error('Asset generation failed');
      setLoadingSuggestion(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-medium">Proactive AI Co-Pilot</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-white/60 text-xs">Auto</Label>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Switch checked={aiActive} onCheckedChange={setAiActive} />
        </div>
      </div>

      {aiActive && (
        <div className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
          <div className="flex items-center gap-2 text-purple-400 text-xs mb-2">
            <TrendingUp className="w-3 h-3" />
            <span className="font-medium">Live Performance Analysis</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-black/20 rounded p-2">
              <div className="text-white/40">Energy</div>
              <div className="text-white font-mono">{currentEnergy}/10</div>
            </div>
            <div className="bg-black/20 rounded p-2">
              <div className="text-white/40">Reactions</div>
              <div className="text-white font-mono">{viewerReactions.length}</div>
            </div>
            <div className="bg-black/20 rounded p-2">
              <div className="text-white/40">Progress</div>
              <div className="text-white font-mono">
                {Math.round((elapsedTime / (song?.duration_seconds || 1)) * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Button
          onClick={getProactiveSuggestion}
          disabled={loadingSuggestion || !song}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loadingSuggestion ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Get AI Suggestion
            </>
          )}
        </Button>

        <Button
          onClick={generateVisualAsset}
          disabled={loadingSuggestion || !song}
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90"
        >
          <Image className="w-4 h-4 mr-2" />
          Generate Visual Asset
        </Button>

        <AnimatePresence>
          {currentSuggestion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-black/40 rounded-lg p-4 space-y-3 border-2 border-purple-500/50"
            >
              <div className="flex items-center justify-between">
                <Badge className={
                  currentSuggestion.urgency === 'critical' ? 'bg-red-500' :
                  currentSuggestion.urgency === 'high' ? 'bg-orange-500' :
                  currentSuggestion.urgency === 'medium' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }>
                  {currentSuggestion.urgency} priority
                </Badge>
                <div className="flex items-center gap-1 text-xs text-white/60">
                  <Zap className="w-3 h-3" />
                  Apply in {currentSuggestion.primary_suggestion?.apply_in_seconds}s
                </div>
              </div>

              <div>
                <div className="text-white font-medium mb-1">
                  {currentSuggestion.primary_suggestion?.description}
                </div>
                <div className="text-white/60 text-sm">
                  {currentSuggestion.reasoning}
                </div>
              </div>

              {currentSuggestion.audience_insight && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                  <div className="text-blue-400 text-xs font-medium mb-1">👥 Audience Insight</div>
                  <div className="text-white/70 text-xs">{currentSuggestion.audience_insight}</div>
                </div>
              )}

              {currentSuggestion.recommended_assets && currentSuggestion.recommended_assets.length > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2">
                  <div className="text-purple-400 text-xs font-medium mb-2">🎨 Recommended Assets</div>
                  <div className="space-y-1">
                    {currentSuggestion.recommended_assets.slice(0, 3).map((asset, i) => (
                      <div key={i} className="text-white/70 text-xs flex items-center gap-2">
                        <Image className="w-3 h-3" />
                        {asset.name} - {asset.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentSuggestion.setlist_recommendation && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded p-2">
                  <div className="text-orange-400 text-xs font-medium mb-1 flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    Setlist Suggestion
                  </div>
                  <div className="text-white/70 text-xs">
                    {currentSuggestion.setlist_recommendation.suggested_change}
                  </div>
                  <div className="text-white/40 text-xs mt-1">
                    {currentSuggestion.setlist_recommendation.reason}
                  </div>
                </div>
              )}

              {currentSuggestion.secondary_suggestions && currentSuggestion.secondary_suggestions.length > 0 && (
                <div className="border-t border-white/10 pt-2">
                  <div className="text-white/40 text-xs mb-2">Secondary Suggestions:</div>
                  {currentSuggestion.secondary_suggestions.map((sec, i) => (
                    <div key={i} className="text-white/60 text-xs mb-1">
                      • {sec.description} ({sec.timing})
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleAcceptSuggestion}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Accept & Apply
                </Button>
                <Button
                  onClick={handleRejectSuggestion}
                  variant="outline"
                  className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {suggestionHistory.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <div className="text-white/60 text-xs mb-2 flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              Recent Feedback ({suggestionHistory.length})
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {suggestionHistory.slice(-3).reverse().map((hist, i) => (
                <div key={i} className="text-xs bg-white/5 rounded p-2 flex items-center justify-between">
                  <span className="text-white/60 truncate flex-1">
                    {hist.primary_suggestion?.description || 'Suggestion'}
                  </span>
                  {hist.feedback === 'accepted' ? (
                    <CheckCircle2 className="w-3 h-3 text-green-400 ml-2" />
                  ) : (
                    <ThumbsDown className="w-3 h-3 text-red-400 ml-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}