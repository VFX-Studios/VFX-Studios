import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Gift, Copy, Check, Zap, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function ReferralDashboard() {
  const [user, setUser] = useState(null);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      
      // Generate or fetch referral code
      const code = `VFX${userData.id.slice(0, 6).toUpperCase()}`;
      setReferralCode(code);
    };
    fetchUser();
  }, []);

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals', user?.id],
    queryFn: () => base44.entities.ReferralProgram.filter({ 
      referrer_user_id: user.id 
    }),
    enabled: !!user
  });

  const completedReferrals = referrals.filter(r => r.status === 'completed').length;
  const totalCreditsEarned = completedReferrals * 20; // SPECIAL: 20 credits for first 6 months
  const milestoneReached = completedReferrals >= 5;

  const handleCopy = () => {
    const referralUrl = `${window.location.origin}/auth?ref=${referralCode}`;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `Join me on VFX Studios and get 5 free AI credits! Use my referral link:`;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#f5a623]/20 to-[#e91e8c]/20 border-[#f5a623]/30 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-6 h-6 text-[#f5a623]" />
            <span className="text-white/70 text-sm">Referrals</span>
          </div>
          <div className="text-4xl font-bold text-white">{completedReferrals}</div>
        </Card>

        <Card className="bg-white/5 border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-6 h-6 text-[#f5a623]" />
            <span className="text-white/70 text-sm">Credits Earned</span>
          </div>
          <div className="text-4xl font-bold text-white">{totalCreditsEarned}</div>
        </Card>

        <Card className={`p-6 ${milestoneReached 
          ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30' 
          : 'bg-white/5 border-white/10'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <Gift className="w-6 h-6 text-purple-400" />
            <span className="text-white/70 text-sm">Milestone</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {milestoneReached ? '🎉 +50% Bonus!' : `${5 - completedReferrals} more`}
          </div>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-white font-semibold text-lg mb-4">Your Referral Link</h3>
        <div className="flex gap-3">
          <Input 
            value={`${window.location.origin}/auth?ref=${referralCode}`}
            readOnly
            className="bg-white/5 border-white/10 text-white"
          />
          <Button 
            onClick={handleCopy}
            className="bg-[#f5a623] hover:bg-[#e91e8c] flex-shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
        
        {/* Share Buttons */}
        <div className="flex gap-3 mt-4">
          <a 
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(`${window.location.origin}/auth?ref=${referralCode}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="outline" className="border-white/20 text-white">
              Share on Twitter
            </Button>
          </a>
          <a 
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/auth?ref=${referralCode}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="outline" className="border-white/20 text-white">
              Share on Facebook
            </Button>
          </a>
        </div>
      </Card>

      {/* Special Promotion Banner */}
      <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Badge className="bg-green-500 text-white animate-pulse">🎉 SPECIAL LAUNCH OFFER</Badge>
        </div>
        <h3 className="text-white font-bold text-xl mb-2">Limited Time: 2x Credits!</h3>
        <p className="text-green-200">
          Get <span className="font-bold text-2xl">20 credits</span> per referral (normally 10) for the first 6 months! 
          Plus your friend gets <span className="font-bold">5 bonus credits</span>.
        </p>
      </Card>

      {/* How It Works */}
      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-white font-semibold text-lg mb-4">How It Works</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f5a623]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#f5a623] font-bold">1</span>
            </div>
            <div>
              <p className="text-white font-medium">Share your link</p>
              <p className="text-white/60 text-sm">Send your unique referral link to friends</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f5a623]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#f5a623] font-bold">2</span>
            </div>
            <div>
              <p className="text-white font-medium">They sign up</p>
              <p className="text-white/60 text-sm">Your friend gets 5 bonus credits</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f5a623]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#f5a623] font-bold">3</span>
            </div>
            <div>
              <p className="text-white font-medium">You earn rewards</p>
              <p className="text-white/60 text-sm">Get 20 credits per referral (Limited Time!)</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <p className="text-white font-medium">Unlock milestone bonus</p>
              <p className="text-white/60 text-sm">Refer 5+ friends → Permanent +50% credit bonus!</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}