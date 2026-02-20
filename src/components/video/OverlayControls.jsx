import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Type, Sticker } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function OverlayControls({ onAddOverlay }) {
  const [textValue, setTextValue] = useState('');
  const [selectedFont, setSelectedFont] = useState('arial');
  const [fontSize, setFontSize] = useState(48);
  const [textColor, setTextColor] = useState('#ffffff');

  const { data: fonts = [] } = useQuery({
    queryKey: ['fonts'],
    queryFn: async () => {
      return await base44.entities.FontAsset.filter({ status: 'approved' }, '-download_count', 50);
    }
  });

  const openSourceFonts = [
    { name: 'Arial', family: 'Arial, sans-serif' },
    { name: 'Roboto', family: 'Roboto, sans-serif' },
    { name: 'Open Sans', family: '"Open Sans", sans-serif' },
    { name: 'Montserrat', family: 'Montserrat, sans-serif' },
    { name: 'Lato', family: 'Lato, sans-serif' },
    { name: 'Courier New', family: '"Courier New", monospace' }
  ];

  const handleAddText = () => {
    if (!textValue) {
      toast.error('Enter text first');
      return;
    }

    const overlay = {
      type: 'text',
      content: textValue,
      font: selectedFont,
      fontSize,
      color: textColor,
      timestamp: 0 // User can adjust in timeline
    };

    if (onAddOverlay) onAddOverlay(overlay);
    toast.success('Text overlay added');
    setTextValue('');
  };

  const handleUploadGif = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const overlay = {
        type: 'gif',
        url: uploadResult.file_url,
        timestamp: 0
      };
      if (onAddOverlay) onAddOverlay(overlay);
      toast.success('GIF added to timeline');
    } catch (error) {
      toast.error('Upload failed');
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 p-4">
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-black/20">
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="stickers">Stickers</TabsTrigger>
          <TabsTrigger value="gifs">GIFs</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4 mt-4">
          <div>
            <Label className="text-white/70 text-xs">Text Content</Label>
            <Input
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder="Enter text..."
              className="mt-2 bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <Label className="text-white/70 text-xs">Font</Label>
            <Select value={selectedFont} onValueChange={setSelectedFont}>
              <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a0a3e] border-white/10 max-h-64">
                <div className="text-white/40 text-xs px-2 py-1 font-semibold">Open Source Fonts</div>
                {openSourceFonts.map(font => (
                  <SelectItem key={font.name} value={font.family}>
                    <span style={{ fontFamily: font.family }}>{font.name}</span>
                  </SelectItem>
                ))}
                {fonts.filter(f => f.copyright_verified).length > 0 && (
                  <>
                    <div className="text-white/40 text-xs px-2 py-1 font-semibold mt-2">Community Fonts</div>
                    {fonts.filter(f => f.copyright_verified).map(font => (
                      <SelectItem key={font.id} value={font.font_name}>
                        {font.font_name} {font.price > 0 && `($${font.price})`}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white/70 text-xs">Size</Label>
              <Input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                min="12"
                max="144"
                className="mt-2 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white/70 text-xs">Color</Label>
              <Input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="mt-2 bg-white/5 border-white/10 h-10"
              />
            </div>
          </div>

          <Button onClick={handleAddText} className="w-full bg-[#f5a623]">
            <Type className="w-4 h-4 mr-2" />
            Add Text to Timeline
          </Button>
        </TabsContent>

        <TabsContent value="stickers" className="mt-4">
          <div className="text-center text-white/60 py-8">
            <Sticker className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Sticker library coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="gifs" className="mt-4">
          <div className="space-y-4">
            <div>
              <Label className="text-white/70 text-xs">Upload GIF</Label>
              <Input
                type="file"
                accept="image/gif"
                onChange={handleUploadGif}
                className="mt-2 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="text-white/60 text-xs text-center py-4">
              Or search GIPHY library (coming soon)
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}