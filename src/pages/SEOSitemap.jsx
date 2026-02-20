import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Auto-generated sitemap page for SEO
export default function SEOSitemap() {
  const { data: tutorials = [] } = useQuery({
    queryKey: ['sitemap-tutorials'],
    queryFn: () => base44.entities.Tutorial.filter({ is_published: true })
  });

  const { data: blogPosts = [] } = useQuery({
    queryKey: ['sitemap-blog'],
    queryFn: () => base44.entities.BlogPost.filter({ published: true })
  });

  const { data: portfolios = [] } = useQuery({
    queryKey: ['sitemap-portfolios'],
    queryFn: () => base44.entities.UserPortfolio.filter({ is_public: true })
  });

  const baseUrl = window.location.origin;

  const staticPages = [
    '/',
    '/marketplace',
    '/blog',
    '/tutorials',
    '/pricing',
    '/partnerships',
    '/achievements',
    '/leaderboards',
    '/performance-gallery',
    '/style-marketplace'
  ];

  const dynamicPages = [
    ...tutorials.map(t => `/tutorials/${t.slug}`),
    ...blogPosts.map(p => `/blog/${p.slug}`),
    ...portfolios.map(p => `/@${p.username}`)
  ];

  const allUrls = [...staticPages, ...dynamicPages];

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">VFX Studios - Sitemap</h1>
        <div className="space-y-1">
          {allUrls.map((url, i) => (
            <div key={i} className="text-blue-600 hover:underline">
              <a href={`${baseUrl}${url}`} target="_blank" rel="noopener noreferrer">
                {baseUrl}{url}
              </a>
            </div>
          ))}
        </div>
        <div className="mt-8 text-gray-600 text-sm">
          Total Pages: {allUrls.length}
        </div>
      </div>
    </div>
  );
}