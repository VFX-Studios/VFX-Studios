import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ThumbsUp, ThumbsDown, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import SentimentFeedback from '@/components/analytics/SentimentFeedback';

export default function EnhancedAICoPilotV2({ 
  currentSong, 
  currentState, 
  onApplySuggestion,
  streamId 
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentimentSuggestions, setSentimentSuggestions] = useState([]);

  useEffect(() => {
    if (!currentSong) return;

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await base44.functions.invoke('ai-real-time-copilot', {
          song_id: currentSong.id,
          current_state: currentState,
          viewer_reactions: []
        });

        setSuggestions(response.data?.suggestions || []);
      } catch (error) {
        console.error('AI Co-Pilot error');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
    const interval = setInterval(fetchSuggestions, 15000);
    return () => clearInterval(interval);
  }, [currentSong, currentState]);

  const handleAccept = async (suggestion) => {
    // Learn from accepted suggestion
    await base44.functions.invoke('ai-feedback', {
      song_id: currentSong.id,
      suggestion,
      accepted: true,
      current_state: currentState
    });

    // Apply granular learning: extract intensity and color preferences
    const intensity = suggestion.parameters?.intensity || currentState.intensity || 50;
    const colorPalette = suggestion.parameters?.colors || currentState.colors || [];

    await base44.entities.AILearningData.create({
      user_id: (await base44.auth.me()).id,
      learning_type: 'accepted_suggestion',
      song_id: currentSong.id,
      music_context: {
        bpm: currentSong.tempo_bpm_estimate,
        energy: currentSong.energy_level,
        mood: currentSong.visual_mood
      },
      parameters: {
        intensity,
        color_palette: colorPalette,
        effect_type: suggestion.effect_type,
        accepted_at: new Date().toISOString()
      }
    });

    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
    }

    toast.success('Applied & Learning from your choice!');
  };

  const handleReject = async (suggestion) => {
    await base44.functions.invoke('ai-feedback', {
      song_id: currentSong.id,
      suggestion,
      accepted: false,
      current_state: currentState
    });

    // Log rejected parameters to avoid in future
    await base44.entities.AILearningData.create({
      user_id: (await base44.auth.me()).id,
      learning_type: 'rejected_suggestion',
      song_id: currentSong.id,
      parameters: suggestion.parameters
    });

    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    toast.info('Noted. AI will avoid similar suggestions.');
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#f5a623]" />
          <h3 className="text-white font-semibold">AI Co-Pilot</h3>
          {loading && <Badge className="bg-blue-500 ml-auto">Analyzing...</Badge>}
        </div>

        {/* Sentiment Analysis Integration */}
        {streamId && (
          <SentimentFeedback 
            streamId={streamId} 
            onSuggestions={(suggestions) => setSentimentSuggestions(suggestions)}
          />
        )}

        {/* AI Suggestions */}
        <div className="space-y-3 mt-4">
          {suggestions.map((suggestion, index) => (
            <Card key={index} className="bg-white/10 border-white/20 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">{suggestion.title}</h4>
                  <p className="text-white/60 text-sm">{suggestion.description}</p>
                  
                  {/* Parameter Details */}
                  {suggestion.parameters && (
                    <div className="mt-2 space-y-1 text-xs">
                      {suggestion.parameters.intensity && (
                        <div className="text-[#f5a623]">
                          Intensity: {suggestion.parameters.intensity}%
                        </div>
                      )}
                      {suggestion.parameters.colors && (
                        <div className="flex gap-1">
                          {suggestion.parameters.colors.map((color, i) => (
                            <div 
                              key={i} 
                              className="w-4 h-4 rounded-full border border-white/20"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAccept(suggestion)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <ThumbsUp className="w-3 h-3 mr-2" />
                  Apply
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleReject(suggestion)}
                  variant="outline"
                  className="border-white/20 text-white"
                >
                  <ThumbsDown className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}

          {suggestions.length === 0 && !loading && (
            <div className="text-center py-6 text-white/40 text-sm">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
              AI is learning your style...
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}