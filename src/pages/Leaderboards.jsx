import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, TrendingUp, Heart, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Leaderboards() {
  const [selectedPeriod, setSelectedPeriod] = useState('this_week');

  const { data: mostLiked = [] } = useQuery({
    queryKey: ['leaderboard-most-liked', selectedPeriod],
    queryFn: () => base44.entities.Leaderboard.filter({ 
      leaderboard_type: 'most_liked',
      week_start: getCurrentWeekStart() 
    }, 'rank')
  });

  const { data: topEarning = [] } = useQuery({
    queryKey: ['leaderboard-top-earning', selectedPeriod],
    queryFn: () => base44.entities.Leaderboard.filter({ 
      leaderboard_type: 'top_earning',
      week_start: getCurrentWeekStart() 
    }, 'rank')
  });

  const { data: topSeller = [] } = useQuery({
    queryKey: ['leaderboard-top-seller', selectedPeriod],
    queryFn: () => base44.entities.Leaderboard.filter({ 
      leaderboard_type: 'top_seller',
      week_start: getCurrentWeekStart() 
    }, 'rank')
  });

  function getCurrentWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  }

  const renderLeaderboard = (data, icon, scoreLabel) => (
    <div className="space-y-3">
      {data.map((entry, index) => (
        <motion.div
          key={entry.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className={`p-5 ${
            index === 0 ? 'bg-gradient-to-r from-[#f5a623]/20 to-[#e91e8c]/20 border-[#f5a623]/30' :
            index === 1 ? 'bg-white/10 border-white/20' :
            index === 2 ? 'bg-white/8 border-white/15' :
            'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                index === 0 ? 'bg-[#f5a623] text-white' :
                index === 1 ? 'bg-gray-300 text-gray-800' :
                index === 2 ? 'bg-amber-700 text-white' :
                'bg-white/10 text-white/60'
              }`}>
                {index === 0 ? '👑' : index + 1}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="text-white font-semibold">User #{entry.user_id.slice(0, 8)}</div>
                <div className="text-white/60 text-sm flex items-center gap-2">
                  {icon}
                  <span>{entry.score} {scoreLabel}</span>
                </div>
              </div>

              {/* Prize */}
              {index < 3 && entry.prize_awarded > 0 && (
                <Badge className="bg-green-500/20 text-green-400">
                  +{entry.prize_awarded} credits
                </Badge>
              )}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#f5a623]" />
            Weekly Leaderboards
          </h1>
          <p className="text-white/60">Compete for prizes and bragging rights</p>
        </div>

        <Tabs defaultValue="most-liked" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="most-liked" className="text-white/60 data-[state=active]:text-white">
              <Heart className="w-4 h-4 mr-2" />
              Most Liked
            </TabsTrigger>
            <TabsTrigger value="top-earning" className="text-white/60 data-[state=active]:text-white">
              <DollarSign className="w-4 h-4 mr-2" />
              Top Earning
            </TabsTrigger>
            <TabsTrigger value="top-seller" className="text-white/60 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Top Seller
            </TabsTrigger>
          </TabsList>

          <TabsContent value="most-liked">
            {renderLeaderboard(mostLiked, <Heart className="w-4 h-4 text-pink-400" />, 'likes')}
          </TabsContent>

          <TabsContent value="top-earning">
            {renderLeaderboard(topEarning, <DollarSign className="w-4 h-4 text-green-400" />, 'earned')}
          </TabsContent>

          <TabsContent value="top-seller">
            {renderLeaderboard(topSeller, <TrendingUp className="w-4 h-4 text-blue-400" />, 'sales')}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}