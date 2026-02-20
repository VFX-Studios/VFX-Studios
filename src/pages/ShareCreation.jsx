import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, Meh, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import SEOHead from '@/components/seo/SEOHead';

export default function ShareCreation() {
  const [user, setUser] = useState(null);
  const [comment, setComment] = useState('');
  const [userReaction, setUserReaction] = useState(null);
  const queryClient = useQueryClient();
  
  const creationId = new URLSearchParams(window.location.search).get('id');
  const creationType = new URLSearchParams(window.location.search).get('type') || 'visual_asset';

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: creation } = useQuery({
    queryKey: ['creation', creationId, creationType],
    queryFn: async () => {
      if (creationType === 'visual_asset') {
        return await base44.entities.VisualAsset.get(creationId);
      } else if (creationType === 'performance') {
        return await base44.entities.PerformanceGallery.get(creationId);
      }
    },
    enabled: !!creationId
  });

  const { data: feedback = [] } = useQuery({
    queryKey: ['creation-feedback', creationId],
    queryFn: () => base44.entities.CreationFeedback.filter({ creation_id: creationId })
  });

  const reactionMutation = useMutation({
    mutationFn: async (reaction) => {
      return await base44.entities.CreationFeedback.create({
        creation_id: creationId,
        creation_type: creationType,
        viewer_user_id: user?.id,
        reaction,
        is_anonymous: !user
      });
    },
    onSuccess: (data, reaction) => {
      setUserReaction(reaction);
      queryClient.invalidateQueries({ queryKey: ['creation-feedback'] });
      toast.success('Thanks for your feedback!');
    }
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.CreationFeedback.create({
        creation_id: creationId,
        creation_type: creationType,
        viewer_user_id: user?.id,
        reaction: userReaction || 'like',
        comment,
        is_anonymous: !user
      });
    },
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['creation-feedback'] });
      toast.success('Comment posted!');
    }
  });

  const reactions = {
    like: feedback.filter(f => f.reaction === 'like').length,
    unlike: feedback.filter(f => f.reaction === 'unlike').length,
    unsure: feedback.filter(f => f.reaction === 'unsure').length
  };

  if (!creation) {
    return <div className="min-h-screen bg-[#050510] flex items-center justify-center">
      <span className="text-white">Loading...</span>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <SEOHead
        title={creation.name || creation.title}
        description={creation.description}
        ogImage={creation.file_url || creation.thumbnail_url}
        type="article"
      />

      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          {/* Media Display */}
          <div className="aspect-video bg-black">
            <img 
              src={creation.file_url || creation.video_url || creation.thumbnail_url} 
              alt={creation.name || creation.title}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Content */}
          <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-3">{creation.name || creation.title}</h1>
            <p className="text-white/70 mb-6">{creation.description}</p>

            {/* Reaction Buttons */}
            <div className="flex gap-4 mb-8">
              <Button
                onClick={() => reactionMutation.mutate('like')}
                variant={userReaction === 'like' ? 'default' : 'outline'}
                className={userReaction === 'like' ? 'bg-green-600' : 'border-white/20 text-white'}
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Like ({reactions.like})
              </Button>
              <Button
                onClick={() => reactionMutation.mutate('unlike')}
                variant={userReaction === 'unlike' ? 'default' : 'outline'}
                className={userReaction === 'unlike' ? 'bg-red-600' : 'border-white/20 text-white'}
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Unlike ({reactions.unlike})
              </Button>
              <Button
                onClick={() => reactionMutation.mutate('unsure')}
                variant={userReaction === 'unsure' ? 'default' : 'outline'}
                className={userReaction === 'unsure' ? 'bg-yellow-600' : 'border-white/20 text-white'}
              >
                <Meh className="w-4 h-4 mr-2" />
                Unsure ({reactions.unsure})
              </Button>
            </div>

            {/* Comment Section */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Comments ({feedback.filter(f => f.comment).length})
              </h3>

              {user ? (
                <div className="mb-6">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="bg-white/5 border-white/10 text-white mb-3"
                    rows={3}
                  />
                  <Button 
                    onClick={() => commentMutation.mutate()}
                    disabled={!comment.trim()}
                    className="bg-[#f5a623]"
                  >
                    Post Comment
                  </Button>
                </div>
              ) : (
                <div className="mb-6 bg-white/5 border border-white/10 rounded-lg p-6">
                  <p className="text-white mb-4">Sign in to leave a comment</p>
                  <SocialAuthButtons onSuccess={() => window.location.reload()} />
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {feedback.filter(f => f.comment).map(f => (
                  <div key={f.id} className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/80">{f.comment}</p>
                    <div className="text-white/40 text-xs mt-2">
                      {f.is_anonymous ? 'Anonymous' : 'User'} • {new Date(f.created_date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}