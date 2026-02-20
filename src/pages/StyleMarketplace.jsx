import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function StyleMarketplace() {
  const [user, setUser] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [rentDialogOpen, setRentDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: styles = [] } = useQuery({
    queryKey: ['ai-styles'],
    queryFn: () => base44.entities.AIStyleModel.filter({ model_status: 'active' }, '-total_rentals')
  });

  const rentStyleMutation = useMutation({
    mutationFn: async (modelId) => {
      return await base44.functions.invoke('rent-style-model', { model_id: modelId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-styles'] });
      toast.success('Style rented! Use it in AI generation.');
      setRentDialogOpen(false);
    }
  });

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AI Style Marketplace</h1>
          <p className="text-white/60">Rent unique AI styles from top creators - $0.99-4.99 per generation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {styles.map(style => (
            <Card key={style.id} className="bg-white/5 border-white/10 overflow-hidden">
              <div className="grid grid-cols-2 gap-1 p-2">
                {style.preview_images?.slice(0, 4).map((img, i) => (
                  <div key={i} className="aspect-square bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded">
                    <img src={img} alt="" className="w-full h-full object-cover rounded" />
                  </div>
                ))}
              </div>
              
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-white font-semibold flex-1">{style.model_name}</h3>
                  {style.rating && (
                    <Badge className="bg-yellow-500/20 text-yellow-400">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      {style.rating.toFixed(1)}
                    </Badge>
                  )}
                </div>
                
                <p className="text-white/60 text-sm mb-4 line-clamp-2">{style.description}</p>
                
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {style.tags?.slice(0, 3).map(tag => (
                    <Badge key={tag} className="bg-white/10 text-white/70 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-[#f5a623]">
                      ${style.rental_price}
                    </div>
                    <div className="text-white/40 text-xs">per generation</div>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedModel(style);
                      setRentDialogOpen(true);
                    }}
                    className="bg-gradient-to-r from-[#f5a623] to-[#e91e8c]"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Rent Style
                  </Button>
                </div>

                <div className="mt-3 text-white/40 text-xs flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" />
                  {style.total_rentals || 0} uses
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Rent Confirmation Dialog */}
      <Dialog open={rentDialogOpen} onOpenChange={setRentDialogOpen}>
        <DialogContent className="bg-[#1a0a3e] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Rent AI Style</DialogTitle>
          </DialogHeader>
          {selectedModel && (
            <div className="space-y-4">
              <p className="text-white/70">
                You're about to rent <span className="text-[#f5a623] font-semibold">{selectedModel.model_name}</span> for one generation.
              </p>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-white/60">Price</span>
                  <span className="text-white font-semibold">${selectedModel.rental_price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Creator earns</span>
                  <span className="text-green-400">${(selectedModel.rental_price * 0.7).toFixed(2)} (70%)</span>
                </div>
              </div>
              <Button
                onClick={() => rentStyleMutation.mutate(selectedModel.id)}
                disabled={rentStyleMutation.isPending}
                className="w-full bg-[#f5a623]"
              >
                {rentStyleMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rental'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}