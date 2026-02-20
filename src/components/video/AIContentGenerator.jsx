import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIContentGenerator({ projectId }) {
  const [loading, setLoading] = useState(false);
  const [socialCopy, setSocialCopy] = useState(null);
  const [thumbnails, setThumbnails] = useState(null);
  const [seoData, setSeoData] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleGenerateSocialCopy = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generate-social-copy', {
        video_project_id: projectId,
        platforms: ['youtube', 'tiktok', 'instagram']
      });
      setSocialCopy(response.data.copy_variations);
      toast.success('Social media copy generated!');
    } catch (error) {
      toast.error('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateThumbnails = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generate-thumbnail-suggestions', {
        video_project_id: projectId,
        platform: 'youtube'
      });
      setThumbnails(response.data.generated_thumbnails);
      toast.success('Thumbnails generated!');
    } catch (error) {
      toast.error('Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeSEO = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('optimize-video-seo', {
        video_project_id: projectId,
        platform: 'youtube'
      });
      setSeoData(response.data.optimized);
      toast.success(`SEO score: ${response.data.optimized.seo_score}/100`);
    } catch (error) {
      toast.error('Optimization failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-400/30 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-purple-400" />
        <h3 className="text-white font-semibold text-lg">AI Content Generator</h3>
      </div>

      <Tabs defaultValue="social" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-black/20">
          <TabsTrigger value="social">Social Copy</TabsTrigger>
          <TabsTrigger value="thumbnails">Thumbnails</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="social" className="mt-4">
          {!socialCopy ? (
            <div className="text-center py-8">
              <p className="text-white/60 mb-4 text-sm">
                Generate viral social media copy for YouTube, TikTok, and Instagram
              </p>
              <Button onClick={handleGenerateSocialCopy} disabled={loading} className="bg-purple-500">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate Copy
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(socialCopy).map(([platform, variations]) => (
                <div key={platform}>
                  <div className="text-white/80 font-semibold text-sm mb-2 capitalize">{platform}</div>
                  {variations.slice(0, 3).map((variation, i) => (
                    <div key={i} className="bg-black/20 rounded-lg p-3 mb-2">
                      <div className="text-white text-sm mb-2">
                        {variation.title || variation.caption || variation.thread?.[0]}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-500/20 text-purple-300 text-xs">
                          {variation.hook_type}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(variation.title || variation.caption, `${platform}-${i}`)}
                          className="ml-auto text-white/60 hover:text-white"
                        >
                          {copiedIndex === `${platform}-${i}` ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="thumbnails" className="mt-4">
          {!thumbnails ? (
            <div className="text-center py-8">
              <p className="text-white/60 mb-4 text-sm">
                AI-generated thumbnail suggestions based on trending styles
              </p>
              <Button onClick={handleGenerateThumbnails} disabled={loading} className="bg-purple-500">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                Generate Thumbnails
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {thumbnails.map((thumb, i) => (
                <div key={i} className="bg-black/20 rounded-lg p-3">
                  <img src={thumb.thumbnail_url} alt={thumb.text_overlay} className="w-full h-32 object-cover rounded mb-2" />
                  <div className="text-white text-xs font-semibold mb-1">{thumb.text_overlay}</div>
                  <div className="text-white/40 text-xs">{thumb.style}</div>
                  <Badge className="bg-green-500/20 text-green-300 text-xs mt-2">
                    CTR: {(thumb.predicted_ctr * 100).toFixed(1)}%
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="seo" className="mt-4">
          {!seoData ? (
            <div className="text-center py-8">
              <p className="text-white/60 mb-4 text-sm">
                Optimize titles, descriptions, and tags for maximum visibility
              </p>
              <Button onClick={handleOptimizeSEO} disabled={loading} className="bg-purple-500">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Optimize SEO
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-black/20 rounded-lg p-4">
                <div className="text-white/60 text-xs mb-2">SEO Score</div>
                <div className="text-3xl font-bold text-green-400">{seoData.seo_score}/100</div>
              </div>
              <div>
                <div className="text-white/80 font-semibold text-sm mb-2">Optimized Titles</div>
                {seoData.optimized_titles?.slice(0, 3).map((title, i) => (
                  <div key={i} className="bg-black/20 rounded p-3 mb-2 flex items-center justify-between">
                    <span className="text-white text-sm">{title}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(title, `title-${i}`)}
                      className="text-white/60 hover:text-white"
                    >
                      {copiedIndex === `title-${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                ))}
              </div>
              <div>
                <div className="text-white/80 font-semibold text-sm mb-2">Keywords</div>
                <div className="flex flex-wrap gap-2">
                  {seoData.keywords?.slice(0, 10).map((keyword, i) => (
                    <Badge key={i} className="bg-blue-500/20 text-blue-300">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}