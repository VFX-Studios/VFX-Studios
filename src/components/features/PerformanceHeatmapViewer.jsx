import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function PerformanceHeatmapViewer({ performanceId }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHeatmap();
  }, [performanceId]);

  const loadHeatmap = async () => {
    try {
      const data = await base44.entities.PerformanceHeatmap.filter({
        performance_id: performanceId
      });

      // Sort by timestamp
      const sorted = data.sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
      setHeatmapData(sorted);

      // AI-generated insights
      await generateInsights(sorted);
    } catch (error) {
      console.error('Heatmap load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async (data) => {
    // Find low-performing segments
    const lowMoments = data.filter(d => d.sentiment_score < 0).map(d => ({
      start: Math.floor(d.timestamp_seconds),
      end: Math.floor(d.timestamp_seconds) + 30,
      sentiment: d.sentiment_score,
      current_visual: d.visual_asset_id,
      recommendation: d.ai_recommendation
    }));

    // Find peak moments
    const peakMoments = data.filter(d => d.sentiment_score > 0.7).map(d => ({
      timestamp: d.timestamp_seconds,
      sentiment: d.sentiment_score,
      visual: d.visual_asset_id
    }));

    const generatedInsights = [
      ...lowMoments.map(m => ({
        type: 'warning',
        message: `Low engagement at ${formatTime(m.start)}-${formatTime(m.end)}`,
        suggestion: m.recommendation || `Try higher energy visual. Detected energy: ${m.sentiment < -0.5 ? 'too low' : 'inconsistent'}`,
        action: 'Replace visual'
      })),
      ...peakMoments.map(m => ({
        type: 'success',
        message: `Peak moment at ${formatTime(m.timestamp)}`,
        suggestion: `Audience loved this! Repeat similar styles.`,
        action: 'Save as preset'
      }))
    ];

    setInsights(generatedInsights.slice(0, 5));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const chartData = heatmapData.map(d => ({
    time: formatTime(d.timestamp_seconds),
    sentiment: d.sentiment_score * 100,
    energy: d.energy_level * 10
  }));

  return (
    <div className="space-y-6">
      {/* Sentiment Timeline Chart */}
      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-white font-semibold text-lg mb-4">Audience Sentiment Timeline</h3>
        
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#ffffff40" />
              <YAxis stroke="#ffffff40" domain={[-100, 100]} />
              <Tooltip 
                contentStyle={{ 
                  background: '#1a0a3e', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="sentiment" 
                stroke="#f5a623" 
                strokeWidth={2}
                fill="url(#sentimentGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-white/40">
            No heatmap data available for this performance
          </div>
        )}

        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-white/60">Loved (positive sentiment)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-white/60">Boring (negative sentiment)</span>
          </div>
        </div>
      </Card>

      {/* AI Insights */}
      <Card className="bg-white/5 border-white/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-400" />
          <h3 className="text-white font-semibold text-lg">AI Recommendations</h3>
        </div>

        {insights.length > 0 ? (
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <Card key={i} className={`p-4 ${
                insight.type === 'warning' 
                  ? 'bg-red-500/10 border-red-500/30' 
                  : 'bg-green-500/10 border-green-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  {insight.type === 'warning' ? (
                    <TrendingDown className="w-5 h-5 text-red-400 mt-0.5" />
                  ) : (
                    <TrendingUp className="w-5 h-5 text-green-400 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className={`font-semibold mb-1 ${
                      insight.type === 'warning' ? 'text-red-300' : 'text-green-300'
                    }`}>
                      {insight.message}
                    </div>
                    <div className="text-white/70 text-sm mb-2">
                      {insight.suggestion}
                    </div>
                    <Button size="sm" variant="outline" className="border-white/20 text-white">
                      {insight.action}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-white/40">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No insights available yet. Perform live to generate data.</p>
          </div>
        )}
      </Card>
    </div>
  );
}