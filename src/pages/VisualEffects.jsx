import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

// SEO Content Hub: /visual-effects/[category]/[effect-name]
export default function VisualEffects() {
  const category = new URLSearchParams(window.location.search).get('category') || 'all';
  const effectName = new URLSearchParams(window.location.search).get('effect');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tutorials = [] } = useQuery({
    queryKey: ['effect-tutorials', category],
    queryFn: () => base44.entities.Tutorial.filter({ 
      category: category !== 'all' ? category : undefined,
      is_published: true 
    })
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['effect-assets', category],
    queryFn: () => base44.entities.MarketplaceAsset.filter({ 
      category: category !== 'all' ? category : undefined,
      status: 'approved' 
    })
  });

  const categories = [
    { slug: 'cyberpunk', name: 'Cyberpunk', keywords: 'neon, futuristic, digital' },
    { slug: 'abstract', name: 'Abstract', keywords: 'geometric, fluid, shapes' },
    { slug: 'particle-effects', name: 'Particle Effects', keywords: 'particles, explosions, trails' },
    { slug: 'glitch', name: 'Glitch Art', keywords: 'distortion, digital artifacts' },
    { slug: 'fractal', name: 'Fractals', keywords: 'mathematical, recursive, patterns' },
    { slug: 'led-wall', name: 'LED Wall', keywords: 'large-format, venue, display' }
  ];

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        {/* SEO-Optimized Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-3">
            {effectName || 'Visual Effects'} {category !== 'all' ? `- ${category}` : ''} | VFX Studio Generator
          </h1>
          <p className="text-white/70 text-lg">
            Professional {category} VFX tutorials, templates, and marketplace assets. 
            Create stunning visuals for live performances, festivals, and events.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <Input
            placeholder="Search VFX effects, tutorials, assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-white/5 border-white/10 text-white"
          />
        </div>

        {/* Category Navigation */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
          {categories.map(cat => (
            <Link key={cat.slug} to={`${createPageUrl('VisualEffects')}?category=${cat.slug}`}>
              <Badge className={category === cat.slug 
                ? 'bg-[#f5a623] text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
              }>
                {cat.name}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Featured Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#f5a623]" />
            Trending {category !== 'all' ? category : 'Effects'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tutorials.slice(0, 3).map(tutorial => (
              <Card key={tutorial.id} className="bg-white/5 border-white/10 p-5">
                <h3 className="text-white font-semibold mb-2">{tutorial.title}</h3>
                <p className="text-white/60 text-sm">{tutorial.description}</p>
                <Link to={createPageUrl('TutorialDetail') + `?slug=${tutorial.slug}`}>
                  <Button className="mt-4 bg-[#f5a623]">View Tutorial</Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Marketplace Assets */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-4">Premium Assets</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {assets.slice(0, 8).map(asset => (
              <Card key={asset.id} className="bg-white/5 border-white/10 p-4">
                <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded mb-3">
                  {asset.preview_url && (
                    <img src={asset.preview_url} alt={asset.title} className="w-full h-full object-cover rounded" />
                  )}
                </div>
                <h4 className="text-white text-sm font-medium mb-2">{asset.title}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-[#f5a623] font-bold">${asset.price}</span>
                  <Link to={createPageUrl('Marketplace')}>
                    <Button size="sm" className="bg-[#f5a623]">View</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* SEO Content */}
        <div className="mt-12 prose prose-invert max-w-none">
          <h2 className="text-white">How to Create {category !== 'all' ? category : 'VFX'} Effects</h2>
          <p className="text-white/70">
            Learn professional techniques for creating stunning {category} visual effects for live performances.
            Our AI-powered tools and expert tutorials make it easy to generate high-quality VFX assets.
          </p>
        </div>
      </div>
    </div>
  );
}