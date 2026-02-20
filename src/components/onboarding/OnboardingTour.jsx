import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check, Sparkles, Zap, ShoppingCart, TrendingUp, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const tourSteps = [
  {
    id: 'welcome',
    title: '🎉 Welcome to VFX Studios!',
    description: 'Your AI-powered visual effects platform for live performances. Let\'s take a quick tour!',
    position: 'center',
    highlight: null,
    action: null
  },
  {
    id: 'ai_generation',
    title: '✨ AI Visual Generation',
    description: 'Create stunning visuals from text descriptions. You get 10 free generations daily! Try it now.',
    position: 'bottom',
    highlight: '.ai-generator',
    action: 'Try generating your first visual with AI',
    benefit: 'Premium users get unlimited generations'
  },
  {
    id: 'credits',
    title: '⚡ AI Credits System',
    description: 'Out of daily credits? Purchase more or watch a quick ad to earn one. Bundles available!',
    position: 'top-right',
    highlight: '.credit-display',
    action: 'View credit purchase options',
    benefit: 'Buy 5 credits for $2.99 or 50 for $19.99'
  },
  {
    id: 'marketplace',
    title: '🛒 Asset Marketplace',
    description: 'Buy premium visual assets from top creators or sell your own. Platform takes only 20% commission.',
    position: 'center',
    highlight: null,
    action: 'Browse the marketplace',
    benefit: 'Sell your creations and earn passive income'
  },
  {
    id: 'ai_copilot',
    title: '🤖 AI Co-Pilot (Premium)',
    description: 'Real-time AI suggestions during performances based on music analysis and audience reactions!',
    position: 'bottom',
    highlight: '.ai-copilot-panel',
    action: 'Learn more about AI Co-Pilot',
    benefit: 'Included in Monthly and Annual plans'
  },
  {
    id: 'blog',
    title: '📚 Learn & Grow',
    description: 'Check out our blog for AI generation tips, music promotion strategies, and platform updates.',
    position: 'center',
    highlight: null,
    action: 'Read the blog',
    benefit: 'Expert tips to maximize your visual impact'
  },
  {
    id: 'premium',
    title: '🚀 Upgrade to Premium',
    description: 'Unlock unlimited AI generations, advanced analytics, marketplace features, and AI Co-Pilot!',
    position: 'center',
    highlight: null,
    action: 'View pricing plans',
    benefit: 'Starting at just $9.99/week'
  }
];

export default function OnboardingTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    // Load progress
    const loadProgress = async () => {
      try {
        const user = await base44.auth.me();
        const progressData = await base44.entities.OnboardingProgress.filter({ user_id: user.id });
        
        if (progressData[0]) {
          setProgress(progressData[0]);
          if (progressData[0].tour_completed || progressData[0].skipped) {
            setIsVisible(false);
          }
        } else {
          // Create new progress
          const newProgress = await base44.entities.OnboardingProgress.create({
            user_id: user.id,
            completed_steps: [],
            current_step: 'welcome'
          });
          setProgress(newProgress);
        }
      } catch (error) {
        console.error('Failed to load onboarding progress');
      }
    };
    loadProgress();
  }, []);

  const handleNext = async () => {
    if (currentStep < tourSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Update progress
      if (progress) {
        await base44.entities.OnboardingProgress.update(progress.id, {
          current_step: tourSteps[nextStep].id,
          completed_steps: [...new Set([...progress.completed_steps, tourSteps[currentStep].id])]
        });
      }
    } else {
      await handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    if (progress) {
      await base44.entities.OnboardingProgress.update(progress.id, {
        skipped: true
      });
    }
    setIsVisible(false);
    toast.info('You can restart the tour anytime from Settings');
    if (onComplete) onComplete();
  };

  const handleComplete = async () => {
    if (progress) {
      await base44.entities.OnboardingProgress.update(progress.id, {
        tour_completed: true,
        completed_steps: tourSteps.map(s => s.id)
      });
    }
    setIsVisible(false);
    toast.success('🎉 Onboarding complete! Enjoy VFX Studios!');
    if (onComplete) onComplete();
  };

  const step = tourSteps[currentStep];

  if (!isVisible || !progress) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto"
          onClick={handleSkip}
        />

        {/* Tour Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative max-w-lg w-full mx-4 bg-gradient-to-br from-[#1a0a3e] to-[#2a1a4e] border border-white/20 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
        >
          {/* Close Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
              className="h-full bg-gradient-to-r from-[#f5a623] to-[#e91e8c]"
            />
          </div>

          {/* Content */}
          <div className="p-8 pt-12">
            {/* Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f5a623]/20 to-[#e91e8c]/20 flex items-center justify-center">
                {step.id === 'welcome' && <Sparkles className="w-8 h-8 text-[#f5a623]" />}
                {step.id === 'ai_generation' && <Zap className="w-8 h-8 text-[#e91e8c]" />}
                {step.id === 'credits' && <Zap className="w-8 h-8 text-[#f5a623]" />}
                {step.id === 'marketplace' && <ShoppingCart className="w-8 h-8 text-purple-400" />}
                {step.id === 'ai_copilot' && <TrendingUp className="w-8 h-8 text-blue-400" />}
                {step.id === 'blog' && <Gift className="w-8 h-8 text-green-400" />}
                {step.id === 'premium' && <Check className="w-8 h-8 text-[#f5a623]" />}
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center mb-3">
              {step.title}
            </h2>

            {/* Description */}
            <p className="text-white/70 text-center mb-6 leading-relaxed">
              {step.description}
            </p>

            {/* Benefit Badge */}
            {step.benefit && (
              <div className="bg-[#f5a623]/10 border border-[#f5a623]/30 rounded-lg p-3 mb-6">
                <p className="text-[#f5a623] text-sm text-center font-medium">
                  💎 {step.benefit}
                </p>
              </div>
            )}

            {/* Action Button */}
            {step.action && (
              <div className="mb-6">
                {step.id === 'marketplace' && (
                  <Link to={createPageUrl('Marketplace')}>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90">
                      {step.action}
                    </Button>
                  </Link>
                )}
                {step.id === 'blog' && (
                  <Link to={createPageUrl('Blog')}>
                    <Button className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:opacity-90">
                      {step.action}
                    </Button>
                  </Link>
                )}
                {step.id === 'premium' && (
                  <Link to={createPageUrl('Pricing')}>
                    <Button className="w-full bg-gradient-to-r from-[#f5a623] to-[#e91e8c] hover:opacity-90">
                      {step.action}
                    </Button>
                  </Link>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div className="text-white/40 text-sm">
                {currentStep + 1} / {tourSteps.length}
              </div>

              <Button
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-[#f5a623] to-[#e91e8c] hover:opacity-90"
              >
                {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                {currentStep !== tourSteps.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
                {currentStep === tourSteps.length - 1 && <Check className="w-4 h-4 ml-2" />}
              </Button>
            </div>

            {/* Skip Link */}
            <button
              onClick={handleSkip}
              className="mt-4 text-white/40 hover:text-white/60 text-sm transition-colors w-full text-center"
            >
              Skip tour
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}