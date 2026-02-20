import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import PricingCard from '../components/subscription/PricingCard';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const PRICING_PLANS = {
  weekly: {
    price: 9.97,
    features: [
      'AI-powered visual generation',
      'Timeline automation',
      'Up to 10 songs',
      'Basic VFX presets',
      'Email support'
    ]
  },
  monthly: {
    price: 29.97,
    features: [
      'Everything in Weekly',
      'Unlimited songs',
      'Advanced VFX library',
      'Collaborative VJ sessions',
      'Custom preset saving',
      'Real-time AI co-pilot',
      'Priority support'
    ],
    mostPopular: true
  },
  annual: {
    price: 199.97,
    salePrice: 199.97,
    originalPrice: 599.99,
    features: [
      'Everything in Monthly',
      'Generative art engine',
      'Mood analysis and emotional arc',
      'Multi-camera mixing',
      'Advanced collaboration tools',
      'Hand-off control system',
      'Dedicated account manager',
      'Early access to new features'
    ]
  },
  enterprise: {
    price: 499.0,
    features: [
      'Everything in Annual',
      'Up to 20 seats with role-based controls',
      'SAML SSO and SCIM-ready provisioning',
      'Dedicated success manager and onboarding',
      'Festival and studio white-label portal',
      'Advanced compliance exports and audit trails',
      'Custom SLA and shared roadmap'
    ]
  }
};

export default function Pricing() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      window.location.href = createPageUrl('Auth');
    });
  }, []);

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0];
    },
    enabled: !!user
  });

  const handleSelectPlan = async (tier) => {
    if (!user) {
      window.location.href = createPageUrl('Auth');
      return;
    }

    try {
      if (window.self !== window.top) {
        toast.error('Checkout only works from published apps, not in preview. Please publish your app first.');
        return;
      }

      const { data } = await base44.functions.invoke('create-checkout', {
        tier,
        email: user.email,
        userId: user.id
      });

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error('Checkout failed. Please try again.');
      console.error(error);
    }
  };

  const currentTier = subscription?.tier || 'free';

  return (
    <div className="min-h-screen bg-[#04040d] p-6 relative overflow-hidden">
      <div className="absolute inset-0 animate-pan-bg opacity-50" style={{ backgroundImage: 'linear-gradient(120deg, rgba(0,234,255,0.12) 0%, rgba(255,47,178,0.12) 50%, rgba(255,196,0,0.12) 100%)' }} />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(0,214,255,0.12),transparent_40%)]" />
      <div className="absolute inset-0 animate-scanline bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:100%_6px]" />
      <div className="max-w-7xl mx-auto">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" className="mb-8 text-white/60">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="text-center mb-12 relative">
          <div className="inline-flex items-center gap-2 mb-4 bg-white/5 border border-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
            <Sparkles className="w-8 h-8 text-[#00eaff]" />
            <span className="text-white/70 text-sm">Holo-tier pricing tuned for live shows</span>
          </div>
          <h1 className="text-5xl font-semibold text-white mb-3 tracking-tight">Pick Your Deck</h1>
          <p className="text-white/70 text-lg">Unlock the full VJ stack, from AI visuals to live co-pilots</p>

          {subscription?.status === 'trial' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 inline-block bg-[#f5a623]/20 border border-[#f5a623]/30 rounded-full px-6 py-3"
            >
              <span className="text-[#f5a623] font-medium">
                Free Trial Active - Ends {new Date(subscription.trial_ends_at).toLocaleDateString()}
              </span>
            </motion.div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          <PricingCard
            tier="weekly"
            price={PRICING_PLANS.weekly.price}
            features={PRICING_PLANS.weekly.features}
            onSelect={handleSelectPlan}
            isCurrentPlan={currentTier === 'weekly'}
            showTimer={!subscription || subscription.tier === 'free'}
          />
          <PricingCard
            tier="monthly"
            price={PRICING_PLANS.monthly.price}
            features={PRICING_PLANS.monthly.features}
            isPopular={true}
            onSelect={handleSelectPlan}
            isCurrentPlan={currentTier === 'monthly'}
          />
          <PricingCard
            tier="annual"
            price={PRICING_PLANS.annual.price}
            features={PRICING_PLANS.annual.features}
            saleBadge="Limited Time"
            onSelect={handleSelectPlan}
            isCurrentPlan={currentTier === 'annual'}
          />
          <PricingCard
            tier="enterprise"
            price={PRICING_PLANS.enterprise.price}
            features={PRICING_PLANS.enterprise.features}
            onSelect={handleSelectPlan}
            isCurrentPlan={currentTier === 'enterprise'}
          />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <h3 className="text-white text-xl mb-3">Free Plan Includes:</h3>
          <p className="text-white/60 mb-4">
            Up to 3 songs, basic timeline editor, 5 VFX presets, standard support
          </p>
          <p className="text-white/40 text-sm">
            Start your 3-day free trial of any premium plan - no credit card required.
          </p>
        </div>
      </div>
    </div>
  );
}
