import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, TrendingUp, BarChart3, Crown, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CreatorPro() {
  const handleCheckout = async () => {
    try {
      const user = await base44.auth.me();
      const response = await base44.functions.invoke('create-creator-pro-checkout', {
        user_id: user.id
      });

      if (response.data?.checkout_url) {
        if (window.self !== window.top) {
          toast.error('Checkout only works in published apps');
          return;
        }
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      toast.error('Failed to start checkout');
    }
  };

  const features = [
    { icon: Zap, title: 'Unlimited AI Generations', desc: 'No daily limits or credit restrictions' },
    { icon: BarChart3, title: 'Advanced Analytics Dashboard', desc: 'Track performance metrics and audience insights' },
    { icon: TrendingUp, title: 'Priority Marketplace Placement', desc: 'Featured slots for your assets' },
    { icon: Crown, title: 'Custom Portfolio Domain', desc: 'Brand your portfolio with custom URL' },
    { icon: Sparkles, title: 'API Access', desc: 'Automate workflows with API integration' },
    { icon: Check, title: 'Priority Support', desc: '24/7 priority customer support' }
  ];

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="bg-gradient-to-r from-[#f5a623] to-[#e91e8c] text-white mb-4">
            Professional Tier
          </Badge>
          <h1 className="text-5xl font-bold text-white mb-4">
            Creator <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f5a623] to-[#e91e8c]">Pro</span>
          </h1>
          <p className="text-white/70 text-xl mb-8">
            Unlock unlimited creation power and advanced tools for professional VJs
          </p>
          <div className="flex items-baseline justify-center gap-2 mb-8">
            <span className="text-6xl font-bold text-white">$49</span>
            <span className="text-white/60 text-xl">/month</span>
          </div>
          <Button 
            onClick={handleCheckout}
            size="lg"
            className="bg-gradient-to-r from-[#f5a623] to-[#e91e8c] hover:opacity-90 text-lg px-12 py-6"
          >
            Upgrade to Creator Pro
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/5 border-white/10 p-6 hover:border-[#f5a623]/30 transition-all">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#f5a623]/20 to-[#e91e8c]/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-[#f5a623]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-white/60 text-sm">{feature.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="bg-white/5 border-white/10 p-8 mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Plan Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4">Feature</th>
                  <th className="text-center py-4 px-4">Free</th>
                  <th className="text-center py-4 px-4">Monthly</th>
                  <th className="text-center py-4 px-4 bg-gradient-to-r from-[#f5a623]/10 to-[#e91e8c]/10 rounded-t-lg">Creator Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10">
                  <td className="py-4 px-4">AI Generations</td>
                  <td className="text-center py-4 px-4 text-white/60">10/day</td>
                  <td className="text-center py-4 px-4 text-white/60">Unlimited</td>
                  <td className="text-center py-4 px-4 bg-[#f5a623]/5">
                    <Check className="w-5 h-5 mx-auto text-[#f5a623]" />
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-4 px-4">Advanced Analytics</td>
                  <td className="text-center py-4 px-4 text-white/60">-</td>
                  <td className="text-center py-4 px-4 text-white/60">Basic</td>
                  <td className="text-center py-4 px-4 bg-[#f5a623]/5">
                    <Check className="w-5 h-5 mx-auto text-[#f5a623]" />
                  </td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-4 px-4">Marketplace Features</td>
                  <td className="text-center py-4 px-4 text-white/60">Standard</td>
                  <td className="text-center py-4 px-4 text-white/60">Standard</td>
                  <td className="text-center py-4 px-4 bg-[#f5a623]/5">Priority</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="py-4 px-4">API Access</td>
                  <td className="text-center py-4 px-4 text-white/60">-</td>
                  <td className="text-center py-4 px-4 text-white/60">-</td>
                  <td className="text-center py-4 px-4 bg-[#f5a623]/5">
                    <Check className="w-5 h-5 mx-auto text-[#f5a623]" />
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4">Custom Domain</td>
                  <td className="text-center py-4 px-4 text-white/60">-</td>
                  <td className="text-center py-4 px-4 text-white/60">-</td>
                  <td className="text-center py-4 px-4 bg-[#f5a623]/5 rounded-b-lg">
                    <Check className="w-5 h-5 mx-auto text-[#f5a623]" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button 
            onClick={handleCheckout}
            size="lg"
            className="bg-gradient-to-r from-[#f5a623] to-[#e91e8c] hover:opacity-90 text-lg px-12 py-6"
          >
            Start Your Pro Journey
          </Button>
          <p className="text-white/40 text-sm mt-4">
            30-day money-back guarantee • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}