import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { User, Mail, Music, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [artistName, setArtistName] = useState('');
  const [genre, setGenre] = useState('');
  const queryClient = useQueryClient();

  const params = new URLSearchParams(window.location.search);
  const defaultTab = params.get('tab') || 'profile';

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setFullName(u.full_name || '');
    });
  }, []);

  const { data: artist } = useQuery({
    queryKey: ['artist', user?.id],
    queryFn: async () => {
      const artists = await base44.entities.Artist.filter({ user_id: user.id });
      const a = artists[0];
      if (a) {
        setArtistName(a.artist_name || '');
        setBio(a.bio || '');
        setGenre(a.genre || '');
      }
      return a;
    },
    enabled: !!user,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({ user_id: user.id });
      return subs[0];
    },
    enabled: !!user,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({ full_name: fullName });
      if (artist) {
        await base44.entities.Artist.update(artist.id, {
          artist_name: artistName,
          bio,
          genre
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist'] });
      toast.success('Profile updated');
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#f5a623] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#f5a623]/20 to-[#e91e8c]/20 p-8 border-b border-white/10">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-4 border-[#f5a623]/30">
                <AvatarFallback className="bg-[#f5a623] text-white text-2xl">
                  {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-light text-white">{user.full_name || 'User'}</h1>
                <p className="text-white/60">{user.email}</p>
                {subscription && (
                  <div className="mt-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-[#f5a623]/20 text-[#f5a623] capitalize">
                      {subscription.tier} {subscription.status === 'trial' && '(Trial)'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue={defaultTab} className="p-6">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="profile" className="data-[state=active]:bg-[#f5a623]">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-[#f5a623]">
                <Mail className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6 mt-6">
              <div>
                <Label className="text-white/70">Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-2 bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-white/70 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Artist / Stage Name
                </Label>
                <Input
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  className="mt-2 bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-white/70">Genre</Label>
                <Input
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g., Electronic, House, Techno"
                  className="mt-2 bg-white/5 border-white/10 text-white"
                />
              </div>

              <div>
                <Label className="text-white/70">Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="mt-2 bg-white/5 border-white/10 text-white h-32"
                />
              </div>

              <Button
                onClick={() => updateProfileMutation.mutate()}
                disabled={updateProfileMutation.isPending}
                className="w-full bg-gradient-to-r from-[#f5a623] to-[#e91e8c] hover:opacity-90"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-6">
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-white font-medium mb-4">Account Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Email</span>
                    <span className="text-white">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Account Type</span>
                    <span className="text-white capitalize">{user.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Member Since</span>
                    <span className="text-white">{new Date(user.created_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {subscription && (
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-white font-medium mb-4">Subscription</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Current Plan</span>
                      <span className="text-white capitalize">{subscription.tier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Status</span>
                      <span className={`capitalize ${
                        subscription.status === 'active' ? 'text-green-400' :
                        subscription.status === 'trial' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>{subscription.status}</span>
                    </div>
                    {subscription.trial_ends_at && subscription.status === 'trial' && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Trial Ends</span>
                        <span className="text-white">{new Date(subscription.trial_ends_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {subscription.current_period_end && subscription.status === 'active' && (
                      <div className="flex justify-between">
                        <span className="text-white/60">Next Billing</span>
                        <span className="text-white">{new Date(subscription.current_period_end).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {subscription?.paypal_subscription_id && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                      <Button
                        onClick={async () => {
                          try {
                            const { data } = await base44.functions.invoke('create-portal-session');
                            if (data.url) window.location.href = data.url;
                          } catch (error) {
                            toast.error('Failed to open billing portal');
                          }
                        }}
                        className="w-full bg-[#f5a623]"
                      >
                        Manage Billing
                      </Button>
                      {subscription.status !== 'cancelled' && (
                        <Button
                          onClick={async () => {
                            if (confirm('Cancel your subscription? You will lose access at the end of the billing period.')) {
                              try {
                                await base44.functions.invoke('cancel-subscription');
                                queryClient.invalidateQueries({ queryKey: ['subscription'] });
                                toast.success('Subscription cancelled');
                              } catch (error) {
                                toast.error('Failed to cancel subscription');
                              }
                            }
                          }}
                          variant="outline"
                          className="w-full border-red-400/30 text-red-400"
                        >
                          Cancel Subscription
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
