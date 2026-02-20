import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function AdDisplay({ placementId, variant = 'banner' }) {
  const [adContent, setAdContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      setLoading(true);
      try {
        const response = await base44.functions.invoke('serve-ad', { placementId });
        if (response.data?.adHtml) {
          setAdContent(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch ad:', error);
        setAdContent(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAd();
  }, [placementId]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-white/5 rounded-lg ${variant === 'banner' ? 'h-24' : 'h-48'} w-full`}></div>
    );
  }

  if (!adContent || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    // Track dismissal for analytics
    base44.analytics.track({
      eventName: 'ad_dismissed',
      properties: { placement_id: placementId }
    });
  };

  return (
    <div className={`relative bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg border border-white/10 overflow-hidden ${variant === 'banner' ? 'p-4' : 'p-6'}`}>
      {/* Dismissible button for non-critical placements */}
      {variant === 'banner' && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Ad content */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">Sponsored</span>
            <ExternalLink className="w-3 h-3 text-white/40" />
          </div>
          <div 
            className="text-white/90 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: adContent.adHtml }} 
          />
        </div>
        
        {/* Upgrade CTA */}
        <Link to={createPageUrl('Pricing')}>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-gradient-to-r from-[#f5a623] to-[#e91e8c] border-0 text-white hover:opacity-90 whitespace-nowrap"
          >
            Go Ad-Free
          </Button>
        </Link>
      </div>

      {/* Bottom gradient accent */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f5a623] via-[#e91e8c] to-purple-600 opacity-30"></div>
    </div>
  );
}