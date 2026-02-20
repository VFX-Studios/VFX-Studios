import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wand2, ShoppingCart, Loader2, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function StealThisLookModal({ asset, open, onClose }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [styleParams, setStyleParams] = useState(null);
  const [paramValues, setParamValues] = useState({});
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(null);

  const analyzeStyle = async () => {
    setAnalyzing(true);
    try {
      const response = await base44.functions.invoke('reverse-engineer-style', {
        marketplace_asset_id: asset.id
      });

      setStyleParams(response.data);
      
      // Initialize param values
      const initialValues = {};
      response.data.reverse_engineered.parameters.forEach(p => {
        initialValues[p.name] = p.value;
      });
      setParamValues(initialValues);

      toast.success('Style reverse-engineered!');
    } catch (error) {
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const generateWithParams = async () => {
    setGenerating(true);
    try {
      const prompt = `Generate VFX visual in style: ${styleParams.reverse_engineered.style_name}. 
      Colors: ${styleParams.reverse_engineered.color_palette.join(', ')}. 
      Parameters: ${JSON.stringify(paramValues)}`;

      const result = await base44.integrations.Core.GenerateImage({ prompt });
      setPreview(result.url);
      toast.success('Preview generated!');
    } catch (error) {
      toast.error('Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleBuyOriginal = () => {
    window.location.href = `/marketplace?buy=${asset.id}`;
  };

  React.useEffect(() => {
    if (open && asset && !styleParams) {
      analyzeStyle();
    }
  }, [open, asset]);

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a0a3e] border-white/10 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">
            <Wand2 className="w-6 h-6 inline mr-2 text-[#f5a623]" />
            Steal This Look
          </DialogTitle>
        </DialogHeader>

        {analyzing && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#f5a623] animate-spin" />
            <p className="text-white/70">AI analyzing style parameters...</p>
          </div>
        )}

        {styleParams && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Parameter Controls */}
            <div>
              <Card className="bg-white/5 border-white/10 p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Recreate This Style</h3>
                  <Badge className={styleParams.can_recreate_free ? 'bg-green-500' : 'bg-yellow-500'}>
                    {styleParams.recreation_difficulty}
                  </Badge>
                </div>

                <div className="space-y-6">
                  {styleParams.reverse_engineered.parameters.map((param, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-white text-sm font-medium">
                          {param.name}
                        </label>
                        <span className="text-[#f5a623] text-sm font-mono">
                          {paramValues[param.name] || param.value}
                        </span>
                      </div>
                      <Slider
                        value={[paramValues[param.name] || param.value]}
                        onValueChange={(val) => setParamValues({...paramValues, [param.name]: val[0]})}
                        min={param.min}
                        max={param.max}
                        step={1}
                        className="mb-1"
                      />
                      <div className="text-white/40 text-xs">{param.description}</div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={generateWithParams}
                  disabled={generating}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Generate Preview
                    </>
                  )}
                </Button>
              </Card>

              {/* Upsell Card */}
              {!styleParams.can_recreate_free && (
                <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 p-6">
                  <div className="text-green-300 font-semibold mb-2">
                    💡 {styleParams.upsell_message}
                  </div>
                  <Button
                    onClick={handleBuyOriginal}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy Original for ${asset.price}
                  </Button>
                </Card>
              )}
            </div>

            {/* Right: Preview */}
            <div>
              <Card className="bg-white/5 border-white/10 p-6">
                <h3 className="text-white font-semibold mb-4">Preview</h3>
                
                {/* Original */}
                <div className="mb-6">
                  <div className="text-white/60 text-sm mb-2">Original Asset</div>
                  <img 
                    src={asset.preview_url} 
                    alt={asset.title}
                    className="w-full rounded-lg border border-white/20"
                  />
                </div>

                {/* Generated Preview */}
                {preview && (
                  <div>
                    <div className="text-white/60 text-sm mb-2">Your Recreation</div>
                    <img 
                      src={preview} 
                      alt="Generated"
                      className="w-full rounded-lg border border-[#f5a623]/50"
                    />
                  </div>
                )}

                {!preview && !generating && styleParams && (
                  <div className="text-center py-12 text-white/40">
                    <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Adjust parameters and generate preview</p>
                  </div>
                )}
              </Card>

              {/* Color Palette */}
              <Card className="bg-white/5 border-white/10 p-4 mt-4">
                <div className="text-white/70 text-sm mb-3">Detected Colors</div>
                <div className="flex gap-2">
                  {styleParams.reverse_engineered.color_palette.map((color, i) => (
                    <div
                      key={i}
                      className="w-12 h-12 rounded-lg border-2 border-white/20"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}