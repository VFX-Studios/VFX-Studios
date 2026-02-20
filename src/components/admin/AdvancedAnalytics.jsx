import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart3, TrendingUp, Users, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function AdvancedAnalytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['advanced-analytics', timeRange],
    queryFn: async () => {
      const response = await base44.functions.invoke('advanced-analytics', {
        time_range: timeRange,
      });
      return response.data;
    },
  });

  const exportData = async (format) => {
    try {
      const response = await base44.functions.invoke('export-analytics', {
        time_range: timeRange,
        format,
      });
      
      const blob = new Blob([response.data.csv || JSON.stringify(response.data)], {
        type: format === 'csv' ? 'text/csv' : 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Export failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-white/60">Loading analytics...</div>
      </div>
    );
  }

  const { overview, user_engagement, content_popularity, ai_effectiveness, revenue_metrics } = analyticsData || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-[#f5a623]" />
          <h2 className="text-white text-xl font-medium">Advanced Analytics</h2>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportData('csv')}
            className="border-white/10 text-white/70"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportData('json')}
            className="border-white/10 text-white/70"
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Engagement</TabsTrigger>
          <TabsTrigger value="content">Content Popularity</TabsTrigger>
          <TabsTrigger value="ai">AI Effectiveness</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-500/20 rounded-xl p-6">
              <Users className="w-8 h-8 text-blue-400 mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {overview?.total_users || 0}
              </div>
              <div className="text-white/60 text-sm">Total Users</div>
              <div className="text-green-400 text-xs mt-2">
                +{overview?.new_users_this_period || 0} this period
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-xl p-6">
              <TrendingUp className="w-8 h-8 text-purple-400 mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {overview?.active_subscriptions || 0}
              </div>
              <div className="text-white/60 text-sm">Active Subscriptions</div>
              <div className="text-green-400 text-xs mt-2">
                {overview?.subscription_growth_rate || 0}% growth
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/20 rounded-xl p-6">
              <Calendar className="w-8 h-8 text-amber-400 mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {overview?.total_setlists || 0}
              </div>
              <div className="text-white/60 text-sm">Total Setlists</div>
              <div className="text-white/40 text-xs mt-2">
                {overview?.avg_songs_per_setlist || 0} avg songs
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-xl p-6">
              <BarChart3 className="w-8 h-8 text-green-400 mb-3" />
              <div className="text-3xl font-bold text-white mb-1">
                {overview?.total_visual_assets || 0}
              </div>
              <div className="text-white/60 text-sm">Visual Assets</div>
              <div className="text-white/40 text-xs mt-2">
                {overview?.ai_generated_percentage || 0}% AI-generated
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Engagement Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Daily Active Users</span>
                  <span className="text-white font-mono">{user_engagement?.dau || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Weekly Active Users</span>
                  <span className="text-white font-mono">{user_engagement?.wau || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Monthly Active Users</span>
                  <span className="text-white font-mono">{user_engagement?.mau || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Avg Session Duration</span>
                  <span className="text-white font-mono">{user_engagement?.avg_session_duration || '0m'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">User Retention</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Day 1 Retention</span>
                  <span className="text-green-400 font-mono">{user_engagement?.retention_day1 || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Day 7 Retention</span>
                  <span className="text-green-400 font-mono">{user_engagement?.retention_day7 || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Day 30 Retention</span>
                  <span className="text-green-400 font-mono">{user_engagement?.retention_day30 || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Churn Rate</span>
                  <span className="text-red-400 font-mono">{user_engagement?.churn_rate || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4 mt-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-white font-medium mb-4">Top Visual Assets</h3>
            <div className="space-y-2">
              {content_popularity?.top_assets?.map((asset, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <div>
                    <div className="text-white text-sm">{asset.name}</div>
                    <div className="text-white/40 text-xs">{asset.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-mono">{asset.usage_count} uses</div>
                    <div className="text-[#f5a623] text-xs">⭐ {asset.rating || 'N/A'}</div>
                  </div>
                </div>
              )) || (
                <div className="text-center text-white/40 py-8">No data available</div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">AI Suggestions</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/70">Total Suggestions</span>
                  <span className="text-white font-mono">{ai_effectiveness?.total_suggestions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Accepted</span>
                  <span className="text-green-400 font-mono">{ai_effectiveness?.accepted || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Acceptance Rate</span>
                  <span className="text-[#f5a623] font-mono">{ai_effectiveness?.acceptance_rate || 0}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Generation Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/70">Images Generated</span>
                  <span className="text-white font-mono">{ai_effectiveness?.images_generated || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Avg Rating</span>
                  <span className="text-[#f5a623] font-mono">⭐ {ai_effectiveness?.avg_rating || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Used in Performance</span>
                  <span className="text-green-400 font-mono">{ai_effectiveness?.used_in_perf || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Learning Data</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/70">Data Points</span>
                  <span className="text-white font-mono">{ai_effectiveness?.learning_data_points || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Avg Effectiveness</span>
                  <span className="text-green-400 font-mono">{ai_effectiveness?.avg_effectiveness || 0}/10</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Revenue Overview</h3>
              <div className="text-4xl font-bold text-white mb-2">
                ${revenue_metrics?.total_revenue?.toFixed(2) || '0.00'}
              </div>
              <div className="text-green-400 text-sm">
                +${revenue_metrics?.revenue_this_period?.toFixed(2) || '0.00'} this period
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">MRR</span>
                  <span className="text-white font-mono">${revenue_metrics?.mrr?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">ARR</span>
                  <span className="text-white font-mono">${revenue_metrics?.arr?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-white font-medium mb-4">Subscription Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(revenue_metrics?.tier_breakdown || {}).map(([tier, data]) => (
                  <div key={tier} className="flex items-center justify-between">
                    <div>
                      <span className="text-white capitalize">{tier}</span>
                      <span className="text-white/40 text-xs ml-2">({data.count} users)</span>
                    </div>
                    <span className="text-white font-mono">${data.revenue?.toFixed(2) || '0.00'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}