import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Plus, Upload, Wand2, Music, Loader2, Edit, Eye, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import PerformanceAnalytics from '@/components/analytics/PerformanceAnalytics';
import EnhancedVisualGenerator from '@/components/visual/EnhancedVisualGenerator';
import VJSoftwareSDK from '@/components/integration/VJSoftwareSDK';
import RealtimePluginSDK from '@/components/integration/RealtimePluginSDK';
import CreatorOnboarding from '@/components/onboarding/CreatorOnboarding';
import MonetizationPromoAd from '@/components/ads/MonetizationPromoAd';
import StreakRewardBanner from '@/components/features/StreakRewardBanner';
import VoiceControl from '@/components/features/VoiceControl';
import HardwareIntegration from '@/components/features/HardwareIntegration';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newSetlistDialogOpen, setNewSetlistDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [textToImagePrompt, setTextToImagePrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [showCreatorOnboarding, setShowCreatorOnboarding] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const fetchUserAndSubscription = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        
        // Fetch subscription data
        const subscriptions = await base44.entities.Subscription.filter({ user_id: userData.id });
        setSubscription(subscriptions[0] || { tier: 'free', status: 'active' });

        // Check for creator onboarding
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('onboard') === 'creator') {
          const progress = await base44.entities.OnboardingProgress.filter({ user_id: userData.id });
          if (!progress[0]?.creator_onboarding_completed) {
            setShowCreatorOnboarding(true);
          }
        }
      } catch (error) {
        window.location.href = createPageUrl('Auth');
      }
    };
    fetchUserAndSubscription();
  }, []);

  const { data: artist } = useQuery({
    queryKey: ['artist', user?.id],
    queryFn: async () => {
      const artists = await base44.entities.Artist.filter({ user_id: user.id });
      return artists[0];
    },
    enabled: !!user,
  });

  const { data: setlists = [] } = useQuery({
    queryKey: ['setlists', user?.id],
    queryFn: () => base44.entities.Setlist.filter({ user_id: user.id }, '-created_date'),
    enabled: !!user,
  });

  const { data: songs = [] } = useQuery({
    queryKey: ['user-songs', user?.id],
    queryFn: () => base44.entities.UserSong.filter({ user_id: user.id }, '-created_date'),
    enabled: !!user,
  });

  const createSetlistMutation = useMutation({
    mutationFn: (data) => base44.entities.Setlist.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setlists'] });
      toast.success('Setlist created');
      setNewSetlistDialogOpen(false);
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // AI analysis
      setAnalyzingAI(true);
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this song file and extract:
- BPM (beats per minute)
- Energy level (1-10 scale)
- Suggested set section (opener/build/peak/cooldown/closer/encore)
- Mood/vibe description
- Genre

File: ${file.name}

Return valid JSON with: bpm, energy, section, mood, genre`,
        response_json_schema: {
          type: "object",
          properties: {
            bpm: { type: "number" },
            energy: { type: "number" },
            section: { type: "string" },
            mood: { type: "string" },
            genre: { type: "string" }
          }
        }
      });

      // Get duration from file
      const audio = new Audio(URL.createObjectURL(file));
      await new Promise(resolve => { audio.onloadedmetadata = resolve; });
      const duration = Math.floor(audio.duration);
      const durationStr = `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`;

      await base44.entities.UserSong.create({
        user_id: user.id,
        title: file.name.replace(/\.(mp3|wav)$/i, ''),
        duration: durationStr,
        duration_seconds: duration,
        audio_file_url: file_url,
        ai_bpm: analysis.bpm,
        ai_energy_level: analysis.energy,
        ai_suggested_section: analysis.section,
        ai_mood: analysis.mood,
        genre: analysis.genre
      });

      queryClient.invalidateQueries({ queryKey: ['user-songs'] });
      toast.success('Song uploaded and analyzed!');
      setUploadDialogOpen(false);
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploadingFile(false);
      setAnalyzingAI(false);
    }
  };

  const handleTextToImage = async () => {
    if (!textToImagePrompt.trim()) {
      toast.error('Enter a description');
      return;
    }

    setGeneratingImage(true);
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: `VJ visual effect: ${textToImagePrompt}. Abstract, colorful, dynamic, suitable for live performance projection.`,
      });

      setGeneratedImage(result.url);
      toast.success('Image generated!');
    } catch (error) {
      toast.error('Image generation failed');
    } finally {
      setGeneratingImage(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#f5a623] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510] p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none animate-pan-bg opacity-30" style={{ backgroundImage: 'linear-gradient(135deg, rgba(0,234,255,0.12) 0%, rgba(255,47,178,0.12) 50%, rgba(255,196,0,0.12) 100%)' }} />
      <div className="absolute inset-0 pointer-events-none animate-scanline bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:100%_8px]" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between animate-pulse-glow">
            <div>
              <h1 className="text-3xl font-semibold text-white mb-1">
                Welcome, {artist?.artist_name || user.full_name}
              </h1>
              <p className="text-white/50">Your live deck is armed with AI visuals & VJ controls.</p>
            </div>
            <div className="flex gap-3">
              <Button className="bg-gradient-to-r from-[#00eaff] to-[#ff2fb2] text-white">
                Start Live Show
              </Button>
              <Button variant="outline" className="border-white/30 text-white">
                Build Visual Pack
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="overview" className="text-white/60 data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white/60 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Performance Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="mt-6">
            <PerformanceAnalytics />
          </TabsContent>

          <TabsContent value="overview" className="mt-6">

        {/* Streak Reward Banner */}
        <StreakRewardBanner />

        {/* Voice Control */}
        <div className="mb-6">
          <VoiceControl onCommand={(action, params) => {
            console.log('Voice command:', action, params);
            toast.success(`Voice: ${action}`);
          }} />
        </div>

        {/* Hardware Integration */}
        <div className="mb-6">
          <HardwareIntegration />
        </div>

        {/* Enhanced AI Visual Generator */}
        <div className="mb-8 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-500/20 p-6">
          <EnhancedVisualGenerator
            onAssetCreated={(asset) => {
              queryClient.invalidateQueries({ queryKey: ['visual-assets'] });
            }}
          />
        </div>

        {/* VJ Software Integration SDK */}
        {setlists && setlists[0] && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
            <VJSoftwareSDK 
              projectId={setlists[0].id} 
              projectData={setlists[0]} 
            />
            <RealtimePluginSDK sessionId={setlists[0].id} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Setlists */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl text-white/80 font-light">Your Setlists</h2>
              <Dialog open={newSetlistDialogOpen} onOpenChange={setNewSetlistDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#f5a623] hover:bg-[#e91e8c]">
                    <Plus className="w-4 h-4 mr-2" />
                    New Setlist
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a0a3e] border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Setlist</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      createSetlistMutation.mutate({
                        user_id: user.id,
                        artist_id: artist?.id,
                        name: formData.get('name'),
                        description: formData.get('description'),
                        festival_name: formData.get('festival')
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label className="text-white/70">Setlist Name</Label>
                      <Input name="name" className="mt-2 bg-white/5 border-white/10 text-white" required />
                    </div>
                    <div>
                      <Label className="text-white/70">Festival/Venue</Label>
                      <Input name="festival" className="mt-2 bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                      <Label className="text-white/70">Description</Label>
                      <Input name="description" className="mt-2 bg-white/5 border-white/10 text-white" />
                    </div>
                    <Button type="submit" className="w-full bg-[#f5a623]">Create</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {setlists.map(setlist => (
                <motion.div
                  key={setlist.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-xl border border-white/10 p-6 hover:border-[#f5a623]/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium text-lg">{setlist.name}</h3>
                      {setlist.festival_name && (
                        <p className="text-[#f5a623] text-sm mt-1">{setlist.festival_name}</p>
                      )}
                      {setlist.description && (
                        <p className="text-white/40 text-sm mt-2">{setlist.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link to={createPageUrl('SetlistEditor') + `?id=${setlist.id}`}>
                        <Button size="sm" variant="ghost" className="text-white/60">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link to={createPageUrl('Storyboard') + `?setlist=${setlist.id}`}>
                        <Button size="sm" className="bg-[#f5a623]/20 text-[#f5a623]">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
              {setlists.length === 0 && (
                <div className="text-center py-12 text-white/30">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No setlists yet. Create your first one!</p>
                </div>
              )}
            </div>
          </div>

          {/* Song Library */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-white/80 font-light">Song Library</h2>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-[#e91e8c]">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a0a3e] border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-white">Upload Song</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center">
                      <Upload className="w-12 h-12 mx-auto mb-4 text-[#f5a623]" />
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-white/70">Click to upload MP3 or WAV</span>
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".mp3,.wav"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </Label>
                    </div>
                    {(uploadingFile || analyzingAI) && (
                      <div className="text-center">
                        <Loader2 className="w-6 h-6 mx-auto mb-2 text-[#f5a623] animate-spin" />
                        <p className="text-white/60 text-sm">
                          {analyzingAI ? 'AI analyzing song...' : 'Uploading...'}
                        </p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {songs.map(song => (
                <div
                  key={song.id}
                  className="bg-white/5 rounded-lg p-3 border border-white/10"
                >
                  <h4 className="text-white text-sm font-medium truncate">{song.title}</h4>
                  <div className="flex items-center gap-2 mt-2 text-[10px]">
                    {song.ai_suggested_section && (
                      <span className="px-2 py-1 rounded bg-[#f5a623]/20 text-[#f5a623]">
                        {song.ai_suggested_section}
                      </span>
                    )}
                    {song.ai_bpm && (
                      <span className="text-white/40">{song.ai_bpm} BPM</span>
                    )}
                    {song.ai_energy_level && (
                      <span className="text-white/40">Energy: {song.ai_energy_level}/10</span>
                    )}
                  </div>
                </div>
              ))}
              {songs.length === 0 && (
                <div className="text-center py-8 text-white/30 text-sm">
                  <Wand2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Upload songs for AI analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monetization Ad for Free Users */}
        {subscription?.tier === 'free' && (
          <div className="mt-8">
            <MonetizationPromoAd placement="banner" />
          </div>
        )}
          </TabsContent>
        </Tabs>

        {/* Creator Onboarding Dialog */}
        <CreatorOnboarding
          open={showCreatorOnboarding}
          onClose={() => setShowCreatorOnboarding(false)}
          onComplete={() => setShowCreatorOnboarding(false)}
        />
      </div>
    </div>
  );
}
