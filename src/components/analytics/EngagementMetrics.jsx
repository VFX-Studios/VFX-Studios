import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Users, Heart, Eye, DollarSign } from 'lucide-react';

export default function EngagementMetrics({ data }) {
  const metrics = [
    { label: 'Total Views', value: data?.totalViews || 0, icon: Eye, color: 'blue' },
    { label: 'Likes', value: data?.totalLikes || 0, icon: Heart, color: 'pink' },
    { label: 'Active Users', value: data?.activeUsers || 0, icon: Users, color: 'purple' },
    { label: 'Revenue', value: `$${(data?.revenue || 0).toFixed(2)}`, icon: DollarSign, color: 'green' }
  ];

  const colorClasses = {
    blue: 'from-blue-900/20 to-blue-700/20 border-blue-500/30',
    pink: 'from-pink-900/20 to-pink-700/20 border-pink-500/30',
    purple: 'from-purple-900/20 to-purple-700/20 border-purple-500/30',
    green: 'from-green-900/20 to-green-700/20 border-green-500/30'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className={`bg-gradient-to-br ${colorClasses[metric.color]} border p-6`}>
          <div className="flex items-center justify-between mb-2">
            <metric.icon className="w-6 h-6 text-white/70" />
            {data?.trend?.[metric.label] > 0 && (
              <TrendingUp className="w-4 h-4 text-green-400" />
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">{metric.value}</div>
          <div className="text-white/60 text-sm">{metric.label}</div>
        </Card>
      ))}
    </div>
  );
}