import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Zap, TrendingUp, Loader2, Image, Upload, Brain, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function EnhancedAIAssistant({ song, currentEnergy, currentTime, onApplyPreset, onUpdateState }) {
  const [aiActive, setAiActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [generatingArt, setGeneratingArt] = useState(false);
  
  // Enhanced art generation params
  const [textPrompt, setTextPrompt] = useState('');
  const [selectedStyles, setSelectedStyles] = useState([]);
  const [styleWeights, setStyleWeights] = useState({});
  const [referenceImages, setReferenceImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [adaptiveMode, setAdaptiveMode] = useState(true);
  const [learningInsights, setLearningInsights] = useState(null);
  
  // Art parameters
  const [artParams, setArtParams] = useState({
    complexity: 50,
    motionSpeed: 50,
    colorIntensity: 50
  });

  const styleOptions = [
    'cyberpunk', 'impressionistic', 'abstract', 'geometric', 
    'vaporwave', 'psychedelic', 'minimalist', 'glitch art',
    'synthwave', 'dreamy', 'neon noir', 'organic'
  ];

  const toggleStyle = (style) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(prev => prev.filter(s => s !== style));
      setStyleWeights(prev => {
        const newWeights = { ...prev };
        delete newWeights[style];
        return newWeights;
      });
    } else if (selectedStyles.length < 3) {
      setSelectedStyles(prev => [...prev, style]);
      setStyleWeights(prev => ({ ...prev, [style]: 50 }));
    } else {
      toast.error('Maximum 3 styles can be blended');
    }
  };

  useEffect(() => {
    if (aiActive && currentEnergy) {
      applyEnergyAdjustments(currentEnergy);
    }
  }, [currentEnergy, aiActive]);

  // Load user's learned preferences
  useEffect(() => {
    loadLearningInsights();
  }, []);

  const loadLearningInsights = async () => {
    try {
      const { data } = await base44.functions.invoke('ai-learn', {
        learningData: {
          learning_type: 'style_preference',
          parameters: {}
        }
      });
      setLearningInsights(data.insights);
    } catch (error) {
      console.error('Failed to load insights:', error);
    }
  };

  const applyEnergyAdjustments = (energy) => {
    const baseIntensity = (energy / 10) * 100;
    const adjustments = {
      effects: {
        glow: Math.min(baseIntensity * 0.8, 100),
        distortion: Math.min(baseIntensity * 0.3, 100),
        glitch: energy >= 8 ? Math.min((energy - 7) * 20, 60) : 0,
      },
      color_grading: {
        saturation: 100 + (energy - 5) * 10,
        vibrance: baseIntensity * 0.6,
      },
      particles: {
        speed: 30 + baseIntensity * 0.5,
        density: 20 + baseIntensity * 0.3,
      }
    };
    
    onUpdateState(adjustments);
  };

  const trackLearning = async (learningType, parameters, accepted = true) => {
    try {
      const emotionalArc = getEmotionalArc(currentTime, song?.duration_seconds);
      
      await base44.functions.invoke('ai-learn', {
        learningData: {
          learning_type: accepted ? 'accepted_suggestion' : 'rejected_suggestion',
          song_id: song?.id,
          music_context: {
            energy_level: currentEnergy,
            bpm: song?.tempo_bpm_estimate,
            mood: song?.visual_mood,
            timestamp: currentTime
          },
          parameters,
          emotional_arc: emotionalArc,
          style_tags: selectedStyles.length > 0 ? selectedStyles : [],
          effectiveness_score: accepted ? 8 : 2
        }
      });
      
      await loadLearningInsights();
    } catch (error) {
      console.error('Learning tracking failed:', error);
    }
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

  const analyzeSong = async () => {
    if (!song) return;
    setAnalyzing(true);
    
    try {
      const emotionalArc = getEmotionalArc(currentTime, song.duration_seconds);
      const learningContext = learningInsights?.topStyles?.length > 0
        ? `\n\nUser's preferred styles (learned): ${learningInsights.topStyles.join(', ')}`
        : '';

      const prompt = `Analyze this song for VJ performance at ${emotionalArc} phase:

Song: "${song.title}"
BPM: ${song.tempo_bpm_estimate || 120}
Energy Level: ${song.energy_level || 5}/10
Current Time: ${Math.floor(currentTime / 60)}:${(currentTime % 60).toFixed(0).padStart(2, '0')}
Emotional Arc: ${emotionalArc}
Set Section: ${song.set_section}
Visual Mood: ${song.visual_mood}
${learningContext}

Suggest optimized VFX settings for this exact moment in the song.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            reasoning: { type: "string" },
            layers: {
              type: "object",
              properties: {
                background: { type: "object", properties: { opacity: { type: "number" } } },
                midground: { type: "object", properties: { opacity: { type: "number" } } },
                foreground: { type: "object", properties: { opacity: { type: "number" } } },
                overlay: { type: "object", properties: { opacity: { type: "number" } } },
              }
            },
            effects: {
              type: "object",
              properties: {
                blur: { type: "number" },
                glow: { type: "number" },
                chromatic: { type: "number" },
                distortion: { type: "number" },
                glitch: { type: "number" },
              }
            },
            color_grading: {
              type: "object",
              properties: {
                hue: { type: "number" },
                saturation: { type: "number" },
                brightness: { type: "number" },
                contrast: { type: "number" },
              }
            },
          }
        }
      });

      setSuggestion(result);
      toast.success('AI analysis complete');
    } catch (error) {
      toast.error('AI analysis failed');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const applySuggestion = async (accept = true) => {
    if (!suggestion) return;
    
    if (accept) {
      onUpdateState({
        layers: suggestion.layers,
        effects: suggestion.effects,
        color_grading: suggestion.color_grading,
      });
      toast.success('AI suggestion applied');
    }
    
    await trackLearning('suggestion', {
      layers: suggestion.layers,
      effects: suggestion.effects,
      color_grading: suggestion.color_grading
    }, accept);
    
    setSuggestion(null);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadPromises = files.map(file =>
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      setReferenceImages(prev => [...prev, ...urls]);
      toast.success(`${files.length} image(s) uploaded`);
    } catch (error) {
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const generateArt = async () => {
    if (!textPrompt.trim() && referenceImages.length === 0) {
      toast.error('Provide a text prompt or reference images');
      return;
    }

    setGeneratingArt(true);
    try {
      const emotionalArc = getEmotionalArc(currentTime, song?.duration_seconds);
      
      const { data } = await base44.functions.invoke('generate-art', {
        prompt: textPrompt,
        style: selectedStyles.length > 0 ? null : null,
        styleBlend: selectedStyles.length > 0 ? { styles: selectedStyles, weights: styleWeights } : null,
        referenceImages,
        musicContext: {
          energy_level: currentEnergy,
          bpm: song?.tempo_bpm_estimate,
          mood: song?.visual_mood,
          emotional_arc: emotionalArc,
          timestamp: currentTime
        },
        adaptiveMode
      });

      if (data.imageUrl) {
        // Apply generated art as background layer
        onUpdateState({
          layers: {
            background: { 
              opacity: 100,
              imageUrl: data.imageUrl
            }
          },
          particles: {
            density: artParams.complexity,
            speed: artParams.motionSpeed,
          },
          color_grading: {
            saturation: 100 + artParams.colorIntensity,
          }
        });

        await trackLearning('art_generation', {
          prompt: textPrompt,
          styleBlend: selectedStyles.length > 0 ? { styles: selectedStyles, weights: styleWeights } : null,
          imageUrl: data.imageUrl,
          params: artParams
        }, true);

        toast.success('AI art generated and applied!');
      }
    } catch (error) {
      toast.error('Art generation failed');
      console.error(error);
    } finally {
      setGeneratingArt(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#f5a623]/10 to-[#e91e8c]/10 rounded-xl border border-[#f5a623]/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#f5a623]" />
          <h3 className="text-white/90 font-medium text-sm">Enhanced AI Co-Pilot</h3>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-white/60 text-xs">Auto Mode</Label>
          <Switch checked={aiActive} onCheckedChange={setAiActive} />
        </div>
      </div>

      {learningInsights?.topStyles?.length > 0 && (
        <div className="mb-3 p-2 bg-purple-500/10 rounded-lg border border-purple-400/20">
          <div className="flex items-center gap-2 text-purple-400 text-[10px] mb-1">
            <Sparkles className="w-3 h-3" />
            <span>Learned Preferences</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {learningInsights.topStyles.map(style => (
              <span key={style} className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                {style}
              </span>
            ))}
          </div>
        </div>
      )}

      {aiActive && (
        <div className="mb-4 p-3 bg-[#f5a623]/10 rounded-lg border border-[#f5a623]/30">
          <div className="flex items-center gap-2 text-[#f5a623] text-xs mb-2">
            <TrendingUp className="w-3 h-3" />
            <span className="font-medium">Real-Time Energy Tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#00d4ff] via-[#f5a623] to-[#e91e8c]"
                animate={{ width: `${currentEnergy * 10}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-white/60 text-xs font-mono">{currentEnergy}/10</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {/* Smart Analysis */}
        <Button
          onClick={analyzeSong}
          disabled={analyzing || !song}
          className="w-full h-9 bg-[#f5a623] hover:bg-[#e91e8c] text-xs"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Wand2 className="w-3 h-3 mr-2" />
              Smart Analyze (Context-Aware)
            </>
          )}
        </Button>

        {/* Text-to-Image Generation */}
        <div className="bg-black/20 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Image className="w-3 h-3 text-purple-400" />
            <span className="text-white/70 text-xs font-medium">AI Image Generation</span>
          </div>

          <Textarea
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
            placeholder="Describe the visual you want... (e.g., 'cosmic nebula with pulsing energy waves')"
            className="bg-white/5 border-white/10 text-white text-xs min-h-[60px]"
          />

          <div className="space-y-2">
            <Label className="text-white/70 text-xs">Blend Styles (select 1-3)</Label>
            <div className="flex flex-wrap gap-1">
              {styleOptions.map(style => (
                <button
                  key={style}
                  onClick={() => toggleStyle(style)}
                  className={`px-2 py-1 rounded text-[10px] transition-colors ${
                    selectedStyles.includes(style)
                      ? 'bg-[#f5a623] text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>

            {selectedStyles.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                {selectedStyles.map(style => (
                  <div key={style}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-white/60 capitalize">{style}</span>
                      <span className="text-[10px] text-[#f5a623]">{styleWeights[style]}%</span>
                    </div>
                    <Slider
                      value={[styleWeights[style]]}
                      onValueChange={([v]) => setStyleWeights(prev => ({ ...prev, [style]: v }))}
                      max={100}
                      className="h-1"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="ref-upload" className="cursor-pointer flex-1">
              <div className="h-8 bg-white/5 border border-white/10 rounded-md flex items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                <Upload className="w-3 h-3 text-white/60" />
                <span className="text-white/60 text-xs">Reference Images ({referenceImages.length})</span>
              </div>
            </Label>
            <Input
              id="ref-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex items-center gap-1">
              <Switch checked={adaptiveMode} onCheckedChange={setAdaptiveMode} />
              <Label className="text-white/50 text-[9px]">Adaptive</Label>
            </div>
          </div>

          {/* Art Parameters */}
          <div className="space-y-1 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <Label className="text-white/50 text-[9px]">Complexity</Label>
              <span className="text-white/60 text-[9px]">{artParams.complexity}</span>
            </div>
            <Slider
              value={[artParams.complexity]}
              onValueChange={([v]) => setArtParams(p => ({ ...p, complexity: v }))}
              max={100}
              className="h-1"
            />
            
            <div className="flex items-center justify-between">
              <Label className="text-white/50 text-[9px]">Motion Speed</Label>
              <span className="text-white/60 text-[9px]">{artParams.motionSpeed}</span>
            </div>
            <Slider
              value={[artParams.motionSpeed]}
              onValueChange={([v]) => setArtParams(p => ({ ...p, motionSpeed: v }))}
              max={100}
              className="h-1"
            />
            
            <div className="flex items-center justify-between">
              <Label className="text-white/50 text-[9px]">Color Intensity</Label>
              <span className="text-white/60 text-[9px]">{artParams.colorIntensity}</span>
            </div>
            <Slider
              value={[artParams.colorIntensity]}
              onValueChange={([v]) => setArtParams(p => ({ ...p, colorIntensity: v }))}
              max={100}
              className="h-1"
            />
          </div>

          <Button
            onClick={generateArt}
            disabled={generatingArt || uploadingImage}
            className="w-full h-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-xs"
          >
            {generatingArt ? (
              <>
                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Palette className="w-3 h-3 mr-2" />
                Generate AI Visual
              </>
            )}
          </Button>
        </div>

        {/* AI Suggestion */}
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 rounded-lg p-3 space-y-2"
          >
            <p className="text-white/70 text-xs leading-relaxed">{suggestion.reasoning}</p>
            
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-white/5 rounded p-2">
                <div className="text-white/40 mb-1">Effects</div>
                <div className="text-[#f5a623]">
                  Glow: {suggestion.effects?.glow}, Glitch: {suggestion.effects?.glitch}
                </div>
              </div>
              <div className="bg-white/5 rounded p-2">
                <div className="text-white/40 mb-1">Color</div>
                <div className="text-[#e91e8c]">
                  Sat: {suggestion.color_grading?.saturation}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => applySuggestion(true)}
                className="flex-1 h-7 bg-gradient-to-r from-[#f5a623] to-[#e91e8c] text-xs"
              >
                <Zap className="w-3 h-3 mr-1" />
                Accept & Learn
              </Button>
              <Button
                onClick={() => applySuggestion(false)}
                variant="outline"
                className="h-7 px-3 text-xs"
              >
                Reject
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
