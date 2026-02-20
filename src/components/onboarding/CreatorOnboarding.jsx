import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Sparkles, DollarSign, Users, Award } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CreatorOnboarding({ open, onClose, onComplete }) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    username: '',
    bio: '',
    social_links: { instagram: '', twitter: '', youtube: '' },
    interests: []
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const interestOptions = [
    'Sell VFX Assets',
    'Train AI Style Models',
    'Create Tutorials',
    'Live Streaming',
    'NFT Minting',
    'Collaborative Projects'
  ];

  const handleInterestToggle = (interest) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleComplete = async () => {
    try {
      const user = await base44.auth.me();

      // Create portfolio
      await base44.entities.UserPortfolio.create({
        user_id: user.id,
        username: profile.username,
        bio: profile.bio,
        social_links: profile.social_links,
        is_public: true
      });

      // Mark onboarding complete
      const onboardingRecords = await base44.entities.OnboardingProgress.filter({ 
        user_id: user.id 
      });

      if (onboardingRecords[0]) {
        await base44.entities.OnboardingProgress.update(onboardingRecords[0].id, {
          creator_onboarding_completed: true,
          completed_at: new Date().toISOString()
        });
      } else {
        await base44.entities.OnboardingProgress.create({
          user_id: user.id,
          creator_onboarding_completed: true,
          completed_at: new Date().toISOString()
        });
      }

      // Award welcome bonus
      await base44.auth.updateMe({
        ai_credits_remaining: (user.ai_credits_remaining || 0) + 10
      });

      toast.success('🎉 Welcome! +10 bonus credits added');
      if (onComplete) onComplete();
      onClose();
    } catch (error) {
      toast.error('Onboarding failed');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a0a3e] border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#f5a623]" />
            Welcome to VFX Studios Creator Program
          </DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <div className="text-white/60 text-sm mt-2">Step {step} of {totalSteps}</div>
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-white text-xl font-semibold">Turn Your Art into Income</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30 p-4">
                <DollarSign className="w-8 h-8 text-green-400 mb-2" />
                <div className="text-white font-semibold">70%</div>
                <div className="text-white/60 text-xs">Revenue Share</div>
              </Card>
              <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30 p-4">
                <Users className="w-8 h-8 text-purple-400 mb-2" />
                <div className="text-white font-semibold">10K+</div>
                <div className="text-white/60 text-xs">Global Reach</div>
              </Card>
              <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-500/30 p-4">
                <Award className="w-8 h-8 text-blue-400 mb-2" />
                <div className="text-white font-semibold">$0</div>
                <div className="text-white/60 text-xs">Setup Fee</div>
              </Card>
            </div>
            <Button onClick={() => setStep(2)} className="w-full bg-[#f5a623]">
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Profile Setup */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-white text-xl font-semibold">Create Your Profile</h3>
            <div>
              <label className="text-white/70 text-sm">Username</label>
              <Input
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                placeholder="your-username"
                className="mt-2 bg-white/5 border-white/10 text-white"
              />
              <div className="text-white/40 text-xs mt-1">
                Your portfolio will be at: vfxstudios.com/@{profile.username || 'username'}
              </div>
            </div>
            <div>
              <label className="text-white/70 text-sm">Bio</label>
              <Textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Tell us about your creative journey..."
                className="mt-2 bg-white/5 border-white/10 text-white"
                rows={3}
              />
            </div>
            <Button 
              onClick={() => setStep(3)} 
              disabled={!profile.username}
              className="w-full bg-[#f5a623]"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 3: Interests */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-white text-xl font-semibold">What interests you?</h3>
            <div className="grid grid-cols-2 gap-3">
              {interestOptions.map(interest => (
                <Card
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`p-4 cursor-pointer transition-all ${
                    profile.interests.includes(interest)
                      ? 'bg-[#f5a623]/20 border-[#f5a623]/50'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox checked={profile.interests.includes(interest)} />
                    <span className="text-white text-sm">{interest}</span>
                  </div>
                </Card>
              ))}
            </div>
            <Button 
              onClick={() => setStep(4)}
              disabled={profile.interests.length === 0}
              className="w-full bg-[#f5a623]"
            >
              Continue <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 4: Social Links */}
        {step === 4 && (
          <div className="space-y-4">
            <h3 className="text-white text-xl font-semibold">Connect Your Social Media</h3>
            <div className="space-y-3">
              <div>
                <label className="text-white/70 text-sm">Instagram (optional)</label>
                <Input
                  value={profile.social_links.instagram}
                  onChange={(e) => setProfile({ 
                    ...profile, 
                    social_links: { ...profile.social_links, instagram: e.target.value } 
                  })}
                  placeholder="@username"
                  className="mt-2 bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm">Twitter/X (optional)</label>
                <Input
                  value={profile.social_links.twitter}
                  onChange={(e) => setProfile({ 
                    ...profile, 
                    social_links: { ...profile.social_links, twitter: e.target.value } 
                  })}
                  placeholder="@username"
                  className="mt-2 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="text-green-300 font-semibold mb-1">🎁 Welcome Bonus</div>
              <div className="text-green-200/70 text-sm">
                Complete setup to receive 10 free AI generation credits!
              </div>
            </div>

            <Button 
              onClick={handleComplete}
              className="w-full bg-gradient-to-r from-[#f5a623] to-[#e91e8c]"
            >
              Complete Setup & Claim Bonus
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}