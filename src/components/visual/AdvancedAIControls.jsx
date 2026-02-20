import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Sparkles } from 'lucide-react';

export default function AdvancedAIControls({ onParametersChange, generationType = 'image' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [parameters, setParameters] = useState({
    // Image/Video Generation
    model: 'flux-dev',
    steps: 28,
    guidance_scale: 7.5,
    negative_prompt: '',
    seed: -1,
    
    // Video-specific
    frames: 16,
    fps: 24,
    motion_strength: 127,
    
    // Upscaling
    upscale_factor: 2,
    
    // Quality
    quality: 'high',
    sampler: 'euler_a'
  });

  const updateParameter = (key, value) => {
    const newParams = { ...parameters, [key]: value };
    setParameters(newParams);
    if (onParametersChange) {
      onParametersChange(newParams);
    }
  };

  const models = {
    image: [
      { id: 'flux-dev', name: 'Flux Dev (Fast, High Quality)', recommended: true },
      { id: 'flux-pro', name: 'Flux Pro (Best Quality, Slower)' },
      { id: 'sdxl-turbo', name: 'SDXL Turbo (Ultra Fast)' },
      { id: 'sd-3', name: 'Stable Diffusion 3' }
    ],
    video: [
      { id: 'animatediff', name: 'AnimateDiff (16 frames)', recommended: true },
      { id: 'runway-gen2', name: 'Runway Gen-2 (4 sec)' },
      { id: 'pika-1.0', name: 'Pika 1.0 (3 sec)' },
      { id: 'zeroscope-xl', name: 'Zeroscope XL (24 frames)' }
    ],
    text_to_video: [
      { id: 'runway-gen3', name: 'Runway Gen-3 Alpha (Best)', recommended: true },
      { id: 'pika-1.5', name: 'Pika 1.5 (Fast)' },
      { id: 'animatediff-xl', name: 'AnimateDiff XL' },
      { id: 'zeroscope-v2', name: 'Zeroscope V2 XL' },
      { id: 'modelscope', name: 'ModelScope Text2Video' }
    ]
  };

  const currentModels = models[generationType] || models.image;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <Card className="bg-white/5 border-white/10 p-4 hover:bg-white/10 transition-colors cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#f5a623]" />
              <span className="text-white font-medium">Advanced AI Settings</span>
              <Badge className="bg-purple-500/20 text-purple-300">Pro</Badge>
            </div>
            <ChevronDown className={`w-5 h-5 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </Card>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Card className="bg-white/5 border-white/10 p-6 mt-2">
          <div className="space-y-6">
            {/* Model Selection */}
            <div>
              <Label className="text-white/70 mb-2 block">AI Model</Label>
              <Select value={parameters.model} onValueChange={(v) => updateParameter('model', v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a0a3e] border-white/10">
                  {currentModels.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        {model.name}
                        {model.recommended && (
                          <Badge className="bg-[#f5a623] text-xs">Recommended</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Inference Steps */}
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-white/70">Inference Steps: {parameters.steps}</Label>
                <span className="text-white/40 text-xs">More = Better Quality</span>
              </div>
              <Slider
                value={[parameters.steps]}
                onValueChange={(v) => updateParameter('steps', v[0])}
                min={4}
                max={50}
                step={1}
                className="mt-2"
              />
            </div>

            {/* Guidance Scale */}
            <div>
              <div className="flex justify-between mb-2">
                <Label className="text-white/70">Guidance Scale: {parameters.guidance_scale}</Label>
                <span className="text-white/40 text-xs">How strictly to follow prompt</span>
              </div>
              <Slider
                value={[parameters.guidance_scale]}
                onValueChange={(v) => updateParameter('guidance_scale', v[0])}
                min={1}
                max={20}
                step={0.5}
                className="mt-2"
              />
            </div>

            {/* Video-specific controls */}
            {(generationType === 'video' || generationType === 'text_to_video') && (
              <>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-white/70">Frame Count: {parameters.frames}</Label>
                    <span className="text-white/40 text-xs">{(parameters.frames / parameters.fps).toFixed(1)}s at {parameters.fps}fps</span>
                  </div>
                  <Slider
                    value={[parameters.frames]}
                    onValueChange={(v) => updateParameter('frames', v[0])}
                    min={8}
                    max={96}
                    step={8}
                    className="mt-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-white/70">Motion Strength: {parameters.motion_strength}</Label>
                    <span className="text-white/40 text-xs">Animation intensity</span>
                  </div>
                  <Slider
                    value={[parameters.motion_strength]}
                    onValueChange={(v) => updateParameter('motion_strength', v[0])}
                    min={0}
                    max={255}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-white/70 mb-2 block">Frame Rate (FPS)</Label>
                  <Select value={parameters.fps.toString()} onValueChange={(v) => updateParameter('fps', parseInt(v))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a0a3e] border-white/10">
                      <SelectItem value="12">12 FPS (Stylized)</SelectItem>
                      <SelectItem value="24">24 FPS (Cinematic)</SelectItem>
                      <SelectItem value="30">30 FPS (Standard)</SelectItem>
                      <SelectItem value="60">60 FPS (Smooth)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Sampler */}
            <div>
              <Label className="text-white/70 mb-2 block">Sampling Method</Label>
              <Select value={parameters.sampler} onValueChange={(v) => updateParameter('sampler', v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a0a3e] border-white/10">
                  <SelectItem value="euler_a">Euler A (Balanced)</SelectItem>
                  <SelectItem value="dpm++_2m">DPM++ 2M (Fast)</SelectItem>
                  <SelectItem value="dpm++_sde">DPM++ SDE (Quality)</SelectItem>
                  <SelectItem value="uni_pc">UniPC (Very Fast)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Seed */}
            <div>
              <Label className="text-white/70 mb-2 block">Seed (-1 for random)</Label>
              <input
                type="number"
                value={parameters.seed}
                onChange={(e) => updateParameter('seed', parseInt(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                placeholder="-1"
              />
            </div>

            <div className="pt-4 border-t border-white/10 text-white/60 text-xs">
              💡 Tip: Lower steps (4-8) for fast previews, higher steps (28-50) for final quality
            </div>
          </div>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}