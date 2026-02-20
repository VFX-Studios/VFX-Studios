import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowLeft, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReactMarkdown from 'react-markdown';
import AdDisplay from '@/components/Ads/AdDisplay';
import { toast } from 'sonner';
import SEOHead from '@/components/seo/SEOHead';

export default function BlogPost() {
  const [subscription, setSubscription] = useState(null);
  const slug = new URLSearchParams(window.location.search).get('slug');

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

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      const posts = await base44.entities.BlogPost.filter({ slug, published: true });
      if (posts[0]) {
        // Increment view count
        await base44.entities.BlogPost.update(posts[0].id, {
          view_count: (posts[0].view_count || 0) + 1
        });
      }
      return posts[0];
    },
    enabled: !!slug
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f5a623]"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">Post not found</h1>
          <Link to={createPageUrl('Blog')}>
            <Button className="bg-[#f5a623]">Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510]">
      <SEOHead
        title={post.title}
        description={post.excerpt}
        keywords={post.tags?.join(', ')}
        ogImage={post.featured_image_url}
        type="article"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "description": post.excerpt,
          "datePublished": post.published_at,
          "author": {
            "@type": "Organization",
            "name": "VFX Studios"
          }
        }}
      />
      {/* Header Image */}
      <div className="h-96 bg-gradient-to-br from-purple-900/40 to-pink-900/40 relative">
        {post.featured_image_url && (
          <img 
            src={post.featured_image_url} 
            alt={post.title}
            className="w-full h-full object-cover opacity-60"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050510] to-transparent"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-32 relative">
        {/* Back Button */}
        <Link to={createPageUrl('Blog')}>
          <Button variant="ghost" className="text-white/70 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        {/* Article Card */}
        <article className="bg-[#1a0a3e]/80 backdrop-blur-sm border border-white/10 rounded-xl p-8 md:p-12">
          {/* Category Badge */}
          <Badge className="bg-[#f5a623] text-white mb-4">
            {post.category.replace('_', ' ')}
          </Badge>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-6 text-white/40 text-sm mb-8 pb-8 border-b border-white/10">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(post.published_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {post.reading_time_minutes || 5} min read
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShare}
              className="text-white/40 hover:text-white ml-auto"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Ad for Free Users - Mid Article */}
          {subscription?.tier === 'free' && (
            <div className="my-8">
              <AdDisplay placementId="blog_mid_article" variant="banner" />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-3xl font-bold text-white mt-8 mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-2xl font-semibold text-white mt-6 mb-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-semibold text-white mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="text-white/80 leading-relaxed mb-4">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside text-white/80 mb-4 space-y-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside text-white/80 mb-4 space-y-2">{children}</ol>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-[#f5a623] pl-4 italic text-white/60 my-4">
                    {children}
                  </blockquote>
                ),
                code: ({ inline, children }) => inline ? (
                  <code className="bg-white/10 px-2 py-1 rounded text-[#f5a623] text-sm">{children}</code>
                ) : (
                  <pre className="bg-white/5 p-4 rounded-lg overflow-x-auto mb-4">
                    <code className="text-white/90 text-sm">{children}</code>
                  </pre>
                )
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="bg-white/5 text-white/70 border-white/10">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Ad for Free Users - Bottom */}
        {subscription?.tier === 'free' && (
          <div className="my-8">
            <AdDisplay placementId="blog_bottom" variant="banner" />
          </div>
        )}
      </div>
    </div>
  );
}