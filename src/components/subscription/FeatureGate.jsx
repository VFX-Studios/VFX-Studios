import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const FEATURE_REQUIREMENTS = {
  'ai_generation': ['weekly', 'monthly', 'annual'],
  'timeline_automation': ['weekly', 'monthly', 'annual'],
  'collaboration': ['monthly', 'annual'],
  'advanced_vfx': ['monthly', 'annual'],
  'generative_art': ['annual'],
  'mood_analysis': ['annual'],
  'multi_camera': ['annual'],
};

export default function FeatureGate({ feature, currentTier, children }) {
  const requiredTiers = FEATURE_REQUIREMENTS[feature];
  const hasAccess = requiredTiers?.includes(currentTier);

  if (hasAccess || currentTier === 'trial') {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-6"
        >
          <Lock className="w-12 h-12 text-[#f5a623] mx-auto mb-4" />
          <h3 className="text-white text-lg font-medium mb-2">Premium Feature</h3>
          <p className="text-white/60 text-sm mb-4">
            Upgrade to {requiredTiers[0]} or higher to unlock
          </p>
          <Link to={createPageUrl('Pricing')}>
            <Button className="bg-gradient-to-r from-[#f5a623] to-[#e91e8c]">
              View Plans
            </Button>
          </Link>
        </motion.div>
      </div>
      <div className="opacity-30 pointer-events-none">
        {children}
      </div>
    </div>
  );
}