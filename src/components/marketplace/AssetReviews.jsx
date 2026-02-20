import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AssetReviews({ assetId, userId }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ['asset-reviews', assetId],
    queryFn: () => base44.entities.AssetReview.filter({ asset_id: assetId }, '-created_date', 50)
  });

  const { data: userPurchase } = useQuery({
    queryKey: ['user-purchase', assetId, userId],
    queryFn: async () => {
      const purchases = await base44.entities.MarketplacePurchase.filter({
        buyer_user_id: userId,
        marketplace_asset_id: assetId
      });
      return purchases[0];
    },
    enabled: !!userId
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.AssetReview.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-reviews', assetId] });
      toast.success('Review submitted!');
      setShowReviewForm(false);
      setRating(0);
      setReviewText('');
    }
  });

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    submitReviewMutation.mutate({
      asset_id: assetId,
      user_id: userId,
      rating,
      review_text: reviewText,
      verified_purchase: !!userPurchase
    });
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-white/20'
                  }`}
                />
              ))}
            </div>
            <div className="text-white/40 text-sm">{reviews.length} reviews</div>
          </div>

          {userId && userPurchase && !reviews.find(r => r.user_id === userId) && (
            <Button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-[#f5a623] hover:bg-[#e91e8c]"
            >
              Write a Review
            </Button>
          )}
        </div>
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-xl border border-white/10 p-6"
        >
          <h3 className="text-white font-semibold mb-4">Write Your Review</h3>
          
          {/* Star Rating */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-white/20'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this asset..."
            className="bg-white/5 border-white/10 text-white mb-4"
            rows={4}
          />

          <div className="flex gap-3">
            <Button
              onClick={handleSubmitReview}
              disabled={submitReviewMutation.isPending}
              className="bg-[#f5a623] hover:bg-[#e91e8c]"
            >
              Submit Review
            </Button>
            <Button
              onClick={() => setShowReviewForm(false)}
              variant="outline"
              className="border-white/20 text-white"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white/5 rounded-xl border border-white/10 p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-white/20'
                      }`}
                    />
                  ))}
                </div>
                {review.verified_purchase && (
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Verified Purchase
                  </div>
                )}
              </div>
              <span className="text-white/40 text-xs">
                {new Date(review.created_date).toLocaleDateString()}
              </span>
            </div>
            
            {review.review_text && (
              <p className="text-white/70 text-sm leading-relaxed mb-3">
                {review.review_text}
              </p>
            )}

            <button className="flex items-center gap-2 text-white/40 hover:text-white text-xs transition-colors">
              <ThumbsUp className="w-3 h-3" />
              Helpful ({review.helpful_count || 0})
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}