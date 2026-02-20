import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Zap, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SentimentFeedback({ streamId, onSuggestions }) {
  const [sentiment, setSentiment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!streamId) return;

    // Poll sentiment every 10 seconds
    const fetchSentiment = async () => {
      try {
        const response = await base44.functions.invoke('analyze-stream-sentiment', {
          stream_id: streamId,
          time_window_seconds: 30
        });
        
        setSentiment(response.data);
        if (onSuggestions && response.data.ai_suggestions) {
          onSuggestions(response.data.ai_suggestions);
        }
        setLoading(false);
      } catch (error) {
        console.error('Sentiment fetch error');
      }
    };

    fetchSentiment();
    const interval = setInterval(fetchSentiment, 10000);

    return () => clearInterval(interval);
  }, [streamId]);

  if (loading || !sentiment) {
    return (
      <Card className="bg-white/5 border-white/10 p-4">
        <div className="text-white/60 text-sm">Analyzing audience...</div>
      </Card>
    );
  }

  const getSentimentColor = () => {
    if (sentiment.sentiment === 'excited') return 'from-green-500 to-emerald-500';
    if (sentiment.sentiment === 'positive') return 'from-blue-500 to-cyan-500';
    if (sentiment.sentiment === 'negative') return 'from-red-500 to-orange-500';
    return 'from-gray-500 to-slate-500';
  };

  const getSentimentIcon = () => {
    if (sentiment.sentiment === 'excited' || sentiment.sentiment === 'positive') {
      return <TrendingUp className="w-5 h-5" />;
    }
    if (sentiment.sentiment === 'negative') {
      return <TrendingDown className="w-5 h-5" />;
    }
    return <Minus className="w-5 h-5" />;
  };

  return (
    <Card className={`bg-gradient-to-r ${getSentimentColor()} bg-opacity-20 border-white/10 p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white">
          {getSentimentIcon()}
          <span className="font-semibold capitalize">{sentiment.sentiment}</span>
        </div>
        <Badge className="bg-white/20 text-white">
          <Users className="w-3 h-3 mr-1" />
          {sentiment.total_reactions} reactions
        </Badge>
      </div>

      {/* Reaction Breakdown */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {Object.entries(sentiment.reaction_breakdown).map(([emoji, count]) => (
          <div key={emoji} className="text-center">
            <div className="text-2xl mb-1">
              {emoji === 'fire' && '🔥'}
              {emoji === 'heart' && '❤️'}
              {emoji === 'laugh' && '😂'}
              {emoji === 'surprised' && '😮'}
              {emoji === 'sad' && '😢'}
            </div>
            <div className="text-white text-sm font-semibold">{count}</div>
          </div>
        ))}
      </div>

      {/* AI Suggestions */}
      {sentiment.ai_suggestions && sentiment.ai_suggestions.length > 0 && (
        <div className="bg-black/20 rounded-lg p-3">
          <div className="flex items-center gap-2 text-[#f5a623] text-sm font-semibold mb-2">
            <Zap className="w-4 h-4" />
            AI Suggestions
          </div>
          <ul className="space-y-1">
            {sentiment.ai_suggestions.map((suggestion, i) => (
              <li key={i} className="text-white/80 text-sm">• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}