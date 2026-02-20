import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { TrendingUp, Star, Zap, Target, Award, BarChart3, Palette, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnhancedPerformanceAnalytics from './EnhancedPerformanceAnalytics';
import MusicPlatformConnections from '../integrations/MusicPlatformConnections';

export default function PerformanceAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['performance-analytics'],
    queryFn: async () => {
      const { data } = await base44.functions.invoke('performance-analytics', {});
      return data.analytics;
    },
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-500/20 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-400 animate-pulse" />
          <h2 className="text-white/90 text-lg font-medium">Loading Analytics...</h2>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const emotionalArcs = Object.entries(analytics.emotionalArcStats || {});
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white/5 border border-white/10 mb-6">
          <TabsTrigger value="overview" className="text-white/60 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="engagement" className="text-white/60 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Viewer Engagement
          </TabsTrigger>
          <TabsTrigger value="connections" className="text-white/60 data-[state=active]:text-white">
            <Zap className="w-4 h-4 mr-2" />
            Platform Connections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
      <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-500/20 p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h2 className="text-white/90 text-lg font-medium">Performance Analytics</h2>
          <Badge variant="outline" className="ml-auto text-purple-400 border-purple-400/30">
            {analytics.totalDataPoints} data points
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-[#f5a623]/10 to-[#e91e8c]/10 border-[#f5a623]/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/60 flex items-center gap-2">
                <Star className="w-4 h-4 text-[#f5a623]" />
                Avg Art Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {analytics.avgArtRating.toFixed(1)}/5
              </div>
              <div className="text-xs text-white/40 mt-1">
                {analytics.totalGenerations} generations
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-400/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/60 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-400" />
                Top Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white capitalize">
                {analytics.topStyles[0]?.style || 'N/A'}
              </div>
              <div className="text-xs text-white/40 mt-1">
                {analytics.topStyles[0]?.acceptanceRate.toFixed(0)}% acceptance
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/60 flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-400" />
                Best Phase
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white capitalize">
                {emotionalArcs.length > 0 
                  ? emotionalArcs.sort((a, b) => b[1].avgEffectiveness - a[1].avgEffectiveness)[0][0]
                  : 'N/A'}
              </div>
              <div className="text-xs text-white/40 mt-1">
                Most effective
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-400/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/60 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                Learning Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {analytics.totalDataPoints > 0 ? 'Active' : 'New'}
              </div>
              <div className="text-xs text-white/40 mt-1">
                AI improving
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Styles */}
        <div className="mb-6">
          <h3 className="text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#f5a623]" />
            Top-Performing Visual Styles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analytics.topStyles.slice(0, 6).map((style, idx) => (
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
                  <Badge className="bg-[#f5a623]/20 text-[#f5a623] text-xs">
                    Score: {style.avgScore.toFixed(1)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span>Used {style.usageCount}x</span>
                  <span>•</span>
                  <span>{style.acceptanceRate.toFixed(0)}% accepted</span>
                </div>
                <div className="mt-2 h-1 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#f5a623] to-[#e91e8c]"
                    initial={{ width: 0 }}
                    animate={{ width: `${style.acceptanceRate}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.05 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Emotional Arc Performance */}
        <div className="mb-6">
          <h3 className="text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Emotional Arc Effectiveness
          </h3>
          <div className="space-y-2">
            {emotionalArcs.map(([arc, stats]) => (
              <div key={arc} className="bg-black/20 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/90 text-sm capitalize">{arc}</span>
                  <span className="text-white/60 text-xs">
                    {stats.avgEffectiveness.toFixed(1)}/10 avg
                  </span>
                </div>
                <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.avgEffectiveness * 10}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="text-xs text-white/40 mt-1">
                  {stats.count} uses
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Average Parameters */}
        <div>
          <h3 className="text-white/80 text-sm font-medium mb-3">Your Signature Settings</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-3 border border-blue-400/20">
              <div className="text-white/60 text-xs mb-2">Preferred Effects</div>
              <div className="space-y-1 text-xs">
                {Object.entries(analytics.avgParameters.effects).map(([effect, value]) => (
                  <div key={effect} className="flex justify-between">
                    <span className="text-white/80 capitalize">{effect}:</span>
                    <span className="text-blue-400">{Math.round(value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-3 border border-purple-400/20">
              <div className="text-white/60 text-xs mb-2">Preferred Colors</div>
              <div className="space-y-1 text-xs">
                {Object.entries(analytics.avgParameters.color).map(([param, value]) => (
                  <div key={param} className="flex justify-between">
                    <span className="text-white/80 capitalize">{param}:</span>
                    <span className="text-purple-400">{Math.round(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Rated Art */}
      {analytics.topRatedArt.length > 0 && (
        <div className="bg-gradient-to-br from-[#f5a623]/10 to-[#e91e8c]/10 rounded-xl border border-[#f5a623]/20 p-6">
          <h3 className="text-white/90 text-lg font-medium mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-[#f5a623]" />
            Your Best Generated Visuals
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {analytics.topRatedArt.map((art, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="relative group"
              >
                <div className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40">
                  <img
                    src={art.imageUrl}
                    alt={art.prompt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <div className="text-[10px] text-white/80 line-clamp-2 mb-1">
                        {art.prompt}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-[#f5a623] fill-[#f5a623]" />
                        <span className="text-xs text-[#f5a623]">{art.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Badge className="absolute top-2 right-2 bg-[#e91e8c]/90 text-white text-[9px]">
                  {art.style}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}
        </TabsContent>

        <TabsContent value="engagement" className="mt-0">
          <EnhancedPerformanceAnalytics />
        </TabsContent>

        <TabsContent value="connections" className="mt-0">
          <MusicPlatformConnections />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}