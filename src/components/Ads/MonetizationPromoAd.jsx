import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, Users, Zap, Award, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MonetizationPromoAd({ placement = 'sidebar', onDismiss }) {
  const [currentAd, setCurrentAd] = useState(0);
  const [hovered, setHovered] = useState(false);

  const ads = [
    {
      id: 'creator-pro',
      title: '🚀 Unlock Creator Pro',
      subtitle: 'Earn passive income from your art',
      features: ['70% revenue share', 'Custom AI styles', 'Priority support'],
      cta: 'Start Earning',
      link: '/creator-pro',
      color: 'from-purple-600 to-pink-600',
      icon: TrendingUp
    },
    {
      id: 'style-marketplace',
      title: '🎨 Rent Your AI Style',
      subtitle: '$0.99-4.99 per generation',
      features: ['Train once, earn forever', '70% creator share', 'Global reach'],
      cta: 'Train Style',
      link: '/style-marketplace',
      color: 'from-blue-600 to-cyan-600',
      icon: Zap
    },
    {
      id: 'referral',
      title: '💰 2X Referral Bonus',
      subtitle: 'Limited time: 20 credits per referral',
      features: ['Usually 10 credits', '6-month special', 'Compound rewards'],
      cta: 'Invite Friends',
      link: '/profile?tab=referrals',
      color: 'from-green-600 to-emerald-600',
      icon: Users
    },
    {
      id: 'tutorials',
      title: '📚 Sell Tutorials',
      subtitle: 'Share knowledge, earn credits',
      features: ['15% creator earnings', 'Build authority', 'Help community'],
      cta: 'Create Tutorial',
      link: '/tutorials',
      color: 'from-orange-600 to-red-600',
      icon: Award
    },
    {
      id: 'livestream',
      title: '🎥 Go Live & Earn',
      subtitle: 'Super Chat donations enabled',
      features: ['Real-time tips', 'Sentiment analysis', 'Grow audience'],
      cta: 'Start Streaming',
      link: '/live-stream',
      color: 'from-red-600 to-pink-600',
      icon: Video
    }
  ];

  // Rotate ads every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAd((prev) => (prev + 1) % ads.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const ad = ads[currentAd];
  const Icon = ad.icon;

  if (placement === 'sidebar') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="relative"
      >
        <Card className={`bg-gradient-to-br ${ad.color} border-0 p-6 text-white relative overflow-hidden`}>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="absolute top-2 right-2 text-white/70 hover:text-white z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-6 h-6" />
              <Badge className="bg-white/20 text-white">New</Badge>
            </div>
            
            <h3 className="text-xl font-bold mb-2">{ad.title}</h3>
            <p className="text-white/90 text-sm mb-4">{ad.subtitle}</p>

            <ul className="space-y-2 mb-4">
              {ad.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link to={createPageUrl(ad.link)}>
              <Button className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold">
                {ad.cta} →
              </Button>
            </Link>
          </div>

          {/* Animated background */}
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />
        </Card>

        {/* Pagination dots */}
        <div className="flex justify-center gap-2 mt-3">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentAd(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentAd ? 'bg-[#f5a623]' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  // Banner placement
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="relative"
    >
      <Card className={`bg-gradient-to-r ${ad.color} border-0 p-4 text-white relative overflow-hidden cursor-pointer`}>
        <Link to={createPageUrl(ad.link)} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Icon className="w-8 h-8" />
            <div>
              <h3 className="font-bold text-lg">{ad.title}</h3>
              <p className="text-white/90 text-sm">{ad.subtitle}</p>
            </div>
          </div>
          
          <Button 
            className="bg-white text-gray-900 hover:bg-gray-100 font-semibold"
            onClick={(e) => e.stopPropagation()}
          >
            {ad.cta} →
          </Button>
        </Link>

        {hovered && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="absolute bottom-0 left-0 right-0 h-1 bg-white/50"
            style={{ transformOrigin: 'left' }}
          />
        )}
      </Card>
    </motion.div>
  );
}