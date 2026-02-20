import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Zap, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIAssistant({ song, currentEnergy, onApplyPreset, onUpdateState, enableGenerativeArt = false, currentState = {}, viewerReactions = [], elapsedTime = 0 }) {
  const [aiActive, setAiActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [generatingArt, setGeneratingArt] = useState(false);
  const [artParams, setArtParams] = useState({ complexity: 50, motionSpeed: 50, colorIntensity: 50 });
  const [learningEnabled, setLearningEnabled] = useState(true);
  const [manualAdjustments, setManualAdjustments] = useState([]);
  const [realtimeSuggestion, setRealtimeSuggestion] = useState(null);
  const [loadingRealtime, setLoadingRealtime] = useState(false);

  const analyzeSong = async () => {
    if (!song) return;
    setAnalyzing(true);
    
    try {
      const prompt = `Analyze this song for a VJ (visual jockey) and suggest optimal visual effects settings:

Song: "${song.title || 'Unknown'}"
BPM: ${song.tempo_bpm_estimate || 120}
Energy Level: ${song.energy_level || 5}/10
Set Section: ${song.set_section || 'unknown'}
Visual Mood: ${song.visual_mood || 'neutral'}
VFX Description: ${song.vfx_description || 'No description available'}

Based on this, suggest:
1. Layer opacities (0-100) for background, midground, foreground, overlay
2. Effect intensities (0-100) for blur, glow, chromatic aberration, distortion, glitch
3. Color grading values: hue shift (-100 to 360), saturation (0-200), brightness (0-200), contrast (0-200)
4. Camera settings: should it be active? which filter? kaleidoscope segments (0-12)?
5. Particle system settings: density (0-100), speed (0-100), primary color

Return ONLY valid JSON matching this exact structure:
{
  "reasoning": "brief explanation",
  "layers": {"background": {"opacity": number}, "midground": {"opacity": number}, "foreground": {"opacity": number}, "overlay": {"opacity": number}},
  "effects": {"blur": number, "glow": number, "chromatic": number, "distortion": number, "glitch": number},
  "color_grading": {"hue": number, "saturation": number, "brightness": number, "contrast": number},
  "camera": {"active": boolean, "filter": "string", "kaleidoscope": number},
  "particles": {"density": number, "speed": number, "color": "hex"}
}`;

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
            camera: {
              type: "object",
              properties: {
                active: { type: "boolean" },
                filter: { type: "string" },
                kaleidoscope: { type: "number" },
              }
            },
            particles: {
              type: "object",
              properties: {
                density: { type: "number" },
                speed: { type: "number" },
                color: { type: "string" },
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

  const applySuggestion = () => {
    if (!suggestion) return;
    
    const newState = {
      layers: suggestion.layers,
      effects: suggestion.effects,
      color_grading: suggestion.color_grading,
      camera: suggestion.camera,
      particles: suggestion.particles,
    };
    
    onUpdateState(newState);
    toast.success('AI suggestion applied');
  };

  const generateGenerativeArt = async () => {
    if (!song || !enableGenerativeArt) return;
    
    setGeneratingArt(true);
    try {
      const learningContext = learningEnabled && manualAdjustments.length > 0
        ? `\n\nUser preferences learned from previous adjustments: ${JSON.stringify(manualAdjustments.slice(-5))}`
        : '';

      const prompt = `Create real-time abstract visual sequence for VJ performance:
- Song: ${song.title}
- BPM: ${song.tempo_bpm_estimate}
- Energy: ${song.energy_level}/10
- Mood: ${song.visual_mood}
- Genre: ${song.set_section}
- User Parameters: Complexity ${artParams.complexity}/100, Motion Speed ${artParams.motionSpeed}/100, Color Intensity ${artParams.colorIntensity}/100
${learningContext}

Generate detailed generative art instructions including:
1. Abstract pattern types (fractals, particles, waves, geometric)
2. Color palette (hex codes) matching emotional arc
3. Motion dynamics and animation curves
4. Layer composition and blend modes
5. Transition effects between sections

Focus on the song's emotional journey from ${song.set_section} section.`;

      const art = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            art_description: { type: "string" },
            pattern_types: { type: "array", items: { type: "string" } },
            color_palette: { type: "array", items: { type: "string" } },
            motion_type: { type: "string" },
            motion_curve: { type: "string" },
            complexity_level: { type: "number" },
            emotional_arc: { type: "string" },
            layer_config: { type: "object" },
            transition_effects: { type: "array", items: { type: "string" } }
          }
        }
      });

      if (learningEnabled) {
        setManualAdjustments(prev => [...prev, { art, params: artParams, timestamp: Date.now() }]);
      }

      onUpdateState({
        particles: {
          ...art.layer_config?.particles,
          speed: artParams.motionSpeed,
          density: artParams.complexity,
        },
        color_grading: {
          saturation: 100 + artParams.colorIntensity,
          vibrance: artParams.colorIntensity,
        }
      });

      toast.success('Generative art applied!');
    } catch (error) {
      toast.error('Art generation failed');
    } finally {
      setGeneratingArt(false);
    }
  };

  const getEnergyAdjustment = (energy) => {
    // Energy-based real-time adjustments
    const baseIntensity = (energy / 10) * 100;
    return {
      glow: Math.min(baseIntensity * 0.8, 100),
      distortion: Math.min(baseIntensity * 0.3, 100),
      glitch: energy >= 8 ? Math.min((energy - 7) * 20, 60) : 0,
      saturation: 100 + (energy - 5) * 10,
      particles_speed: 30 + baseIntensity * 0.5,
    };
  };

  const getRealtimeSuggestion = async () => {
    if (!song) return;
    setLoadingRealtime(true);

    try {
      const response = await base44.functions.invoke('ai-real-time-copilot', {
        song_id: song.id,
        current_energy: currentEnergy,
        current_state: currentState,
        viewer_reactions: viewerReactions,
        elapsed_time: elapsedTime,
      });

      setRealtimeSuggestion(response.data.suggestion);
      toast.success('Real-time suggestion ready');
    } catch (error) {
      toast.error('Real-time suggestion failed');
    } finally {
      setLoadingRealtime(false);
    }
  };

  const applyRealtimeSuggestion = () => {
    if (!realtimeSuggestion?.primary_suggestion) return;
    onUpdateState(realtimeSuggestion.primary_suggestion.parameters);
    toast.success('Live suggestion applied!');
  };

  return (
    <div className="bg-gradient-to-br from-[#f5a623]/10 to-[#e91e8c]/10 rounded-xl border border-[#f5a623]/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#f5a623]" />
          <h3 className="text-white/90 font-medium text-sm">AI Co-Pilot</h3>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-white/60 text-xs">Auto Mode</Label>
          <Switch checked={aiActive} onCheckedChange={setAiActive} />
        </div>
      </div>

      {aiActive && (
        <div className="mb-4 p-3 bg-[#f5a623]/10 rounded-lg border border-[#f5a623]/30">
          <div className="flex items-center gap-2 text-[#f5a623] text-xs mb-2">
            <TrendingUp className="w-3 h-3" />
            <span className="font-medium">Live Energy Tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#00d4ff] via-[#f5a623] to-[#e91e8c]"
                initial={{ width: 0 }}
                animate={{ width: `${currentEnergy * 10}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-white/60 text-xs font-mono">{currentEnergy}/10</span>
          </div>
          <p className="text-white/40 text-[10px] mt-2">
            AI is dynamically adjusting effects based on energy level
          </p>
        </div>
      )}

      <div className="space-y-2">
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
              Analyze Song & Suggest Settings
            </>
          )}
        </Button>

        {enableGenerativeArt && (
          <>
            <div className="space-y-2 bg-black/20 rounded-lg p-3">
              <Label className="text-white/60 text-[10px]">Art Complexity: {artParams.complexity}</Label>
              <Slider
                value={[artParams.complexity]}
                onValueChange={([v]) => setArtParams(p => ({ ...p, complexity: v }))}
                max={100}
                className="mt-1"
              />
              <Label className="text-white/60 text-[10px]">Motion Speed: {artParams.motionSpeed}</Label>
              <Slider
                value={[artParams.motionSpeed]}
                onValueChange={([v]) => setArtParams(p => ({ ...p, motionSpeed: v }))}
                max={100}
                className="mt-1"
              />
              <Label className="text-white/60 text-[10px]">Color Intensity: {artParams.colorIntensity}</Label>
              <Slider
                value={[artParams.colorIntensity]}
                onValueChange={([v]) => setArtParams(p => ({ ...p, colorIntensity: v }))}
                max={100}
                className="mt-1"
              />
              <div className="flex items-center justify-between mt-2">
                <Label className="text-white/60 text-[10px]">Learn from adjustments</Label>
                <Switch checked={learningEnabled} onCheckedChange={setLearningEnabled} />
              </div>
            </div>
            <Button
              onClick={generateGenerativeArt}
              disabled={generatingArt || !song}
              className="w-full h-9 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-xs"
            >
              {generatingArt ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Generating Art...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-2" />
                  Generate Unique Art Sequence
                </>
              )}
            </Button>
          </>
        )}

        <Button
          onClick={getRealtimeSuggestion}
          disabled={loadingRealtime || !song}
          className="w-full h-9 bg-gradient-to-r from-green-600 to-teal-600 hover:opacity-90 text-xs"
        >
          {loadingRealtime ? (
            <>
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
              Analyzing Live...
            </>
          ) : (
            <>
              <TrendingUp className="w-3 h-3 mr-2" />
              Get Real-Time Suggestion
            </>
          )}
        </Button>

        {realtimeSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 rounded-lg p-3 space-y-3 border-2 border-green-500/30"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-xs font-medium uppercase">
                {realtimeSuggestion.urgency} Priority
              </span>
            </div>
            <div>
              <p className="text-white/90 text-xs font-medium mb-1">
                {realtimeSuggestion.primary_suggestion.description}
              </p>
              <p className="text-white/60 text-[10px]">{realtimeSuggestion.reasoning}</p>
            </div>
            {realtimeSuggestion.audience_insight && (
              <div className="bg-white/5 rounded p-2">
                <div className="text-white/40 text-[10px] mb-1">Audience Insight</div>
                <div className="text-white/70 text-[10px]">{realtimeSuggestion.audience_insight}</div>
              </div>
            )}
            <Button
              onClick={applyRealtimeSuggestion}
              className="w-full h-8 bg-gradient-to-r from-green-500 to-teal-500 hover:opacity-90 text-xs"
            >
              <Zap className="w-3 h-3 mr-2" />
              Apply Live Suggestion
            </Button>
          </motion.div>
        )}

        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/30 rounded-lg p-3 space-y-3"
          >
            <div>
              <p className="text-white/70 text-xs leading-relaxed">{suggestion.reasoning}</p>
            </div>
            
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
                  Sat: {suggestion.color_grading?.saturation}, Hue: {suggestion.color_grading?.hue}
                </div>
              </div>
            </div>

            <Button
              onClick={applySuggestion}
              className="w-full h-8 bg-gradient-to-r from-[#f5a623] to-[#e91e8c] hover:opacity-90 text-xs"
            >
              <Zap className="w-3 h-3 mr-2" />
              Apply AI Suggestion
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}