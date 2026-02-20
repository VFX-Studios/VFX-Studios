import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Upload, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import AdDisplay from '@/components/Ads/AdDisplay';
import SEOHead from '@/components/seo/SEOHead';
import FeaturedAssets from '@/components/marketplace/FeaturedAssets';
import MarketplaceAssetCard from '@/components/marketplace/MarketplaceAssetCard';
import AnimatedGridBackground from '@/components/backgrounds/AnimatedGridBackground';
import LoopPreviewGrid from '@/components/visual/LoopPreviewGrid';

export default function Marketplace() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        const subs = await base44.entities.Subscription.filter({ user_id: userData.id });
        setSubscription(subs[0] || { tier: 'free' });
      } catch (error) {
        // Not logged in
      }
    };
    fetchUser();
  }, []);

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['marketplace-assets', categoryFilter],
    queryFn: async () => {
      const filter = categoryFilter === 'all' ? { status: 'approved' } : { status: 'approved', category: categoryFilter };
      return await base44.entities.MarketplaceAsset.filter(filter, '-created_date', 50);
    }
  });

  const handleSubmitAsset = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to submit assets');
      return;
    }

    setSubmitting(true);

    try {
      // CRITICAL: Validate seller eligibility (premium members only)
      const validation = await base44.functions.invoke('marketplace-validate-seller', {});
      
      if (!validation.data.canSell) {
        toast.error(validation.data.message || 'You must be a premium member to sell assets');
        setSubmitDialogOpen(false);
        setSubmitting(false);
        return;
      }

      const formData = new FormData(e.target);
      const response = await base44.functions.invoke('marketplace-submit-asset', {
        title: formData.get('title'),
        description: formData.get('description'),
        price: formData.get('price'),
        category: formData.get('category'),
        tags: formData.get('tags')?.split(',').map(t => t.trim()) || [],
        preview_file: formData.get('preview'),
        asset_file: formData.get('asset')
      });

      if (response.data?.success) {
        toast.success(response.data.message);
        setSubmitDialogOpen(false);
        e.target.reset();
      }
    } catch (error) {
      toast.error('Failed to submit asset');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePurchase = async (assetId) => {
    if (!user) {
      toast.error('Please log in to purchase');
      return;
    }

    try {
      const response = await base44.functions.invoke('marketplace-purchase-asset', {
        asset_id: assetId
      });

      if (response.data?.checkout_url) {
        if (window.self !== window.top) {
          toast.error('Purchase only works in published apps');
          return;
        }
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      toast.error('Purchase failed');
    }
  };

  const filteredAssets = assets.filter(asset =>
    asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050510] p-6 relative">
      <AnimatedGridBackground style="ai" />
      <SEOHead
        title="VFX Asset Marketplace - Buy & Sell Visual Effects"
        description="Discover premium VFX assets, shaders, animations, and presets from top creators. Buy or sell visual effects for live performances."
        keywords="vfx marketplace, visual effects assets, vj assets, buy shaders, sell animations"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "VFX Asset Marketplace",
          "description": "Buy and sell professional VFX assets for live performances"
        }}
      />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-white mb-2">Asset Marketplace</h1>
          <p className="text-white/60">Discover and purchase premium VFX assets from the community</p>
        </div>

        {/* Ad for Free Users */}
        {subscription?.tier === 'free' && (
          <div className="mb-6">
            <AdDisplay placementId="marketplace_top_banner" variant="banner" />
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48 bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a0a3e] border-white/10">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="shader">Shaders</SelectItem>
              <SelectItem value="animation">Animations</SelectItem>
              <SelectItem value="loop">Loops</SelectItem>
              <SelectItem value="ai_art">AI Art</SelectItem>
              <SelectItem value="preset">Presets</SelectItem>
              <SelectItem value="effect">Effects</SelectItem>
            </SelectContent>
          </Select>
          
          {user && (
            <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-[#f5a623] to-[#e91e8c]">
                  <Upload className="w-4 h-4 mr-2" />
                  Sell Your Assets
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a0a3e] border-white/10 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Submit Asset for Sale</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitAsset} className="space-y-4">
                  <div>
                    <Label className="text-white/70">Title</Label>
                    <Input name="title" required className="mt-2 bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <Label className="text-white/70">Description</Label>
                    <Textarea name="description" required className="mt-2 bg-white/5 border-white/10 text-white" rows={4} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/70">Price (USD)</Label>
                      <Input name="price" type="number" step="0.01" min="0.99" required className="mt-2 bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                      <Label className="text-white/70">Category</Label>
                      <Select name="category" required>
                        <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a0a3e] border-white/10">
                          <SelectItem value="shader">Shader</SelectItem>
                          <SelectItem value="animation">Animation</SelectItem>
                          <SelectItem value="loop">Loop</SelectItem>
                          <SelectItem value="ai_art">AI Art</SelectItem>
                          <SelectItem value="preset">Preset</SelectItem>
                          <SelectItem value="effect">Effect</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-white/70">Tags (comma separated)</Label>
                    <Input name="tags" placeholder="cyberpunk, neon, abstract" className="mt-2 bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <Label className="text-white/70">Preview Image/Video</Label>
                    <Input name="preview" type="file" accept="image/*,video/*" required className="mt-2 bg-white/5 border-white/10 text-white" />
                  </div>
                  <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-400/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-[#f5a623]" />
                      <span className="text-white font-semibold text-sm">AI-Powered Assistant</span>
                    </div>
                    <p className="text-white/70 text-xs mb-3">
                      Let AI analyze your asset and suggest optimal pricing, tags, and description
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-purple-400/30 text-purple-300 hover:bg-purple-600/20"
                      onClick={async () => {
                        const preview = document.querySelector('input[name="preview"]').files[0];
                        if (!preview) {
                          toast.error('Upload a preview first');
                          return;
                        }
                        toast.info('Analyzing asset...');
                        // AI analysis would happen here
                      }}
                    >
                      ✨ Get AI Suggestions
                    </Button>
                  </div>
                  <div>
                    <Label className="text-white/70">Full Asset File</Label>
                    <Input name="asset" type="file" required className="mt-2 bg-white/5 border-white/10 text-white" />
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-blue-300 text-sm">
                      Platform fee: 20% • You keep 80% of sales • Assets are reviewed before publication
                    </p>
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#f5a623]">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Submit for Review
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Featured Assets Section */}
        <FeaturedAssets onPurchase={handlePurchase} />

        {/* Assets Grid */}
        <h2 className="text-2xl font-semibold text-white mb-6">All Assets</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#f5a623] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => (
              <MarketplaceAssetCard 
                key={asset.id} 
                asset={asset} 
                onPurchase={handlePurchase}
              />
            ))}
          </div>
        )}

        {filteredAssets.length === 0 && !isLoading && (
          <div className="text-center py-20 text-white/40">
            <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No assets found matching your search</p>
          </div>
        )}

        {/* Live Loop Previews */}
        <div className="mt-14">
          <h2 className="text-2xl font-semibold text-white mb-3">Live Loop Previews</h2>
          <p className="text-white/60 mb-4">Beat-synced clips optimized for LED walls and festival rigs.</p>
          <LoopPreviewGrid />
        </div>
      </div>
    </div>
  );
}
