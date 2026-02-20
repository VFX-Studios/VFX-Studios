import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Upload, X, Loader2, Video, Image as ImageIcon, Minus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import CreditPurchaseDialog from '@/components/monetization/CreditPurchaseDialog';
import VideoAdDisplay from '@/components/monetization/VideoAdDisplay';
import AdvancedAIControls from './AdvancedAIControls';
import MonetizationPromoAd from '../ads/MonetizationPromoAd';
import { estimateGenerationTokenCost } from '@/lib/ai-providers/token-pricing';

const aspectRatios = [
  { label: '16:9 (Widescreen)', value: '16:9', width: 1920, height: 1080 },
  { label: '9:16 (Vertical)', value: '9:16', width: 1080, height: 1920 },
  { label: '1:1 (Square)', value: '1:1', width: 1080, height: 1080 },
  { label: '4:3 (Classic)', value: '4:3', width: 1600, height: 1200 },
  { label: '21:9 (Ultrawide)', value: '21:9', width: 2560, height: 1080 },
];

const resolutionPresets = [
  { label: '4K (3840x2160)', value: '4k', width: 3840, height: 2160 },
  { label: 'Full HD (1920x1080)', value: '1080p', width: 1920, height: 1080 },
  { label: 'HD (1280x720)', value: '720p', width: 1280, height: 720 },
  { label: 'Social (1080x1080)', value: 'social', width: 1080, height: 1080 },
];

function deriveDimensions(selectedAspect, selectedResolution) {
  const [ratioW, ratioH] = String(selectedAspect?.value || '16:9')
    .split(':')
    .map((part) => Number(part) || 1);
  const ratio = ratioW / ratioH;

  let width = selectedResolution?.width || selectedAspect?.width || 1920;
  let height = Math.round(width / ratio);

  const maxHeight = selectedResolution?.height || selectedAspect?.height || 1080;
  if (height > maxHeight) {
    height = maxHeight;
    width = Math.round(height * ratio);
  }

  return { width, height };
}

function resolveVideoDuration(generateType, resolutionValue) {
  if (resolutionValue === '4k') return 15;
  if (generateType === 'animation') return 4;
  return 10;
}

export default function EnhancedVisualGenerator({ onAssetCreated }) {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState([]);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedAsset, setGeneratedAsset] = useState(null);
  const [generateType, setGenerateType] = useState('image');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('1080p');
  const [styleIntensity, setStyleIntensity] = useState(75);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [subscription, setSubscription] = useState(null);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [videoAdOpen, setVideoAdOpen] = useState(false);
  const [advancedParams, setAdvancedParams] = useState({});
  const [showMonetizationAd, setShowMonetizationAd] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setCredits(userData.ai_credits_remaining || 0);
        const subs = await base44.entities.Subscription.filter({ user_id: userData.id });
        setSubscription(subs[0] || { tier: 'free' });
      } catch (error) {
        console.error('Failed to fetch user data');
      }
    };
    fetchUserData();
  }, []);

  const handleReferenceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingRef(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setReferenceImages(prev => [...prev, { url: file_url, name: file.name }]);
      toast.success('Reference image uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploadingRef(false);
    }
  };

  const removeReference = (index) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  const buildGenerationRequest = () => {
    const selectedAspect = aspectRatios.find(ar => ar.value === aspectRatio) || aspectRatios[0];
    const selectedRes = resolutionPresets.find(r => r.value === resolution) || resolutionPresets[1];
    const { width, height } = deriveDimensions(selectedAspect, selectedRes);

    const generationType = generateType === 'image' ? 'image' : 'video';
    const durationSeconds = generationType === 'video' ? resolveVideoDuration(generateType, resolution) : null;
    const quality =
      generationType === 'image'
        ? resolution === '4k'
          ? 'cinematic'
          : resolution === '1080p'
            ? 'hd'
            : 'standard'
        : durationSeconds >= 15
          ? 'cinematic'
          : durationSeconds >= 10 || resolution === '1080p'
            ? 'hd'
            : 'preview';

    return {
      generationType,
      request: {
        width,
        height,
        duration_seconds: durationSeconds,
        quality
      }
    };
  };

  const previewGeneration = buildGenerationRequest();
  const estimatedTokenCost = estimateGenerationTokenCost({
    ...previewGeneration.request,
    generation_type: previewGeneration.generationType
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Enter a description');
      return;
    }

    const { generationType, request: generationRequestMeta } = buildGenerationRequest();
    const requiredTokens = estimateGenerationTokenCost({
      ...generationRequestMeta,
      generation_type: generationType
    });

    // Check credits for free users
    if (subscription?.tier === 'free') {
      if (credits < requiredTokens) {
        toast.error(`Insufficient credits. This generation needs ${requiredTokens} tokens.`);
        setCreditDialogOpen(true);
        return;
      }
    }

    setGenerating(true);
    try {
      let enhancedPrompt = `${generateType === 'animation' ? 'ANIMATED LOOPING VIDEO: ' : ''}${prompt}`;
      
      if (advancedMode) {
        enhancedPrompt += `. Abstract, colorful, dynamic, suitable for live VJ performance projection.`;
        const selectedRes = resolutionPresets.find(r => r.value === resolution) || resolutionPresets[1];
        enhancedPrompt += ` Aspect ratio: ${aspectRatio}. Resolution: ${selectedRes.label}.`;
        if (referenceImages.length > 0) {
          enhancedPrompt += ` Style transfer from reference images with ${styleIntensity}% intensity.`;
        }
      }

      if (negativePrompt.trim()) {
        enhancedPrompt += ` EXCLUDE: ${negativePrompt}`;
      }

      const generationParams = {
        ...generationRequestMeta,
        prompt: enhancedPrompt,
        generation_type: generationType,
        existing_image_urls: referenceImages.length > 0 ? referenceImages.map(r => r.url) : undefined,
      };

      const result =
        generationType === 'video'
          ? await base44.integrations.Core.GenerateVideo(generationParams)
          : await base44.integrations.Core.GenerateImage(generationParams);

      const tokenCost = Number(result?.token_cost) || requiredTokens;

      const asset = {
        url: result.url,
        type: generationType === 'video' ? 'video' : 'image',
        prompt: prompt,
        negativePrompt: negativePrompt,
        aspectRatio: aspectRatio,
        resolution: resolution,
        referenceCount: referenceImages.length,
        tokenCost
      };

      setGeneratedAsset(asset);
      
      if (onAssetCreated) {
        onAssetCreated(asset);
      }

      // Deduct credit for free users
      if (subscription?.tier === 'free' && user) {
        const newCredits = Math.max(0, credits - tokenCost);
        setCredits(newCredits);
        await base44.auth.updateMe({ ai_credits_remaining: newCredits });
      }

      toast.success(
        `${generationType === 'video' ? 'Video' : 'Image'} generated${
          subscription?.tier === 'free'
            ? ` (-${tokenCost} tokens, ${Math.max(0, credits - tokenCost)} remaining)`
            : ''
        }`
      );
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const saveToLibrary = async () => {
    if (!generatedAsset) return;

    try {
      const user = await base44.auth.me();
      const assetType = generatedAsset.type || (generateType === 'image' ? 'image' : 'video');
      await base44.entities.VisualAsset.create({
        user_id: user.id,
        name: prompt.slice(0, 50),
        file_url: generatedAsset.url,
        type: assetType,
        description: `Generated: ${prompt}. ${negativePrompt ? `Excluded: ${negativePrompt}` : ''}`,
        tags: [
          'ai-generated',
          assetType,
          aspectRatio,
          ...prompt.split(' ').slice(0, 5),
        ],
      });

      await base44.entities.GeneratedArt.create({
        user_id: user.id,
        prompt: prompt,
        style: `${aspectRatio} ${generateType}`,
        reference_image_urls: referenceImages.map(r => r.url),
        generated_image_url: generatedAsset.url,
        parameters: {
          negative_prompt: negativePrompt,
          aspect_ratio: aspectRatio,
          resolution: resolution,
          style_intensity: styleIntensity,
          type: assetType,
        },
      });

      toast.success('Saved to library!');
    } catch (error) {
      toast.error('Save failed');
    }
  };

  const handleWatchAdForCredit = () => {
    setVideoAdOpen(true);
  };

  const handleAdRewardClaimed = async () => {
    const newCredits = credits + 1;
    setCredits(newCredits);
    if (user) {
      await base44.auth.updateMe({ ai_credits_remaining: newCredits });
    }
    toast.success('🎉 +1 AI credit earned!');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-[#e91e8c]" />
          <h3 className="text-white font-medium">Enhanced AI Visual Generator</h3>
        </div>
        <div className="flex items-center gap-3">
          {subscription?.tier === 'free' && (
            <div className="flex items-center gap-2 bg-[#f5a623]/20 px-3 py-1 rounded-full">
              <Zap className="w-4 h-4 text-[#f5a623]" />
              <span className="text-white text-sm font-semibold">{credits} credits</span>
              <Button 
                size="sm" 
                onClick={() => setCreditDialogOpen(true)}
                className="h-6 px-2 text-xs bg-[#f5a623] hover:bg-[#e91e8c]"
              >
                Buy More
              </Button>
              <Button 
                size="sm" 
                onClick={handleWatchAdForCredit}
                className="h-6 px-2 text-xs bg-blue-600 hover:bg-blue-700"
              >
                Watch Ad
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Label className="text-white/60 text-sm">Advanced</Label>
            <Switch checked={advancedMode} onCheckedChange={setAdvancedMode} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Controls */}
        <div className="space-y-4">
          {/* Generation Type with Text-to-Video */}
          <Tabs value={generateType} onValueChange={setGenerateType}>
            <TabsList className="grid w-full grid-cols-3 bg-white/5">
              <TabsTrigger value="image">
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </TabsTrigger>
              <TabsTrigger value="animation">
                <Video className="w-4 h-4 mr-2" />
                Animation
              </TabsTrigger>
              <TabsTrigger value="text_to_video">
                <Video className="w-4 h-4 mr-2" />
                Text→Video
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Main Prompt */}
          <div>
            <Label className="text-white/70 mb-2">Describe Your Visual</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., Pulsing purple fractals with electric energy, cyberpunk neon aesthetic, geometric patterns..."
              className="bg-white/5 border-white/10 text-white h-24"
            />
          </div>

          {/* Negative Prompt */}
          {advancedMode && (
            <div>
              <Label className="text-white/70 mb-2 flex items-center gap-2">
                <Minus className="w-4 h-4 text-red-400" />
                Exclude (Negative Prompt)
              </Label>
              <Textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="E.g., realistic faces, text, logos, dull colors, static..."
                className="bg-white/5 border-white/10 text-white h-20"
              />
            </div>
          )}

          {/* Aspect Ratio & Resolution */}
          {advancedMode && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/70 mb-2 text-sm">Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aspectRatios.map(ar => (
                      <SelectItem key={ar.value} value={ar.value}>
                        {ar.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/70 mb-2 text-sm">Resolution</Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resolutionPresets.map(res => (
                      <SelectItem key={res.value} value={res.value}>
                        {res.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Reference Images */}
          {advancedMode && (
            <div>
              <Label className="text-white/70 mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Style References ({referenceImages.length}/5)
              </Label>
              <div className="space-y-2">
                {referenceImages.map((ref, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white/5 rounded-lg p-2 border border-white/10">
                    <img src={ref.url} alt="" className="w-10 h-10 rounded object-cover" />
                    <span className="flex-1 text-white/60 text-xs truncate">{ref.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeReference(idx)}
                      className="w-6 h-6 p-0 text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                {referenceImages.length < 5 && (
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleReferenceUpload}
                      disabled={uploadingRef}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-3 text-center hover:border-white/40 transition-colors">
                      {uploadingRef ? (
                        <Loader2 className="w-4 h-4 mx-auto text-white/40 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mx-auto mb-1 text-white/40" />
                          <span className="text-white/40 text-xs">Upload Reference</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Advanced AI Controls */}
          {advancedMode && (
            <AdvancedAIControls 
              generationType={generateType}
              onParametersChange={setAdvancedParams}
            />
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-gradient-to-r from-[#e91e8c] to-purple-600 hover:opacity-90"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating {generateType}...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate {generateType === 'text_to_video' ? 'Video' : generateType === 'animation' ? 'Animation' : 'Visual'}
              </>
            )}
          </Button>
          {subscription?.tier === 'free' && (
            <div className="text-center text-white/50 text-xs">
              Estimated cost: {estimatedTokenCost} tokens
            </div>
          )}

          {/* Monetization Ad */}
          {showMonetizationAd && subscription?.tier === 'free' && (
            <div className="mt-4">
              <MonetizationPromoAd 
                placement="sidebar"
                onDismiss={() => setShowMonetizationAd(false)}
              />
            </div>
          )}
        </div>

        {/* Right: Preview */}
        <div>
          <Label className="text-white/70 mb-2">Preview</Label>
          <div className="bg-black/30 rounded-xl border border-white/10 aspect-video flex items-center justify-center overflow-hidden">
            {generatedAsset ? (
              <div className="relative w-full h-full">
                {generatedAsset.type === 'video' ? (
                  <video
                    src={generatedAsset.url}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    loop
                    muted
                  />
                ) : (
                  <img
                    src={generatedAsset.url}
                    alt="Generated"
                    className="w-full h-full object-contain"
                  />
                )}
                <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={saveToLibrary}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Save to Library
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-white/30">
                <Wand2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Generated {generateType} appears here</p>
              </div>
            )}
          </div>

          {generatedAsset && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 bg-white/5 rounded-lg p-3 border border-white/10"
            >
              <div className="text-white/60 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="text-white/90">{generatedAsset.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tokens:</span>
                  <span className="text-white/90">{generatedAsset.tokenCost}</span>
                </div>
                <div className="flex justify-between">
                  <span>Aspect:</span>
                  <span className="text-white/90">{generatedAsset.aspectRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span>Resolution:</span>
                  <span className="text-white/90">{generatedAsset.resolution}</span>
                </div>
                {generatedAsset.referenceCount > 0 && (
                  <div className="flex justify-between">
                    <span>Style refs:</span>
                    <span className="text-white/90">{generatedAsset.referenceCount}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Credit Purchase Dialog */}
      <CreditPurchaseDialog 
        open={creditDialogOpen} 
        onOpenChange={setCreditDialogOpen}
        currentCredits={credits}
      />

      {/* Video Ad for Free Credit */}
      <VideoAdDisplay 
        open={videoAdOpen}
        onClose={() => setVideoAdOpen(false)}
        onRewardClaimed={handleAdRewardClaimed}
        type="rewarded"
      />
    </div>
  );
}
