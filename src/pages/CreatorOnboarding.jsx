import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, DollarSign, BookOpen } from 'lucide-react';
import CreatorOnboarding from '@/components/onboarding/CreatorOnboarding';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function CreatorOnboardingPage() {
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      const userData = await base44.auth.me();
      setUser(userData);

      const progress = await base44.entities.OnboardingProgress.filter({ 
        user_id: userData.id 
      });

      if (progress[0]?.creator_onboarding_completed) {
        setShowOnboarding(false);
      }
    };
    checkOnboarding().catch(() => {
      window.location.href = createPageUrl('Auth');
    });
  }, []);

  if (!showOnboarding) {
    return (
      <div className="min-h-screen bg-[#050510] p-6">
        <div className="max-w-4xl mx-auto text-center pt-20">
          <Sparkles className="w-16 h-16 text-[#f5a623] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-4">
            You're All Set! 🎉
          </h1>
          <p className="text-white/60 mb-8">
            Your creator profile is active. Start earning today!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link to={createPageUrl('StyleMarketplace')}>
              <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 p-6 hover:scale-105 transition-transform cursor-pointer">
                <TrendingUp className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Train AI Style</h3>
                <p className="text-white/60 text-sm">$0.99-4.99/use</p>
              </Card>
            </Link>

            <Link to={createPageUrl('Marketplace')}>
              <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30 p-6 hover:scale-105 transition-transform cursor-pointer">
                <DollarSign className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Sell Assets</h3>
                <p className="text-white/60 text-sm">70% revenue share</p>
              </Card>
            </Link>

            <Link to={createPageUrl('Tutorials')}>
              <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-500/30 p-6 hover:scale-105 transition-transform cursor-pointer">
                <BookOpen className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <h3 className="text-white font-semibold mb-2">Create Tutorials</h3>
                <p className="text-white/60 text-sm">15% earnings</p>
              </Card>
            </Link>
          </div>

          <Link to={createPageUrl('Dashboard')}>
            <Button className="bg-gradient-to-r from-[#f5a623] to-[#e91e8c]">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center p-6">
      <CreatorOnboarding
        open={showOnboarding}
        onClose={() => {}}
        onComplete={() => setShowOnboarding(false)}
      />
    </div>
  );
}