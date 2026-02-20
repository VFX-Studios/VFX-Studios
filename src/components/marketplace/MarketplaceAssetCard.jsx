import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, Star, Check, Wand2 } from 'lucide-react';
import AssetReviews from './AssetReviews';
import StealThisLookModal from '@/components/features/StealThisLookModal';
import BeatMetadata from './BeatMetadata';

export default function MarketplaceAssetCard({ asset, onPurchase }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showStealLook, setShowStealLook] = useState(false);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: tiers = [] } = useQuery({
    queryKey: ['asset-tiers', asset.id],
    queryFn: () => base44.entities.AssetPackTier.filter({ marketplace_asset_id: asset.id })
  });

  const hasTiers = tiers.length > 0;
  const basePrice = hasTiers ? Math.min(...tiers.map(t => t.price)) : asset.price;

  return (
    <>
      <Card className="bg-white/5 border-white/10 overflow-hidden hover:border-[#f5a623]/30 transition-all cursor-pointer"
        onClick={() => setDetailsOpen(true)}
      >
        <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-pink-900/20 relative">
          {asset.preview_url && (
            <img src={asset.preview_url} alt={asset.title} className="w-full h-full object-cover" />
          )}
          <Badge className="absolute top-2 right-2 bg-[#f5a623] text-white">
            {asset.category}
          </Badge>
          {asset.rating && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
              <Star className="w-3 h-3 mr-1 fill-current" />
              {asset.rating.toFixed(1)}
            </Badge>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1">{asset.title}</h3>
          <p className="text-white/60 text-sm mb-2 line-clamp-2">{asset.description}</p>
          <BeatMetadata metadata={asset.metadata} />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">
                {hasTiers ? 'From ' : ''}${basePrice}
              </div>
              <div className="flex items-center gap-1 text-white/40 text-xs mt-1">
                <ShoppingCart className="w-3 h-3" />
                {asset.purchase_count || 0} sales
              </div>
            </div>
            {hasTiers && (
              <Badge className="bg-purple-500/20 text-purple-300">
                {tiers.length} Tiers
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Asset Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-[#1a0a3e] border-white/10 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">{asset.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Preview */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {asset.preview_url && (
                <img src={asset.preview_url} alt={asset.title} className="w-full h-full object-cover" />
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-white font-semibold mb-2">Description</h3>
              <p className="text-white/70">{asset.description}</p>
            </div>

            {/* Tiered Pricing */}
            {hasTiers ? (
              <div>
                <h3 className="text-white font-semibold mb-4">Choose Your Package</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tiers.map(tier => (
                    <Card key={tier.id} className={`p-5 ${
                      tier.is_most_popular 
                        ? 'bg-gradient-to-br from-[#f5a623]/20 to-[#e91e8c]/20 border-[#f5a623]/50' 
                        : 'bg-white/5 border-white/10'
                    }`}>
                      {tier.is_most_popular && (
                        <Badge className="mb-3 bg-[#f5a623]">⭐ Most Popular</Badge>
                      )}
                      <h4 className="text-white font-semibold text-lg mb-2">{tier.display_name}</h4>
                      <div className="text-3xl font-bold text-white mb-4">${tier.price}</div>
                      
                      <ul className="space-y-2 mb-4">
                        {tier.features?.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-white/70 text-sm">
                            <Check className="w-4 h-4 text-[#f5a623] mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => onPurchase(asset.id, tier.id)}
                        className="w-full bg-[#f5a623]"
                      >
                        Purchase {tier.tier_name}
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={() => setShowStealLook(true)}
                  variant="outline"
                  className="w-full border-[#f5a623]/30 text-[#f5a623]"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Steal This Look (Recreate for Free)
                </Button>
                <Button
                  onClick={() => onPurchase(asset.id)}
                  className="w-full bg-gradient-to-r from-[#f5a623] to-[#e91e8c]"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy Original for ${asset.price}
                </Button>
              </div>
            )}

            {/* Reviews Section */}
            <AssetReviews assetId={asset.id} userId={user?.id} />
          </div>
        </DialogContent>
      </Dialog>

      <StealThisLookModal
        asset={asset}
        open={showStealLook}
        onClose={() => setShowStealLook(false)}
      />
    </>
  );
}
