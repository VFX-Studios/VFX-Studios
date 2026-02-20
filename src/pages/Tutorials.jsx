import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Plus, BookOpen, Download, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Tutorials() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: tutorials = [], isLoading } = useQuery({
    queryKey: ['tutorials', categoryFilter],
    queryFn: async () => {
      const filter = categoryFilter === 'all' 
        ? { is_published: true }
        : { is_published: true, category: categoryFilter };
      return await base44.entities.Tutorial.filter(filter, '-view_count', 50);
    }
  });

  const categories = [
    { id: 'all', label: 'All Tutorials' },
    { id: 'beginner', label: 'Beginner' },
    { id: 'effects', label: 'Effects' },
    { id: 'animations', label: 'Animations' },
    { id: 'shaders', label: 'Shaders' },
    { id: 'ai_tips', label: 'AI Tips' }
  ];

  const filteredTutorials = tutorials.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-white mb-2">VFX Tutorials</h1>
            <p className="text-white/60">Learn from the community, earn by teaching</p>
          </div>
          {user && (
            <Link to={createPageUrl('Dashboard') + '?tab=create-tutorial'}>
              <Button className="bg-gradient-to-r from-[#f5a623] to-[#e91e8c]">
                <Plus className="w-4 h-4 mr-2" />
                Create Tutorial
              </Button>
            </Link>
          )}
        </div>

        {/* Search & Filters */}
        <div className="mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              placeholder="Search tutorials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white/5 border-white/10 text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <Button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                variant={categoryFilter === cat.id ? 'default' : 'outline'}
                size="sm"
                className={categoryFilter === cat.id
                  ? 'bg-[#f5a623]'
                  : 'border-white/20 text-white/70 hover:text-white'
                }
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Tutorials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredTutorials.map(tutorial => (
            <Link key={tutorial.id} to={createPageUrl('TutorialDetail') + `?slug=${tutorial.slug}`}>
              <Card className="bg-white/5 border-white/10 overflow-hidden hover:border-[#f5a623]/30 transition-all cursor-pointer">
                <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                  {tutorial.preview_image_url && (
                    <img 
                      src={tutorial.preview_image_url} 
                      alt={tutorial.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-[#f5a623]/20 text-[#f5a623]">
                      {tutorial.difficulty}
                    </Badge>
                    {!tutorial.is_free && (
                      <Badge className="bg-green-500/20 text-green-400">
                        ${tutorial.price}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                    {tutorial.title}
                  </h3>
                  <p className="text-white/60 text-sm mb-4 line-clamp-2">
                    {tutorial.description}
                  </p>
                  <div className="flex items-center gap-4 text-white/40 text-xs">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {tutorial.view_count || 0} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {tutorial.download_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {tutorial.like_count || 0}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}