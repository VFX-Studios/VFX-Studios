import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Check, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function CreditPurchaseDialog({ open, onOpenChange, currentCredits }) {
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPack, setSelectedPack] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minute timer

  React.useEffect(() => {
    if (!open) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const packs = [
    {
      id: 'starter',
      name: 'Starter Pack',
      credits: 10,
      price: 2.99,
      pricePerCredit: 0.30,
      badge: null
    },
    {
      id: 'pro',
      name: 'Pro Pack',
      credits: 50,
      price: 11.99,
      pricePerCredit: 0.24,
      badge: 'Most Popular',
      highlight: true
    },
    {
      id: 'mega',
      name: 'Mega Pack',
      credits: 200,
      price: 34.99,
      pricePerCredit: 0.17,
      badge: 'Best Value'
    }
  ];

  const handlePurchase = async (packId) => {
    setPurchasing(true);
    setSelectedPack(packId);

    try {
      const response = await base44.functions.invoke('create-credit-checkout', {
        credit_pack: packId
      });

      if (response.data?.checkout_url) {
        // Check if running in iframe
        if (window.self !== window.top) {
          toast.error('Checkout only works in published apps, not preview mode');
          return;
        }
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error('Credit purchase error:', error);
      toast.error('Failed to start checkout');
    } finally {
      setPurchasing(false);
      setSelectedPack(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a0a3e] border-white/10 max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#f5a623]" />
            Purchase AI Generation Credits
          </DialogTitle>
          <p className="text-white/60 text-sm mt-2">
            Current balance: <span className="text-[#f5a623] font-semibold">{currentCredits || 0} credits</span>
          </p>
          {timeLeft > 0 && (
            <Badge className="bg-red-500 text-white animate-pulse w-fit mt-2">
              ⏰ Special pricing expires in {minutes}:{seconds.toString().padStart(2, '0')}
            </Badge>
          )}
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className={`relative rounded-xl border p-6 transition-all ${
                pack.highlight
                  ? 'border-[#f5a623] bg-gradient-to-br from-[#f5a623]/10 to-[#e91e8c]/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {pack.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f5a623] text-white">
                  {pack.badge}
                </Badge>
              )}

              <div className="text-center mb-4">
                <Zap className={`w-12 h-12 mx-auto mb-3 ${pack.highlight ? 'text-[#f5a623]' : 'text-white/40'}`} />
                <h3 className="text-white font-semibold text-lg">{pack.name}</h3>
                <div className="text-3xl font-bold text-white mt-2">
                  ${pack.price}
                </div>
                <div className="text-white/40 text-sm mt-1">
                  {pack.credits} credits
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  ${pack.pricePerCredit.toFixed(2)} per credit
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  Never expires
                </div>
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Check className="w-4 h-4 text-green-400" />
                  High-quality AI generation
                </div>
              </div>

              <Button
                onClick={() => handlePurchase(pack.id)}
                disabled={purchasing}
                className={`w-full ${
                  pack.highlight
                    ? 'bg-gradient-to-r from-[#f5a623] to-[#e91e8c] hover:opacity-90'
                    : 'bg-white/10 hover:bg-white/20'
                } text-white`}
              >
                {purchasing && selectedPack === pack.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Purchase Now'
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>💡 Pro Tip:</strong> Free users get 5 credits refreshed monthly. Upgrade to a paid plan for unlimited AI generations!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
