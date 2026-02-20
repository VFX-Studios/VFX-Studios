import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Clock, ArrowRight, TrendingUp, Sparkles, Music, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AdDisplay from '@/components/Ads/AdDisplay';
import SEOHead from '@/components/seo/SEOHead';

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subscription, setSubscription] = useState(null);

  React.useEffect(() => {
    const fetchSub = async () => {
      try {
        const user = await base44.auth.me();
        const subs = await base44.entities.Subscription.filter({ user_id: user.id });
        setSubscription(subs[0] || { tier: 'free' });
      } catch {
        setSubscription({ tier: 'free' });
      }
    };
    fetchSub();
  }, []);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts', categoryFilter],
    queryFn: async () => {
      const filter = categoryFilter === 'all' 
        ? { published: true } 
        : { published: true, category: categoryFilter };
      return await base44.entities.BlogPost.filter(filter, '-published_at', 50);
    }
  });

  const categories = [
    { id: 'all', name: 'All Posts', icon: Newspaper },
    { id: 'ai_generation', name: 'AI Generation', icon: Sparkles },
    { id: 'music_promotion', name: 'Music Promotion', icon: Music },
    { id: 'feature_updates', name: 'Feature Updates', icon: TrendingUp },
    { id: 'tutorials', name: 'Tutorials', icon: Calendar }
  ];

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredPost = filteredPosts[0];

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <SEOHead
        title="VFX Studios Blog - AI Generation Tips & Music Promotion"
        description="Expert insights on AI-powered visual effects, music promotion strategies, and platform updates for VJs and visual artists."
        keywords="vfx blog, ai generation tips, music promotion, vj tutorials, visual effects"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "VFX Studios Blog",
          "description": "Insights on AI-powered VFX and music promotion"
        }}
      />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light text-white mb-4">VFX Studios Blog</h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Insights on AI-powered visual effects, music promotion strategies, and platform updates
          </p>
        </div>

        {/* Ad for Free Users */}
        {subscription?.tier === 'free' && (
          <div className="mb-8">
            <AdDisplay placementId="blog_top_banner" variant="banner" />
          </div>
        )}

        {/* Search & Categories */}
        <div className="mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white/5 border-white/10 text-white h-12 text-lg"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            {categories.map(({ id, name, icon: Icon }) => (
              <Button
                key={id}
                onClick={() => setCategoryFilter(id)}
                variant={categoryFilter === id ? 'default' : 'outline'}
                className={categoryFilter === id 
                  ? 'bg-gradient-to-r from-[#f5a623] to-[#e91e8c] text-white' 
                  : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                }
              >
                <Icon className="w-4 h-4 mr-2" />
                {name}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <Link to={createPageUrl('BlogPost') + `?slug=${featuredPost.slug}`}>
            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-white/10 p-0 overflow-hidden mb-12 hover:border-[#f5a623]/30 transition-all cursor-pointer">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-video md:aspect-auto bg-gradient-to-br from-[#f5a623]/20 to-[#e91e8c]/20">
                  {featuredPost.featured_image_url && (
                    <img 
                      src={featuredPost.featured_image_url} 
                      alt={featuredPost.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-8 flex flex-col justify-center">
                  <Badge className="bg-[#f5a623] text-white w-fit mb-4">Featured</Badge>
                  <h2 className="text-3xl font-semibold text-white mb-4">{featuredPost.title}</h2>
                  <p className="text-white/70 mb-6 line-clamp-3">{featuredPost.excerpt}</p>
                  <div className="flex items-center gap-4 text-white/40 text-sm mb-6">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(featuredPost.published_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {featuredPost.reading_time_minutes || 5} min read
                    </span>
                  </div>
                  <Button className="bg-white/10 hover:bg-white/20 text-white w-fit">
                    Read More <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.slice(1).map((post) => (
            <Link key={post.id} to={createPageUrl('BlogPost') + `?slug=${post.slug}`}>
              <Card className="bg-white/5 border-white/10 overflow-hidden hover:border-[#f5a623]/30 transition-all cursor-pointer h-full">
                <div className="aspect-video bg-gradient-to-br from-purple-900/20 to-pink-900/20">
                  {post.featured_image_url && (
                    <img 
                      src={post.featured_image_url} 
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-6">
                  <Badge className="bg-[#f5a623]/20 text-[#f5a623] mb-3">
                    {post.category.replace('_', ' ')}
                  </Badge>
                  <h3 className="text-white font-semibold text-xl mb-3 line-clamp-2">{post.title}</h3>
                  <p className="text-white/60 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-white/40 text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.published_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.reading_time_minutes || 5} min
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