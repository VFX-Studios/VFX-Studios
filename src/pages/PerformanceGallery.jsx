import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Heart, Eye, Share2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function PerformanceGallery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');

  const { data: performances = [] } = useQuery({
    queryKey: ['performances', genreFilter],
    queryFn: async () => {
      const filter = genreFilter === 'all' ? { is_public: true } : { is_public: true, genre: genreFilter };
      return await base44.entities.PerformanceGallery.filter(filter, '-view_count', 50);
    }
  });

  const genres = ['all', 'techno', 'house', 'dubstep', 'trance', 'ambient'];

  const filteredPerformances = performances.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShare = (performance) => {
    const shareUrl = `${window.location.origin}${createPageUrl('PerformanceDetail')}?id=${performance.id}`;
    navigator.clipboard.writeText(shareUrl);
    // Also trigger social share dialog
  };

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Performance Gallery</h1>
          <p className="text-white/60">Discover amazing VJ performances from around the world</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              placeholder="Search performances..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white/5 border-white/10 text-white"
            />
          </div>
          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a0a3e] border-white/10">
              {genres.map(g => (
                <SelectItem key={g} value={g}>{g === 'all' ? 'All Genres' : g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Performance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredPerformances.map(perf => (
            <Card key={perf.id} className="bg-white/5 border-white/10 overflow-hidden group">
              <div className="aspect-video bg-gradient-to-br from-purple-900/40 to-pink-900/40 relative">
                {perf.thumbnail_url && (
                  <img src={perf.thumbnail_url} alt={perf.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Link to={createPageUrl('PerformanceDetail') + `?id=${perf.id}`}>
                    <Button size="lg" className="bg-[#f5a623] rounded-full w-16 h-16">
                      <Play className="w-6 h-6" />
                    </Button>
                  </Link>
                </div>
                {perf.featured && (
                  <Badge className="absolute top-2 left-2 bg-[#f5a623]">Featured</Badge>
                )}
              </div>

              <div className="p-5">
                <h3 className="text-white font-semibold mb-2 line-clamp-1">{perf.title}</h3>
                
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-purple-500/20 text-purple-300">{perf.genre}</Badge>
                  {perf.festival_name && (
                    <Badge className="bg-blue-500/20 text-blue-300">{perf.festival_name}</Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-white/40 text-sm">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {perf.view_count || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {perf.like_count || 0}
                  </span>
                  <button onClick={() => handleShare(perf)} className="ml-auto hover:text-white transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}