import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Eye,
  Clock,
  MousePointerClick,
  Users,
  Video,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      return await base44.functions.invoke('get-creator-analytics', {
        time_range: timeRange
      });
    },
    enabled: !!user
  });

  const stats = analytics?.data?.stats || {
    totalViews: 0,
    watchTime: 0,
    avgRetention: 0,
    ctr: 0,
    socialEngagement: 0,
    thumbnailTests: 0
  };

  const videoPerformance = analytics?.data?.videoPerformance || [];
  const socialCopyPerformance = analytics?.data?.socialCopyPerformance || [];
  const thumbnailABTests = analytics?.data?.thumbnailABTests || [];
  const recommendations = analytics?.data?.recommendations || [];

  const COLORS = ['#f5a623', '#e91e8c', '#9b51e0', '#3498db', '#2ecc71', '#e74c3c'];

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Creator Analytics</h1>
            <p className="text-white/60">Data-driven insights for content optimization</p>
          </div>
          <div className="flex gap-2">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className={timeRange === range ? 'bg-[#f5a623]' : 'border-white/10 text-white'}
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-400/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Total Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">
                {(stats.totalViews || 0).toLocaleString()}
              </div>
              {/* Growth metrics removed - need historical comparison data */}
              <div className="text-white/60 text-xs mt-1">
                Current period
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-400/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Watch Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">
                {Math.floor((stats.watchTime || 0) / 60)}h
              </div>
              <div className="text-white/60 text-xs mt-1">
                Current period
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-400/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Avg Retention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">
                {((stats.avgRetention || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-white/60 text-xs mt-1">
                Current period
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border-yellow-400/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                <MousePointerClick className="w-4 h-4" />
                Click-Through Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">
                {((stats.ctr || 0) * 100).toFixed(2)}%
              </div>
              <div className="text-white/60 text-xs mt-1">
                Current period
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="videos" className="space-y-6">
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="videos">Video Performance</TabsTrigger>
            <TabsTrigger value="social">Social Copy</TabsTrigger>
            <TabsTrigger value="thumbnails">Thumbnail A/B Tests</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  Video Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={videoPerformance}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f5a623" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f5a623" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="date" stroke="#ffffff60" />
                    <YAxis stroke="#ffffff60" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a0a3e', border: '1px solid rgba(255,255,255,0.1)' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="views" stroke="#f5a623" fillOpacity={1} fill="url(#colorViews)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Top Performing Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {videoPerformance.slice(0, 5).map((video, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div className="flex-1">
                          <div className="text-white text-sm font-semibold mb-1">
                            {video.title || `Video ${i + 1}`}
                          </div>
                          <div className="text-white/60 text-xs">
                            {video.views?.toLocaleString() || 0} views · {video.retention ? (video.retention * 100).toFixed(0) : 0}% retention
                          </div>
                        </div>
                        <Badge className="bg-green-500/20 text-green-300">
                          {video.ctr ? (video.ctr * 100).toFixed(1) : 0}% CTR
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Retention by Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={videoPerformance.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                      <XAxis dataKey="duration" stroke="#ffffff60" />
                      <YAxis stroke="#ffffff60" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a0a3e', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <Bar dataKey="retention" fill="#9b51e0" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Social Media Copy Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {socialCopyPerformance.map((copy, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <Badge className="mb-2">{copy.platform}</Badge>
                          <div className="text-white text-sm">{copy.text}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">{copy.clicks?.toLocaleString() || 0}</div>
                          <div className="text-white/60 text-xs">clicks</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-white text-lg font-semibold">
                            {copy.impressions?.toLocaleString() || 0}
                          </div>
                          <div className="text-white/60 text-xs">Impressions</div>
                        </div>
                        <div>
                          <div className="text-white text-lg font-semibold">
                            {copy.ctr ? (copy.ctr * 100).toFixed(1) : 0}%
                          </div>
                          <div className="text-white/60 text-xs">CTR</div>
                        </div>
                        <div>
                          <div className="text-white text-lg font-semibold">
                            {copy.engagement || 0}
                          </div>
                          <div className="text-white/60 text-xs">Engagement</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="thumbnails" className="space-y-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  A/B Test Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {thumbnailABTests.map((test, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-white font-semibold">{test.title}</h3>
                          <div className="text-white/60 text-sm">
                            Test Duration: {test.duration} days · {test.impressions?.toLocaleString()} total impressions
                          </div>
                        </div>
                        <Badge className={test.winner === 'A' ? 'bg-green-500' : 'bg-blue-500'}>
                          Winner: Variant {test.winner}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        {['A', 'B'].map((variant) => (
                          <div key={variant} className={`border rounded-lg p-3 ${
                            test.winner === variant ? 'border-green-500/50' : 'border-white/10'
                          }`}>
                            <div className="aspect-video bg-black rounded mb-2 overflow-hidden">
                              <img 
                                src={test[`thumbnail${variant}`]} 
                                alt={`Variant ${variant}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="text-white text-sm font-semibold mb-1">Variant {variant}</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <div className="text-white/60">CTR</div>
                                <div className="text-white font-semibold">
                                  {test[`ctr${variant}`] ? (test[`ctr${variant}`] * 100).toFixed(2) : 0}%
                                </div>
                              </div>
                              <div>
                                <div className="text-white/60">Clicks</div>
                                <div className="text-white font-semibold">
                                  {test[`clicks${variant}`]?.toLocaleString() || 0}
                                </div>
                              </div>
                            </div>
                            {test.winner === variant && (
                              <div className="mt-2 text-green-400 text-xs flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                +{((test[`ctr${variant}`] / test[`ctr${variant === 'A' ? 'B' : 'A'}`] - 1) * 100).toFixed(1)}% vs other
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-400/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI-Powered Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>AI is analyzing your content...</p>
                      <p className="text-sm mt-1">Check back soon for personalized insights</p>
                    </div>
                  ) : (
                    recommendations.map((rec, i) => (
                      <div key={i} className="bg-black/20 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold mb-1">{rec.title}</h4>
                            <p className="text-white/70 text-sm mb-2">{rec.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge className="bg-purple-500/20 text-purple-300">
                                {rec.impact}
                              </Badge>
                              <span className="text-white/60 text-xs">
                                Est. {rec.estimatedImpact}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Best Upload Times</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4 text-white/60 text-sm">
                    Requires analytics tracking integration
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Content Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4 text-white/60 text-sm">
                    AI will generate suggestions based on your content performance data
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}