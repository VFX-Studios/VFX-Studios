import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Gift, Calendar, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export default function StreakRewardBanner() {
  const [streak, setStreak] = useState(null);
  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackStreak();
  }, []);

  const trackStreak = async () => {
    try {
      const response = await base44.functions.invoke('track-login-streak', {});
      setStreak(response.data);
      
      if (response.data.reward) {
        setReward(response.data.reward);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success(response.data.reward.message, { duration: 5000 });
      }

      if (response.data.geographic_discount > 0) {
        toast.info(`🌍 Geographic pricing: ${response.data.geographic_discount}% off for your region`);
      }

      if (response.data.monday_discount > 0) {
        toast.info(`🎉 Monday Special: ${response.data.monday_discount}% off today!`);
      }
    } catch (error) {
      console.error('Streak tracking error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !streak) return null;

  return (
    <>
      {/* Streak Counter */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center">
                <Flame className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-white font-bold text-2xl">
                  {streak.streak} Day Streak 🔥
                </div>
                <div className="text-white/70 text-sm">
                  Longest: {streak.longest_streak} days
                </div>
                {streak.streak > 0 && (
                  <div className="text-orange-300 text-xs mt-1">
                    {3 - (streak.streak % 3)} more days until next reward!
                  </div>
                )}
              </div>
            </div>

            {streak.monday_discount > 0 && (
              <Badge className="bg-green-500">
                <Calendar className="w-3 h-3 mr-1" />
                {streak.monday_discount}% off Monday!
              </Badge>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Reward Popup */}
      {reward && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center">
                <Gift className="w-8 h-8 text-white animate-bounce" />
              </div>
              <div className="flex-1">
                <div className="text-white font-bold text-xl mb-2">
                  3-Day Streak Reward! 🎉
                </div>
                <div className="text-white/80 mb-4">
                  You've earned a <span className="text-yellow-300 font-bold">Buy One Get One Free</span> credit purchase coupon!
                </div>
                <div className="bg-white/10 rounded-lg p-3 font-mono text-sm border border-dashed border-white/30">
                  <div className="text-white/60 text-xs mb-1">Coupon Code:</div>
                  <div className="text-yellow-300 font-bold text-lg">
                    {reward.coupon.code}
                  </div>
                  <div className="text-white/60 text-xs mt-2">
                    Expires: {new Date(reward.coupon.expires).toLocaleDateString()}
                  </div>
                </div>
                <Button className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Use Coupon Now
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </>
  );
}