import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Instagram, Twitter, Youtube, Loader2, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function Portfolio() {
  const [currentUser, setCurrentUser] = useState(null);
  const username = new URLSearchParams(window.location.search).get('username');

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ['portfolio', username],
    queryFn: async () => {
      const portfolios = await base44.entities.UserPortfolio.filter({ username });
      if (portfolios[0]) {
        // Increment view count
        await base44.entities.UserPortfolio.update(portfolios[0].id, {
          view_count: (portfolios[0].view_count || 0) + 1
        });
      }
      return portfolios[0];
    },
    enabled: !!username
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['portfolio-assets', portfolio?.user_id],
    queryFn: () => base44.entities.VisualAsset.filter({ 
      user_id: portfolio.user_id,
      is_public: true 
    }, '-created_date', 50),
    enabled: !!portfolio?.user_id
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['portfolio-achievements', portfolio?.user_id],
    queryFn: () => base44.entities.UserAchievement.filter({ 
      user_id: portfolio.user_id,
      is_showcased: true 
    }),
    enabled: !!portfolio?.user_id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#f5a623] animate-spin" />
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">Portfolio not found</h1>
          <Link to={createPageUrl('Dashboard')}>
            <Button className="bg-[#f5a623]">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.id === portfolio.user_id;

  return (
    <div className="min-h-screen bg-[#050510]">
      {/* Banner */}
      <div className="h-64 bg-gradient-to-br from-purple-900/40 to-pink-900/40 relative">
        {portfolio.banner_url && (
          <img src={portfolio.banner_url} alt="Banner" className="w-full h-full object-cover opacity-60" />
        )}
      </div>

      {/* Profile Section */}
      <div className="max-w-6xl mx-auto px-6 -mt-20 relative">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end mb-8">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full border-4 border-[#050510] bg-gradient-to-br from-[#f5a623] to-[#e91e8c] overflow-hidden">
            {portfolio.avatar_url ? (
              <img src={portfolio.avatar_url} alt={portfolio.display_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                {portfolio.display_name?.charAt(0) || 'U'}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{portfolio.display_name}</h1>
                <p className="text-white/60">@{portfolio.username}</p>
              </div>
              {isOwner && (
                <Link to={createPageUrl('Dashboard') + '?tab=portfolio'}>
                  <Button size="sm" className="bg-white/10 hover:bg-white/20 text-white">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Portfolio
                  </Button>
                </Link>
              )}
            </div>
            {portfolio.bio && (
              <p className="text-white/80 mb-4">{portfolio.bio}</p>
            )}
            {/* Stats */}
            <div className="flex gap-6 text-sm">
              <div>
                <span className="text-white font-semibold">{assets.length}</span>
                <span className="text-white/60 ml-1">Creations</span>
              </div>
              <div>
                <span className="text-white font-semibold">{portfolio.stats?.marketplace_sales || 0}</span>
                <span className="text-white/60 ml-1">Sales</span>
              </div>
              <div>
                <span className="text-white font-semibold">{portfolio.view_count || 0}</span>
                <span className="text-white/60 ml-1">Views</span>
              </div>
            </div>
            {/* Social Links */}
            {portfolio.social_links && (
              <div className="flex gap-3 mt-4">
                {portfolio.social_links.instagram && (
                  <a href={portfolio.social_links.instagram} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="border-white/20 text-white">
                      <Instagram className="w-4 h-4" />
                    </Button>
                  </a>
                )}
                {portfolio.social_links.twitter && (
                  <a href={portfolio.social_links.twitter} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="border-white/20 text-white">
                      <Twitter className="w-4 h-4" />
                    </Button>
                  </a>
                )}
                {portfolio.social_links.youtube && (
                  <a href={portfolio.social_links.youtube} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="border-white/20 text-white">
                      <Youtube className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl text-white font-semibold mb-4">Achievements</h2>
            <div className="flex gap-3 flex-wrap">
              {achievements.map(ach => (
                <Badge key={ach.id} className="bg-gradient-to-r from-[#f5a623] to-[#e91e8c] text-white px-4 py-2">
                  <Star className="w-4 h-4 mr-2" />
                  {ach.achievement_key}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {assets.map((asset, index) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 rounded-xl border border-white/10 overflow-hidden hover:border-[#f5a623]/50 transition-all group"
            >
              <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-pink-900/20 overflow-hidden">
                {asset.thumbnail_url || asset.file_url ? (
                  <img 
                    src={asset.thumbnail_url || asset.file_url} 
                    alt={asset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : null}
              </div>
              <div className="p-4">
                <h3 className="text-white font-semibold mb-2 line-clamp-1">{asset.name}</h3>
                {asset.description && (
                  <p className="text-white/60 text-sm line-clamp-2">{asset.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}