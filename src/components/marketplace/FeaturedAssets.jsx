import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, TrendingUp, Award, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FeaturedAssets({ onPurchase }) {
  const { data: featuredAssets = [], isLoading } = useQuery({
    queryKey: ['featured-assets'],
    queryFn: async () => {
      // Get top-rated and sponsored assets
      const assets = await base44.entities.MarketplaceAsset.filter(
        { status: 'approved' },
        '-rating',
        6
      );
      return assets;
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-6 h-6 text-[#f5a623]" />
        <h2 className="text-2xl font-semibold text-white">Featured Assets</h2>
        <Badge className="bg-gradient-to-r from-[#f5a623] to-[#e91e8c] text-white">
          Curated
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredAssets.map((asset, index) => (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-[#f5a623]/30 overflow-hidden hover:border-[#f5a623] transition-all group">
              {/* Preview */}
              <div className="aspect-video bg-black/30 relative overflow-hidden">
                {asset.preview_url && (
                  <img
                    src={asset.preview_url}
                    alt={asset.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="absolute top-2 left-2">
                  <Badge className="bg-[#f5a623] text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className="bg-white/20 backdrop-blur-sm text-white">
                    {asset.category}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-white font-semibold text-lg mb-2 line-clamp-1">
                  {asset.title}
                </h3>
                <p className="text-white/60 text-sm mb-4 line-clamp-2">
                  {asset.description}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-white/40 text-xs">
                  {asset.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {asset.rating.toFixed(1)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3" />
                    {asset.purchase_count || 0} sales
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Trending
                  </span>
                </div>

                {/* Price & Purchase */}
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">
                    ${asset.price}
                  </div>
                  <Button
                    onClick={() => onPurchase && onPurchase(asset.id)}
                    className="bg-gradient-to-r from-[#f5a623] to-[#e91e8c] hover:opacity-90"
                  >
                    Buy Now
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}