import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Zap, Lock, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Achievements() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => window.location.href = '/auth');
  }, []);

  const { data: allAchievements = [] } = useQuery({
    queryKey: ['all-achievements'],
    queryFn: () => base44.entities.Achievement.list()
  });

  const { data: userAchievements = [] } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: () => base44.entities.UserAchievement.filter({ user_id: user.id }),
    enabled: !!user
  });

  const unlockedKeys = new Set(userAchievements.map(ua => ua.achievement_key));

  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-600'
  };

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-white mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#f5a623]" />
            Achievements
          </h1>
          <p className="text-white/60">
            Unlock badges and earn rewards as you create
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-[#f5a623]/20 to-[#e91e8c]/20 border-[#f5a623]/30 p-6">
            <div className="text-4xl font-bold text-white mb-2">
              {userAchievements.length}
            </div>
            <div className="text-white/70 text-sm">Unlocked</div>
          </Card>
          <Card className="bg-white/5 border-white/10 p-6">
            <div className="text-4xl font-bold text-white mb-2">
              {allAchievements.length}
            </div>
            <div className="text-white/70 text-sm">Total</div>
          </Card>
          <Card className="bg-white/5 border-white/10 p-6">
            <div className="text-4xl font-bold text-white mb-2">
              {Math.round((userAchievements.length / allAchievements.length) * 100)}%
            </div>
            <div className="text-white/70 text-sm">Completion</div>
          </Card>
          <Card className="bg-white/5 border-white/10 p-6">
            <div className="text-4xl font-bold text-white mb-2">
              <Zap className="w-8 h-8 text-[#f5a623]" />
            </div>
            <div className="text-white/70 text-sm">Keep Going!</div>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-white/70 text-sm mb-2">
            <span>Overall Progress</span>
            <span>{userAchievements.length} / {allAchievements.length}</span>
          </div>
          <Progress 
            value={(userAchievements.length / allAchievements.length) * 100} 
            className="h-3 bg-white/10"
          />
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allAchievements.map((achievement, index) => {
            const isUnlocked = unlockedKeys.has(achievement.achievement_key);
            const userAch = userAchievements.find(ua => ua.achievement_key === achievement.achievement_key);
            
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`p-6 ${
                  isUnlocked
                    ? `bg-gradient-to-br ${rarityColors[achievement.rarity]} border-transparent`
                    : 'bg-white/5 border-white/10'
                } transition-all`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      isUnlocked ? 'bg-white/20' : 'bg-white/5'
                    }`}>
                      {isUnlocked ? (
                        <CheckCircle className="w-8 h-8 text-white" />
                      ) : (
                        <Lock className="w-8 h-8 text-white/40" />
                      )}
                    </div>
                    <Badge className={isUnlocked ? 'bg-white/20' : 'bg-white/10'}>
                      {achievement.rarity}
                    </Badge>
                  </div>

                  <h3 className={`font-semibold text-lg mb-2 ${
                    isUnlocked ? 'text-white' : 'text-white/60'
                  }`}>
                    {achievement.title}
                  </h3>

                  <p className={`text-sm mb-4 ${
                    isUnlocked ? 'text-white/80' : 'text-white/40'
                  }`}>
                    {achievement.description}
                  </p>

                  {achievement.reward_credits > 0 && (
                    <div className="flex items-center gap-2 text-[#f5a623] text-sm font-semibold">
                      <Zap className="w-4 h-4" />
                      +{achievement.reward_credits} credits
                    </div>
                  )}

                  {!isUnlocked && userAch?.progress !== undefined && (
                    <div className="mt-4">
                      <Progress value={(userAch.progress / achievement.requirement_value) * 100} className="h-2" />
                      <p className="text-white/40 text-xs mt-1">
                        {userAch.progress} / {achievement.requirement_value}
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}