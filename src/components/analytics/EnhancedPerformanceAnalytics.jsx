import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { TrendingUp, Flame, Zap, Heart, Brain, Users, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function EnhancedPerformanceAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['enhanced-analytics'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('enhanced-analytics', {});
      return data.analytics;
    },
    refetchInterval: 30000,
  });

  const reactionIcons = {
    fire: { icon: Flame, color: 'text-orange-500' },
    energy: { icon: Zap, color: 'text-yellow-400' },
    love: { icon: Heart, color: 'text-pink-500' },
    mind_blown: { icon: Brain, color: 'text-purple-500' },
    chill: { icon: Clock, color: 'text-blue-400' }
  };

  if (isLoading) {
    return (
      <div className="text-white/40 text-center py-8">Loading engagement analytics...</div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-400/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/60 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Total Performances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics.totalPerformances}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-400/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/60 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              Total Reactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics.totalReactions}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-400/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/60 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Avg Reactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics.avgReactionsPerPerformance.toFixed(1)}
            </div>
            <div className="text-xs text-white/40 mt-1">per performance</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/60 flex items-center gap-2">
              <Target className="w-4 h-4 text-green-400" />
              Top Style
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-white capitalize">
              {analytics.topEngagingStyles[0]?.style || 'N/A'}
            </div>
            <div className="text-xs text-white/40 mt-1">
              {analytics.topEngagingStyles[0]?.avgScore.toFixed(1)} engagement
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reactions by Song Section */}
      <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white/90 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Viewer Reactions by Song Section
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(analytics.reactionsBySongSection).map(([section, reactions]) => {
              const total = Object.values(reactions).reduce((a, b) => a + b, 0);
              return (
                <div key={section} className="bg-black/20 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/90 capitalize font-medium">{section}</span>
                    <Badge className="bg-purple-500/20 text-purple-300">
                      {total} reactions
                    </Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(reactions).map(([type, count]) => {
                      const config = reactionIcons[type];
                      if (!config) return null;
                      const Icon = config.icon;
                      return (
                        <div key={type} className="flex items-center gap-1 bg-black/30 rounded px-2 py-1">
                          <Icon className={`w-3 h-3 ${config.color}`} />
                          <span className="text-white/60 text-xs">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Engaging Styles */}
      <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/20">
        <CardHeader>
          <CardTitle className="text-white/90 flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            Most Engaging Visual Styles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {analytics.topEngagingStyles.map((style, idx) => (
              <motion.div
                key={style.style}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-black/20 rounded-lg p-3 border border-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/90 text-sm capitalize font-medium">
                    {style.style}
                  </span>
                  <Badge className="bg-indigo-500/20 text-indigo-300 text-xs">
                    {style.avgScore.toFixed(1)}
                  </Badge>
                </div>
                <div className="text-xs text-white/40">{style.uses} uses</div>
                <div className="mt-2 h-1 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(style.avgScore / 10) * 100}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Director Impact Analysis */}
      <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-white/90 flex items-center gap-2">
            <Brain className="w-5 h-5 text-green-400" />
            AI Director Impact Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(analytics.directorImpactAnalysis).map(([type, data]) => (
              <div key={type} className="bg-black/20 rounded-lg p-3 border border-white/10">
                <div className="text-white/90 text-sm capitalize mb-2">
                  {type.replace(/_/g, ' ')}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-green-400">
                    {data.impact_score.toFixed(0)}%
                  </span>
                  <span className="text-xs text-white/40">impact</span>
                </div>
                <div className="text-xs text-white/40 mt-1">
                  {data.suggested} suggested, {data.positive_reactions} positive
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Reaction Moments */}
      {analytics.topReactionMoments.length > 0 && (
        <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-white/90 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              Peak Engagement Moments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topReactionMoments.slice(0, 5).map((moment, idx) => {
                const config = reactionIcons[moment.type];
                const Icon = config?.icon || Flame;
                return (
                  <div key={idx} className="flex items-center justify-between bg-black/20 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${config?.color || 'text-white/60'}`} />
                      <div>
                        <div className="text-white/90 text-sm capitalize">{moment.section} section</div>
                        <div className="text-white/40 text-xs">
                          {moment.type.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-orange-500/20 text-orange-300">
                      {moment.intensity}/10
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}