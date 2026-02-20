import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Music, Youtube, Facebook, CheckCircle, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const platforms = [
  {
    id: 'spotify',
    name: 'Spotify',
    description: 'Connect your Spotify account',
    icon: Music,
    color: 'from-green-500 to-green-600',
    available: true
  },
  {
    id: 'youtube_music',
    name: 'YouTube Music',
    description: 'Sync your YouTube Music library',
    icon: Youtube,
    color: 'from-red-500 to-red-600',
    available: true
  },
  {
    id: 'bandlab',
    name: 'BandLab',
    description: 'Import tracks from BandLab',
    icon: Music,
    color: 'from-purple-500 to-purple-600',
    available: true
  },
  {
    id: 'music_maker_jam',
    name: 'Music Maker Jam',
    description: 'Connect Loudly/Music Maker Jam',
    icon: Music,
    color: 'from-orange-500 to-orange-600',
    available: true
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Share performances on Facebook',
    icon: Facebook,
    color: 'from-blue-500 to-blue-600',
    available: true
  }
];

export default function MusicPlatformConnections() {
  const [connecting, setConnecting] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: connectedAccounts = [] } = useQuery({
    queryKey: ['connected-accounts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.ConnectedAccount.filter({ user_id: user.id });
    },
    enabled: !!user
  });

  const disconnectMutation = useMutation({
    mutationFn: (accountId) => base44.entities.ConnectedAccount.delete(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
      toast.success('Account disconnected');
    }
  });

  const handleConnect = async (platformId) => {
    setConnecting(platformId);
    
    try {
      // For now, create a placeholder connection
      // In production, this would initiate OAuth flow
      toast.info(`${platformId} integration coming soon! OAuth flow will be implemented.`);
      
      // Placeholder for OAuth flow
      // const authUrl = await initiateOAuth(platformId);
      // window.open(authUrl, '_blank');
      
    } catch (error) {
      toast.error('Connection failed');
    } finally {
      setConnecting(null);
    }
  };

  const isConnected = (platformId) => {
    return connectedAccounts.some(acc => acc.service === platformId);
  };

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/20 p-6">
      <div className="mb-6">
        <h2 className="text-white text-xl font-medium mb-2">Music Platform Connections</h2>
        <p className="text-white/60 text-sm">
          Connect your music accounts to enhance AI analytics and sync your content
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const connected = isConnected(platform.id);
          const account = connectedAccounts.find(acc => acc.service === platform.id);

          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <Card className={`bg-gradient-to-br ${platform.color} bg-opacity-10 border-white/10 hover:border-white/20 transition-all`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${platform.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">{platform.name}</CardTitle>
                        <p className="text-white/40 text-xs mt-0.5">{platform.description}</p>
                      </div>
                    </div>
                    {connected && (
                      <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {connected ? (
                    <div className="space-y-2">
                      {account?.service_email && (
                        <div className="text-white/60 text-xs">
                          {account.service_email}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-white/20 text-white/80 hover:bg-white/10"
                          disabled
                        >
                          <ExternalLink className="w-3 h-3 mr-2" />
                          Sync Now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => disconnectMutation.mutate(account.id)}
                          className="border-red-400/30 text-red-400 hover:bg-red-500/10"
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleConnect(platform.id)}
                      disabled={connecting === platform.id || !platform.available}
                      className={`w-full bg-gradient-to-r ${platform.color} hover:opacity-90`}
                    >
                      {connecting === platform.id ? (
                        'Connecting...'
                      ) : (
                        <>
                          <LinkIcon className="w-3 h-3 mr-2" />
                          Connect {platform.name}
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-400/20">
        <div className="flex items-start gap-3">
          <Music className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <div className="text-white/90 text-sm font-medium mb-1">
              Why connect your accounts?
            </div>
            <ul className="text-white/60 text-xs space-y-1">
              <li>• AI analyzes your full music catalog for better suggestions</li>
              <li>• Sync tracks automatically from connected platforms</li>
              <li>• Get comprehensive performance analytics across all your music</li>
              <li>• Share performances directly to social platforms</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}