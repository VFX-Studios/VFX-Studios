import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AnimatePresence } from 'framer-motion';
import SetOverview from '../components/storyboard/SetOverview';
import SongCard from '../components/storyboard/SongCard';
import SectionDivider from '../components/storyboard/SectionDivider';
import VJControlPanel from '../components/vj/VJControlPanel';
import AdDisplay from '@/components/Ads/AdDisplay';
import { Loader2 } from 'lucide-react';

export default function Storyboard() {
  const [vjPanelSong, setVjPanelSong] = useState(null);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const user = await base44.auth.me();
        const subscriptions = await base44.entities.Subscription.filter({ user_id: user.id });
        setSubscription(subscriptions[0] || { tier: 'free', status: 'active' });
      } catch (error) {
        // If not authenticated, treat as free user for ad purposes
        setSubscription({ tier: 'free', status: 'active' });
      }
    };
    fetchSubscription();
  }, []);

  const { data: songs, isLoading } = useQuery({
    queryKey: ['songs'],
    queryFn: () => base44.entities.Song.list('set_position', 100),
    initialData: [],
  });

  const sorted = [...songs].sort((a, b) => a.set_position - b.set_position);

  let currentSection = null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#f5a623] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#050510]">
        <SetOverview />

        <div className="max-w-4xl mx-auto px-4 md:px-6 pb-32">
          {/* Ad for Free Users - Storyboard Top */}
          {subscription?.tier === 'free' && (
            <div className="mb-6">
              <AdDisplay placementId="storyboard_interstitial" variant="banner" />
            </div>
          )}

          <div className="space-y-3">
            {sorted.map((song, index) => {
              const showSection = song.set_section !== currentSection && song.set_section !== 'encore';
              if (song.set_section !== 'encore') currentSection = song.set_section;
              const isEncoreStart = song.set_section === 'encore' && (index === 0 || sorted[index - 1]?.set_section !== 'encore');

              return (
                <React.Fragment key={song.id}>
                  {showSection && <SectionDivider section={song.set_section} />}
                  <SongCard 
                    song={song} 
                    index={index} 
                    isEncoreStart={isEncoreStart}
                    onOpenVJPanel={setVjPanelSong}
                  />
                </React.Fragment>
              );
            })}
          </div>

          {/* Footer */}
          <div className="text-center mt-24 pb-12">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto mb-6" />
            <p className="text-white/15 text-[10px] tracking-[0.5em] uppercase">
              ubiquitously nowhere — visual production storyboard
            </p>
            <p className="text-white/10 text-[10px] tracking-wider mt-2">
              Somewhere the Fractals Reside World Festival Tour
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {vjPanelSong && (
          <VJControlPanel 
            song={vjPanelSong}
            allSongs={sorted}
            onClose={() => setVjPanelSong(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}