import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Layers, Palette, Camera, Sparkles, Play, Star, StarOff, Search, Copy, Trash2, Download, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import TimelineEditor from './TimelineEditor';
import AIAssistant from './AIAssistant';
import MusicPlayer from './MusicPlayer';
import CollaborationPanel from './CollaborationPanel';
import AssetLibrary from './AssetLibrary';
import LiveBroadcast from '../performance/LiveBroadcast';
import PerformanceDirector from '../performance/PerformanceDirector';

const defaultState = {
  layers: {
    background: { opacity: 100, blend: 'normal' },
    midground: { opacity: 80, blend: 'screen' },
    foreground: { opacity: 90, blend: 'overlay' },
    overlay: { opacity: 70, blend: 'add' },
  },
  effects: {
    blur: 0,
    glow: 0,
    chromatic: 0,
    distortion: 0,
    pixelate: 0,
    vignette: 30,
    scanlines: 0,
    glitch: 0,
  },
  color_grading: {
    hue: 0,
    saturation: 100,
    brightness: 100,
    contrast: 100,
    temperature: 0,
    tint: 0,
    vibrance: 0,
  },
  camera: {
    active: false,
    filter: 'none',
    overlay: 50,
    kaleidoscope: 0,
    mirror: false,
    feedback: 0,
  },
  particles: {
    active: true,
    density: 50,
    speed: 50,
    size: 50,
    color: '#f5a623',
  },
};

const blendModes = ['normal', 'multiply', 'screen', 'overlay', 'add', 'darken', 'lighten', 'difference'];
const cameraFilters = ['none', 'thermal', 'wireframe', 'silhouette', 'kaleidoscope', 'edge-detect', 'posterize'];

export default function VJControlPanel({ song, onClose, allSongs = [], sessionId = null }) {
  const [state, setState] = useState(defaultState);
  const [activeTab, setActiveTab] = useState('layers');
  const [presetName, setPresetName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [liveOverride, setLiveOverride] = useState(false);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const queryClient = useQueryClient();

  const currentSong = allSongs[currentSongIndex] || song;

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const subs = await base44.entities.Subscription.filter({ user_id: u.id });
      setSubscription(subs[0]);
    }).catch(() => {});
  }, []);

  const currentTier = subscription?.tier || 'free';
  const enableGenerativeArt = ['annual'].includes(currentTier) || subscription?.status === 'trial';

  const { data: presets = [] } = useQuery({
    queryKey: ['vjpresets', currentSong?.id],
    queryFn: () => currentSong?.id 
      ? base44.entities.VJPreset.filter({ song_id: currentSong.id })
      : base44.entities.VJPreset.list('-created_date', 50),
    initialData: [],
  });

  const { data: timelineEvents = [] } = useQuery({
    queryKey: ['timeline-events', currentSong?.id],
    queryFn: () => currentSong?.id 
      ? base44.entities.TimelineEvent.filter({ song_id: currentSong.id }, 'timestamp_seconds')
      : [],
    enabled: !!currentSong?.id,
  });

  // Auto-trigger timeline events
  useEffect(() => {
    if (liveOverride) return;
    
    const activeEvents = timelineEvents.filter(e => e.is_active);
    const triggeredEvent = activeEvents.find(
      e => Math.abs(e.timestamp_seconds - currentTime) < 0.5
    );

    if (triggeredEvent) {
      if (triggeredEvent.event_type === 'preset_load' && triggeredEvent.preset_id) {
        const preset = presets.find(p => p.id === triggeredEvent.preset_id);
        if (preset) loadPreset(preset);
      }
    }
  }, [currentTime, timelineEvents, liveOverride]);

  const savePresetMutation = useMutation({
    mutationFn: (data) => base44.entities.VJPreset.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vjpresets'] });
      toast.success('Preset saved');
      setPresetName('');
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: (id) => base44.entities.VJPreset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vjpresets'] });
      toast.success('Preset deleted');
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, is_favorite }) => base44.entities.VJPreset.update(id, { is_favorite: !is_favorite }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vjpresets'] }),
  });

  const updateLayer = (layer, key, value) => {
    setState(prev => ({
      ...prev,
      layers: { ...prev.layers, [layer]: { ...prev.layers[layer], [key]: value } }
    }));
  };

  const updateEffect = (effect, value) => {
    setState(prev => ({ ...prev, effects: { ...prev.effects, [effect]: value } }));
  };

  const updateColorGrading = (param, value) => {
    setState(prev => ({ ...prev, color_grading: { ...prev.color_grading, [param]: value } }));
  };

  const updateCamera = (param, value) => {
    setState(prev => ({ ...prev, camera: { ...prev.camera, [param]: value } }));
  };

  const updateParticles = (param, value) => {
    setState(prev => ({ ...prev, particles: { ...prev.particles, [param]: value } }));
  };

  const loadPreset = (preset) => {
    setState({
      layers: preset.layers || defaultState.layers,
      effects: preset.effects || defaultState.effects,
      color_grading: preset.color_grading || defaultState.color_grading,
      camera: preset.camera || defaultState.camera,
      particles: preset.particles || defaultState.particles,
    });
    toast.success(`Loaded: ${preset.name}`);
  };

  const savePreset = () => {
    if (!presetName.trim()) {
      toast.error('Enter a preset name');
      return;
    }
    savePresetMutation.mutate({
      name: presetName,
      song_id: currentSong?.id || null,
      ...state,
      tags: [currentSong?.set_section, ...(currentSong?.visual_mood ? [currentSong.visual_mood] : [])].filter(Boolean),
    });
  };

  const handleNextSong = () => {
    if (currentSongIndex < allSongs.length - 1) {
      setCurrentSongIndex(currentSongIndex + 1);
      setCurrentTime(0);
    }
  };

  const handlePrevSong = () => {
    if (currentSongIndex > 0) {
      setCurrentSongIndex(currentSongIndex - 1);
      setCurrentTime(0);
    }
  };

  const handleSeek = (time) => {
    setCurrentTime(time);
  };

  const getEmotionalArc = (currentTime, duration) => {
    if (!duration) return 'intro';
    const progress = currentTime / duration;
    if (progress < 0.15) return 'intro';
    if (progress < 0.4) return 'building';
    if (progress < 0.7) return 'peak';
    if (progress < 0.9) return 'breakdown';
    return 'outro';
  };

  const exportState = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vj-preset-${presetName || 'untitled'}.json`;
    a.click();
    toast.success('Preset exported');
  };

  const filteredPresets = presets.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.tags?.some(t => t?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 overflow-y-auto"
    >
      <div className="min-h-screen p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-light text-white">VJ Control Panel</h1>
                <Button
                  size="sm"
                  variant={liveOverride ? 'default' : 'outline'}
                  onClick={() => setLiveOverride(!liveOverride)}
                  className={liveOverride ? 'bg-red-500 hover:bg-red-600' : 'border-white/20 text-white/60'}
                >
                  {liveOverride ? 'LIVE OVERRIDE' : 'Auto Mode'}
                </Button>
              </div>
              {currentSong && (
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-[#f5a623]" />
                  <p className="text-sm text-white/60">{currentSong.title}</p>
                  <span className="text-xs text-white/30">• {currentSong.set_section}</span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls */}
            <div className="lg:col-span-2 space-y-6">
              {/* Music Player */}
              <MusicPlayer
                song={currentSong}
                onTimeUpdate={setCurrentTime}
                onNext={handleNextSong}
                onPrev={handlePrevSong}
              />

              {/* Timeline Editor */}
              <TimelineEditor
                song={currentSong}
                currentTime={currentTime}
                onSeek={handleSeek}
                presets={presets}
              />

              {/* AI Assistant */}
              <AIAssistant
                song={currentSong}
                currentEnergy={currentSong?.energy_level || 5}
                onApplyPreset={loadPreset}
                onUpdateState={setState}
                enableGenerativeArt={enableGenerativeArt}
              />

              {/* Live Broadcast */}
              <LiveBroadcast
                currentState={state}
                songId={currentSong?.id}
                currentTime={currentTime}
                onReactionInfluence={(reaction) => {
                  // Influence AI based on viewer reactions
                  if (reaction.reaction_type === 'energy') {
                    setState(prev => ({
                      ...prev,
                      effects: { ...prev.effects, glow: Math.min(prev.effects.glow + 10, 100) }
                    }));
                  }
                }}
              />

              {/* Performance Director */}
              <PerformanceDirector
                song={currentSong}
                currentTime={currentTime}
                currentState={state}
                emotionalArc={getEmotionalArc(currentTime, currentSong?.duration_seconds)}
                onApplySuggestion={(params) => {
                  setState(prev => ({ ...prev, ...params }));
                  toast.success('Director suggestion applied');
                }}
              />

              {/* Asset Library */}
              <AssetLibrary
                sessionId={sessionId}
                onSelectAsset={(asset) => {
                  setState(prev => ({
                    ...prev,
                    layers: {
                      ...prev.layers,
                      background: { ...prev.layers.background, imageUrl: asset.file_url }
                    }
                  }));
                  toast.success(`Applied: ${asset.name}`);
                }}
              />

              {/* Collaboration Panel */}
              {sessionId && user && (
                <CollaborationPanel
                  sessionId={sessionId}
                  currentUserId={user.id}
                  isController={liveOverride}
                  currentState={state}
                  onSuggestChange={(params) => {
                    setState(prev => ({ ...prev, ...params }));
                    toast.success('Suggestion applied');
                  }}
                />
              )}

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-5 bg-white/5 mb-4">
                  <TabsTrigger value="layers"><Layers className="w-4 h-4 mr-2" />Layers</TabsTrigger>
                  <TabsTrigger value="effects"><Sparkles className="w-4 h-4 mr-2" />Effects</TabsTrigger>
                  <TabsTrigger value="color"><Palette className="w-4 h-4 mr-2" />Color</TabsTrigger>
                  <TabsTrigger value="camera"><Camera className="w-4 h-4 mr-2" />Camera</TabsTrigger>
                  <TabsTrigger value="particles"><Sparkles className="w-4 h-4 mr-2" />Particles</TabsTrigger>
                </TabsList>

                <TabsContent value="layers" className="space-y-4">
                  {Object.entries(state.layers).map(([layer, config]) => (
                    <div key={layer} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <h3 className="text-white/80 text-sm font-medium mb-3 capitalize">{layer}</h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-white/60 text-xs">Opacity: {config.opacity}%</Label>
                          <Slider
                            value={[config.opacity]}
                            onValueChange={([v]) => updateLayer(layer, 'opacity', v)}
                            max={100}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label className="text-white/60 text-xs">Blend Mode</Label>
                          <Select value={config.blend} onValueChange={(v) => updateLayer(layer, 'blend', v)}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {blendModes.map(mode => (
                                <SelectItem key={mode} value={mode} className="capitalize">{mode}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="effects" className="space-y-3">
                  {Object.entries(state.effects).map(([effect, value]) => (
                    <div key={effect} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <Label className="text-white/70 text-sm capitalize">{effect.replace('_', ' ')}: {value}</Label>
                      <Slider
                        value={[value]}
                        onValueChange={([v]) => updateEffect(effect, v)}
                        max={100}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="color" className="space-y-3">
                  {Object.entries(state.color_grading).map(([param, value]) => (
                    <div key={param} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <Label className="text-white/70 text-sm capitalize">{param}: {value}</Label>
                      <Slider
                        value={[value]}
                        onValueChange={([v]) => updateColorGrading(param, v)}
                        min={param === 'hue' || param === 'temperature' || param === 'tint' ? -100 : 0}
                        max={param === 'hue' ? 360 : 200}
                        step={1}
                        className="mt-2"
                      />
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="camera" className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-white/70">Camera Feed Active</Label>
                      <Button
                        size="sm"
                        variant={state.camera.active ? 'default' : 'outline'}
                        onClick={() => updateCamera('active', !state.camera.active)}
                        className="h-8"
                      >
                        {state.camera.active ? 'ON' : 'OFF'}
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-white/60 text-xs">Filter</Label>
                        <Select value={state.camera.filter} onValueChange={(v) => updateCamera('filter', v)}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {cameraFilters.map(f => (
                              <SelectItem key={f} value={f} className="capitalize">{f.replace('-', ' ')}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white/60 text-xs">Overlay: {state.camera.overlay}%</Label>
                        <Slider
                          value={[state.camera.overlay]}
                          onValueChange={([v]) => updateCamera('overlay', v)}
                          max={100}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-white/60 text-xs">Kaleidoscope: {state.camera.kaleidoscope}</Label>
                        <Slider
                          value={[state.camera.kaleidoscope]}
                          onValueChange={([v]) => updateCamera('kaleidoscope', v)}
                          max={12}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-white/60 text-xs">Feedback: {state.camera.feedback}%</Label>
                        <Slider
                          value={[state.camera.feedback]}
                          onValueChange={([v]) => updateCamera('feedback', v)}
                          max={100}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="particles" className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-white/70">Particles Active</Label>
                      <Button
                        size="sm"
                        variant={state.particles.active ? 'default' : 'outline'}
                        onClick={() => updateParticles('active', !state.particles.active)}
                        className="h-8"
                      >
                        {state.particles.active ? 'ON' : 'OFF'}
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-white/60 text-xs">Density: {state.particles.density}</Label>
                        <Slider
                          value={[state.particles.density]}
                          onValueChange={([v]) => updateParticles('density', v)}
                          max={100}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-white/60 text-xs">Speed: {state.particles.speed}</Label>
                        <Slider
                          value={[state.particles.speed]}
                          onValueChange={([v]) => updateParticles('speed', v)}
                          max={100}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-white/60 text-xs">Size: {state.particles.size}</Label>
                        <Slider
                          value={[state.particles.size]}
                          onValueChange={([v]) => updateParticles('size', v)}
                          max={100}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-white/60 text-xs mb-2">Color</Label>
                        <input
                          type="color"
                          value={state.particles.color}
                          onChange={(e) => updateParticles('color', e.target.value)}
                          className="w-full h-10 rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Save Preset */}
              <div className="bg-gradient-to-r from-[#f5a623]/10 to-[#e91e8c]/10 rounded-xl p-4 border border-[#f5a623]/20">
                <div className="flex gap-3">
                  <Input
                    placeholder="Preset name..."
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Button onClick={savePreset} disabled={savePresetMutation.isPending} className="bg-[#f5a623] hover:bg-[#e91e8c]">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button onClick={exportState} variant="outline" className="border-white/10">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Presets Library */}
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h2 className="text-white/80 font-medium mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-[#f5a623]" />
                  Preset Library
                </h2>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    placeholder="Search presets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredPresets.length === 0 && (
                    <p className="text-white/30 text-sm text-center py-4">No presets yet</p>
                  )}
                  {filteredPresets.map(preset => (
                    <div
                      key={preset.id}
                      className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-[#f5a623]/30 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white/90 text-sm font-medium truncate">{preset.name}</h3>
                          {preset.tags && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {preset.tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          onClick={() => toggleFavoriteMutation.mutate({ id: preset.id, is_favorite: preset.is_favorite })}
                        >
                          {preset.is_favorite ? (
                            <Star className="w-3 h-3 text-[#f5a623] fill-[#f5a623]" />
                          ) : (
                            <StarOff className="w-3 h-3 text-white/30" />
                          )}
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => loadPreset(preset)}
                          className="flex-1 h-7 text-xs bg-[#f5a623]/20 hover:bg-[#f5a623]/30 text-[#f5a623]"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(preset));
                            toast.success('Copied');
                          }}
                          className="h-7 w-7 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deletePresetMutation.mutate(preset.id)}
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Reference */}
              {currentSong && (
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="text-white/60 text-xs tracking-wider uppercase mb-2">Original Vision</h3>
                  <p className="text-white/40 text-xs leading-relaxed">{currentSong.vfx_description}</p>
                  {currentSong.visual_mood && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <span className="text-white/30 text-[10px] tracking-wider uppercase">Mood</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(currentSong.visual_mood || '').split(', ').filter(Boolean).map((mood, i) => (
                          <span key={i} className="text-[10px] px-2 py-1 rounded bg-[#f5a623]/10 text-[#f5a623]">
                            {mood}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Set Queue */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 max-h-64 overflow-y-auto">
                <h3 className="text-white/60 text-xs tracking-wider uppercase mb-3">Set Queue</h3>
                <div className="space-y-1">
                  {allSongs.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => setCurrentSongIndex(i)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        i === currentSongIndex
                          ? 'bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30'
                          : 'text-white/40 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] w-6">{s.set_position}</span>
                        <span className="text-xs flex-1 truncate">{s.title}</span>
                        <span className="text-[9px] opacity-60">{s.duration}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}