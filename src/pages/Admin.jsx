import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Ban, AlertTriangle, Shield, Bot, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import AgentManagement from '@/components/admin/AgentManagement';
import AdvancedAnalytics from '@/components/admin/AdvancedAnalytics';

export default function Admin() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u.role !== 'admin') {
        window.location.href = '/';
      }
      setUser(u);
    }).catch(() => {
      window.location.href = '/';
    });
  }, []);

  const { data: analytics = [] } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => base44.entities.AnalyticsEvent.list('-created_date', 100),
    enabled: !!user,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list('-created_date', 100),
    enabled: !!user,
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['all-subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date', 100),
    enabled: !!user,
  });

  const { data: bannedUsers = [] } = useQuery({
    queryKey: ['banned-users'],
    queryFn: () => base44.entities.BannedUser.list('-created_date'),
    enabled: !!user,
  });

  const banUserMutation = useMutation({
    mutationFn: ({ userId, reason }) => base44.entities.BannedUser.create({
      user_id: userId,
      reason,
      banned_by: user.id,
      permanent: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned-users'] });
      toast.success('User banned');
    },
  });

  // Analytics calculations
  const totalRevenue = analytics
    .filter(e => e.event_type === 'payment_successful')
    .reduce((sum, e) => sum + (e.revenue_amount || 0), 0);

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
  const trialUsers = subscriptions.filter(s => s.status === 'trial').length;

  const tierBreakdown = subscriptions.reduce((acc, s) => {
    acc[s.tier] = (acc[s.tier] || 0) + 1;
    return acc;
  }, {});

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-[#f5a623]" />
          <h1 className="text-3xl font-light text-white">Admin Dashboard</h1>
        </div>

        <Tabs defaultValue="overview" className="mb-8">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">
              <Bot className="w-4 h-4 mr-2" />
              AI Agents
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Advanced Analytics
            </TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="mt-6">
            <AgentManagement />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AdvancedAnalytics />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            {/* User Management */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h2 className="text-white text-lg font-medium mb-4">User Management</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {users.map(u => {
                  const isBanned = bannedUsers.some(b => b.user_id === u.id);
                  const sub = subscriptions.find(s => s.user_id === u.id);

                  return (
                    <div key={u.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{u.full_name || u.email}</div>
                        <div className="text-white/40 text-xs">{u.email}</div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                            {sub?.tier || 'free'}
                          </span>
                          {isBanned && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                              BANNED
                            </span>
                          )}
                        </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="border-red-500/30 text-red-400">
                            <Ban className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#1a0a3e] border-white/10">
                          <DialogHeader>
                            <DialogTitle className="text-white">Ban User</DialogTitle>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const reason = e.target.reason.value;
                              banUserMutation.mutate({ userId: u.id, reason });
                            }}
                            className="space-y-4"
                          >
                            <Input
                              name="reason"
                              placeholder="Ban reason..."
                              className="bg-white/5 border-white/10 text-white"
                              required
                            />
                            <Button type="submit" className="w-full bg-red-600">Ban User</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="overview" className="mt-6">

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-xl p-6"
          >
            <DollarSign className="w-8 h-8 text-green-400 mb-3" />
            <div className="text-3xl font-bold text-white mb-1">${totalRevenue.toFixed(2)}</div>
            <div className="text-white/60 text-sm">Total Revenue</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/20 rounded-xl p-6"
          >
            <Users className="w-8 h-8 text-blue-400 mb-3" />
            <div className="text-3xl font-bold text-white mb-1">{users.length}</div>
            <div className="text-white/60 text-sm">Total Users</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-xl p-6"
          >
            <TrendingUp className="w-8 h-8 text-purple-400 mb-3" />
            <div className="text-3xl font-bold text-white mb-1">{activeSubscriptions}</div>
            <div className="text-white/60 text-sm">Active Subs</div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/20 rounded-xl p-6"
          >
            <AlertTriangle className="w-8 h-8 text-amber-400 mb-3" />
            <div className="text-3xl font-bold text-white mb-1">{trialUsers}</div>
            <div className="text-white/60 text-sm">Trial Users</div>
          </motion.div>
        </div>

        {/* Tier Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-white text-lg font-medium mb-4">Subscription Tiers</h2>
            <div className="space-y-3">
              {Object.entries(tierBreakdown).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <span className="text-white/70 capitalize">{tier}</span>
                  <span className="text-white font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-white text-lg font-medium mb-4">Recent Events</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {analytics.slice(0, 10).map(event => (
                <div key={event.id} className="text-xs bg-white/5 rounded p-2">
                  <div className="text-white/80">{event.event_type.replace('_', ' ')}</div>
                  <div className="text-white/40">{new Date(event.created_date).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}