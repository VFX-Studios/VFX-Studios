import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Play, Volume2, VolumeX } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function VideoAdDisplay({ 
  open, 
  onClose, 
  onRewardClaimed, 
  type = 'interstitial' // 'interstitial' or 'rewarded'
}) {
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [muted, setMuted] = useState(false);
  const [adWatched, setAdWatched] = useState(false);

  useEffect(() => {
    if (!open) {
      setCountdown(5);
      setCanSkip(false);
      setAdWatched(false);
      return;
    }

    // Track ad impression
    base44.analytics.track({
      eventName: 'video_ad_impression',
      properties: { ad_type: type }
    });

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          setAdWatched(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, type]);

  const handleClose = () => {
    if (adWatched && type === 'rewarded' && onRewardClaimed) {
      onRewardClaimed();
    }
    
    base44.analytics.track({
      eventName: 'video_ad_closed',
      properties: { 
        ad_type: type, 
        watched_fully: adWatched 
      }
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && canSkip && handleClose()}>
      <DialogContent className="bg-black border-none max-w-4xl p-0">
        {/* Ad Video Placeholder */}
        <div className="relative aspect-video bg-gradient-to-br from-purple-900 to-pink-900">
          {/* Simulated Video Ad */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Play className="w-24 h-24 text-white/40 mx-auto mb-4" />
              <p className="text-white text-xl font-semibold">VFX Studios Premium</p>
              <p className="text-white/60 mt-2">Unlock unlimited AI generations</p>
            </div>
          </div>

          {/* Skip Button */}
          {canSkip ? (
            <Button
              onClick={handleClose}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white"
              size="sm"
            >
              <X className="w-4 h-4 mr-2" />
              {type === 'rewarded' ? 'Claim Reward' : 'Skip Ad'}
            </Button>
          ) : (
            <div className="absolute top-4 right-4 bg-black/60 text-white px-4 py-2 rounded-lg text-sm">
              Skip in {countdown}s
            </div>
          )}

          {/* Mute Toggle */}
          <button
            onClick={() => setMuted(!muted)}
            className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-colors"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Ad Label */}
          <div className="absolute bottom-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded text-xs font-bold">
            ADVERTISEMENT
          </div>
        </div>

        {/* Reward Info for Rewarded Ads */}
        {type === 'rewarded' && (
          <div className="p-4 bg-gradient-to-r from-[#f5a623]/20 to-[#e91e8c]/20 border-t border-white/10">
            <p className="text-white text-center text-sm">
              {adWatched 
                ? '🎉 Reward unlocked! Close to claim your bonus.' 
                : '⏱️ Watch the full ad to earn your reward'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}