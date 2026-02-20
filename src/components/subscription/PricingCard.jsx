import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Sparkles, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const tierIcons = {
  weekly: Zap,
  monthly: Crown,
  annual: Sparkles,
  enterprise: Building2,
};

const tierColors = {
  weekly: { bg: 'from-blue-900/20 to-cyan-900/20', accent: '#00d4ff', border: 'blue-500/30' },
  monthly: { bg: 'from-purple-900/20 to-pink-900/20', accent: '#e91e8c', border: 'purple-500/30' },
  annual: { bg: 'from-amber-900/20 to-orange-900/20', accent: '#f5a623', border: 'amber-500/30' },
  enterprise: { bg: 'from-emerald-900/20 to-teal-900/20', accent: '#10b981', border: 'emerald-500/30' },
};

export default function PricingCard({ tier, price, features, isPopular, onSelect, isCurrentPlan, saleBadge, showTimer }) {
  const Icon = tierIcons[tier];
  const colors = tierColors[tier];
  const [timeLeft, setTimeLeft] = React.useState(3600); // 1 hour countdown

  React.useEffect(() => {
    if (!showTimer) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [showTimer]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className={`relative bg-gradient-to-br ${colors.bg} rounded-2xl border-2 ${
        isPopular ? 'border-[#f5a623]' : 'border-white/10'
      } p-6 overflow-hidden`}
    >
      {isPopular && (
        <Badge className="absolute top-4 right-4 bg-gradient-to-r from-[#f5a623] to-[#e91e8c] animate-pulse">
          ⭐ Most Popular
        </Badge>
      )}
      {showTimer && timeLeft > 0 && (
        <Badge className="absolute top-4 left-4 bg-red-500 animate-pulse">
          ⏰ {minutes}:{seconds.toString().padStart(2, '0')} left
        </Badge>
      )}
      {saleBadge && (
        <Badge className="absolute top-4 left-4 bg-red-500">
          {saleBadge}
        </Badge>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center`}>
          <Icon className="w-6 h-6" style={{ color: colors.accent }} />
        </div>
        <div>
          <h3 className="text-white font-medium text-lg capitalize">{tier}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">${price}</span>
            <span className="text-white/40 text-sm">/{tier === 'weekly' ? 'week' : 'month'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-white/70">
            <Check className="w-4 h-4 mt-0.5" style={{ color: colors.accent }} />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={() => onSelect(tier)}
        disabled={isCurrentPlan}
        className={`w-full ${
          isCurrentPlan
            ? 'bg-white/10 text-white/40 cursor-not-allowed'
            : `bg-gradient-to-r from-${colors.accent} to-${colors.accent} hover:opacity-90`
        }`}
        style={!isCurrentPlan ? { background: `linear-gradient(to right, ${colors.accent}, ${colors.accent}dd)` } : {}}
      >
        {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
      </Button>
    </motion.div>
  );
}
