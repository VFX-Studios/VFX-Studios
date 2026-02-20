import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Share2, Loader2, Instagram, Music as TikTok, Youtube } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PromoVideoGenerator({ performanceId }) {
  const [generating, setGenerating] = useState(false);
  const [promoVideo, setPromoVideo] = useState(null);

  const generatePromo = async (format) => {
    setGenerating(true);
    try {
      const response = await base44.functions.invoke('generate-promo-video', {
        performance_id: performanceId,
        format
      });

      setPromoVideo(response.data);
      toast.success('15sec promo video created!');
    } catch (error) {
      toast.error('Video generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const shareToSocial = (platform) => {
    if (!promoVideo) return;
    
    window.open(promoVideo.share_links[platform], '_blank');
    toast.success(`Opening ${platform}...`);
  };

  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Video className="w-5 h-5 text-[#f5a623]" />
        <h3 className="text-white font-semibold text-lg">Promotional Video</h3>
      </div>

      {!promoVideo ? (
        <div className="space-y-4">
          <div className="text-white/70 text-sm mb-4">
            AI will extract the best 15 seconds from your performance and create a social-optimized promo video
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => generatePromo('tiktok')}
              disabled={generating}
              className="flex-1 bg-gradient-to-r from-[#00f2ea] to-[#ff0050]"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TikTok className="w-4 h-4 mr-2" />
              )}
              TikTok (9:16)
            </Button>
            <Button
              onClick={() => generatePromo('reels')}
              disabled={generating}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Instagram className="w-4 h-4 mr-2" />
              )}
              Reels (9:16)
            </Button>
          </div>

          <Badge className="bg-blue-500">Format: 1080×1920 vertical</Badge>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Video Preview */}
          <div className="aspect-[9/16] max-w-xs mx-auto bg-black rounded-lg overflow-hidden border-2 border-[#f5a623]">
            <video
              src={promoVideo.video_url}
              controls
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-center text-white/60 text-sm">
            Duration: {promoVideo.duration}s • Format: {promoVideo.format}
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => shareToSocial('tiktok')}
              className="bg-[#00f2ea] hover:bg-[#00d9d1]"
            >
              <TikTok className="w-4 h-4 mr-2" />
              Post to TikTok
            </Button>
            <Button
              onClick={() => shareToSocial('instagram')}
              className="bg-gradient-to-r from-purple-600 to-pink-600"
            >
              <Instagram className="w-4 h-4 mr-2" />
              Share to Reels
            </Button>
            <Button
              onClick={() => shareToSocial('youtube')}
              className="bg-red-600 hover:bg-red-700"
            >
              <Youtube className="w-4 h-4 mr-2" />
              Upload to YouTube
            </Button>
            <Button
              onClick={() => shareToSocial('twitter')}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Tweet
            </Button>
          </div>

          <Button
            onClick={() => setPromoVideo(null)}
            variant="outline"
            className="w-full border-white/20 text-white"
          >
            Generate New Video
          </Button>
        </div>
      )}
    </Card>
  );
}