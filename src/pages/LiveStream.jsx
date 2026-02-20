import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Users, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import PerformanceHeatmapViewer from '@/components/features/PerformanceHeatmapViewer';
import PromoVideoGenerator from '@/components/features/PromoVideoGenerator';

export default function LiveStream() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [streamTitle, setStreamTitle] = useState('');
  const [currentStream, setCurrentStream] = useState(null);
  const [selectedStream, setSelectedStream] = useState(null);
  const [tipAmount, setTipAmount] = useState('5');
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchData = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      const subs = await base44.entities.Subscription.filter({ user_id: userData.id });
      setSubscription(subs[0] || { tier: 'free' });
    };
    fetchData();
  }, []);

  const { data: activeStreams = [] } = useQuery({
    queryKey: ['active-streams'],
    queryFn: () => base44.entities.LiveStreamSession.filter({ is_live: true }, '-viewer_count')
  });

  const getViewerLimit = (tier) => {
    const limits = { free: 100, weekly: 500, monthly: 500, annual: 99999, creator_pro: 99999 };
    return limits[tier] || 100;
  };

  const startStreamMutation = useMutation({
    mutationFn: async (title) => {
      const maxViewers = getViewerLimit(subscription.tier);
      return await base44.entities.LiveStreamSession.create({
        host_user_id: user.id,
        title,
        stream_key: `stream_${Date.now()}`,
        is_live: true,
        max_viewers: maxViewers,
        super_chat_enabled: subscription.tier !== 'free'
      });
    },
    onSuccess: (stream) => {
      setCurrentStream(stream);
      toast.success('Stream started!');
      queryClient.invalidateQueries({ queryKey: ['active-streams'] });
    }
  });

  const endStreamMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.LiveStreamSession.update(currentStream.id, {
        is_live: false
      });
    },
    onSuccess: () => {
      setCurrentStream(null);
      toast.success('Stream ended');
      queryClient.invalidateQueries({ queryKey: ['active-streams'] });
    }
  });

  const sendReaction = async (streamId, reactionType) => {
    await base44.entities.AudienceSentiment.create({
      live_stream_session_id: streamId,
      timestamp_seconds: 0,
      reaction_type: reactionType,
      viewer_user_id: user?.id,
      intensity: 8,
      aggregated_sentiment: 'positive'
    });
    toast.success('Reaction sent! 🎉');
  };

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Live Streams</h1>
          <p className="text-white/60">Broadcast your performances to the world</p>
        </div>

        {/* Stream Controls */}
        {user && (
          <Card className="bg-white/5 border-white/10 p-6 mb-8">
            <h2 className="text-white font-semibold text-lg mb-4">Your Stream</h2>
            {!currentStream ? (
              <div className="flex gap-3">
                <Input
                  placeholder="Stream title..."
                  value={streamTitle}
                  onChange={(e) => setStreamTitle(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
                <Button
                  onClick={() => startStreamMutation.mutate(streamTitle)}
                  disabled={!streamTitle || startStreamMutation.isPending}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Go Live
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className="bg-red-500 mb-2">🔴 LIVE</Badge>
                    <h3 className="text-white font-semibold">{currentStream.title}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{currentStream.viewer_count || 0}</div>
                    <div className="text-white/60 text-sm">viewers</div>
                  </div>
                </div>
                <Button
                  onClick={() => endStreamMutation.mutate()}
                  variant="outline"
                  className="border-white/20 text-white"
                >
                  End Stream
                </Button>
              </div>
            )}
            <div className="mt-4 text-white/60 text-sm">
              Viewer Limit: {getViewerLimit(subscription?.tier)} • Super Chat: {subscription?.tier !== 'free' ? 'Enabled' : 'Premium Only'}
            </div>
          </Card>
        )}

        {/* Active Streams */}
        <Tabs defaultValue="streams">
          <TabsList className="bg-white/5 mb-6">
            <TabsTrigger value="streams">Active Streams</TabsTrigger>
            <TabsTrigger value="heatmap">Performance Heatmap</TabsTrigger>
            <TabsTrigger value="promo">Promo Videos</TabsTrigger>
          </TabsList>

          <TabsContent value="streams">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeStreams.map(stream => (
            <Card key={stream.id} className="bg-white/5 border-white/10 overflow-hidden" onClick={() => setSelectedStream(stream)}>
              <div className="aspect-video bg-gradient-to-br from-red-900/40 to-pink-900/40 relative">
                <Badge className="absolute top-2 left-2 bg-red-500">🔴 LIVE</Badge>
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-white text-sm flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {stream.viewer_count || 0}
                </div>
              </div>
              
              <div className="p-5">
                <h3 className="text-white font-semibold mb-3">{stream.title}</h3>
                
                {/* Reaction Buttons */}
                <div className="flex gap-2 mb-3">
                  <button 
                    onClick={() => sendReaction(stream.id, 'fire')}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    🔥
                  </button>
                  <button 
                    onClick={() => sendReaction(stream.id, 'heart')}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    ❤️
                  </button>
                  <button 
                    onClick={() => sendReaction(stream.id, 'laugh')}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    😂
                  </button>
                </div>

                {stream.super_chat_enabled && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="$5"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      className="bg-white/5 border-white/10 text-white w-20"
                    />
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Super Chat
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
          </TabsContent>

          <TabsContent value="heatmap">
            {selectedStream ? (
              <PerformanceHeatmapViewer performanceId={selectedStream.id} />
            ) : (
              <Card className="bg-white/5 border-white/10 p-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-white/40" />
                <p className="text-white/60">Select a stream above to view its heatmap</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="promo">
            {selectedStream ? (
              <PromoVideoGenerator performanceId={selectedStream.id} />
            ) : (
              <Card className="bg-white/5 border-white/10 p-12 text-center">
                <Video className="w-12 h-12 mx-auto mb-4 text-white/40" />
                <p className="text-white/60">Select a stream above to generate promo video</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}