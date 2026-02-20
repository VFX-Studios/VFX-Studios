import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Heart, Eye, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SEOHead from '@/components/seo/SEOHead';
import { toast } from 'sonner';

export default function TutorialDetail() {
  const slug = new URLSearchParams(window.location.search).get('slug');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: tutorial, isLoading } = useQuery({
    queryKey: ['tutorial', slug],
    queryFn: async () => {
      const tutorials = await base44.entities.Tutorial.filter({ slug, is_published: true });
      if (tutorials[0]) {
        // Increment view count
        await base44.entities.Tutorial.update(tutorials[0].id, {
          view_count: (tutorials[0].view_count || 0) + 1
        });
      }
      return tutorials[0];
    },
    enabled: !!slug
  });

  const handleDownload = async () => {
    if (!tutorial) return;
    
    await base44.entities.Tutorial.update(tutorial.id, {
      download_count: (tutorial.download_count || 0) + 1
    });
    
    // Award creator 15% of sale price
    if (!tutorial.is_free && tutorial.price > 0) {
      const creatorEarnings = tutorial.price * 0.15;
      // Process payment and credit creator
    }
    
    toast.success('Tutorial downloaded!');
  };

  if (isLoading || !tutorial) {
    return <div className="min-h-screen bg-[#050510] flex items-center justify-center">
      <span className="text-white">Loading...</span>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <SEOHead
        title={tutorial.title}
        description={tutorial.description}
        keywords={tutorial.tags?.join(', ')}
        ogImage={tutorial.preview_image_url}
        type="article"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": tutorial.title,
          "description": tutorial.description,
          "step": tutorial.steps?.map((step, i) => ({
            "@type": "HowToStep",
            "name": `Step ${i + 1}`,
            "text": step.description
          }))
        }}
      />

      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl('Tutorials')}>
          <Button variant="ghost" className="text-white/60 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tutorials
          </Button>
        </Link>

        <Card className="bg-white/5 border-white/10 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-[#f5a623]">{tutorial.difficulty}</Badge>
            {!tutorial.is_free && (
              <Badge className="bg-green-500">${tutorial.price}</Badge>
            )}
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">{tutorial.title}</h1>
          <p className="text-white/70 mb-6">{tutorial.description}</p>

          <div className="flex items-center gap-6 text-white/40 text-sm mb-8">
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              {tutorial.view_count || 0} views
            </span>
            <span className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              {tutorial.download_count || 0} downloads
            </span>
            <span className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              {tutorial.like_count || 0} likes
            </span>
          </div>

          {/* Steps */}
          <div className="space-y-6 mb-8">
            {tutorial.steps?.map((step, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#f5a623] flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-white font-semibold text-lg">{step.title}</h3>
                </div>
                <p className="text-white/70">{step.description}</p>
                {step.image_url && (
                  <img src={step.image_url} alt={step.title} className="mt-4 rounded-lg" />
                )}
              </div>
            ))}
          </div>

          {/* Download Button */}
          <Button onClick={handleDownload} className="w-full bg-gradient-to-r from-[#f5a623] to-[#e91e8c]">
            <Download className="w-4 h-4 mr-2" />
            {tutorial.is_free ? 'Download Tutorial' : `Purchase for $${tutorial.price}`}
          </Button>
        </Card>
      </div>
    </div>
  );
}