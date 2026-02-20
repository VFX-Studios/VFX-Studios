import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AssetPriceChart({ assetId }) {
  const { data: priceHistory = [], isLoading } = useQuery({
    queryKey: ['price-history', assetId],
    queryFn: async () => {
      return await base44.entities.AssetPriceHistory.filter(
        { marketplace_asset_id: assetId },
        '-recorded_at',
        30
      );
    }
  });

  if (isLoading) {
    return <div className="text-white/60 text-sm">Loading price data...</div>;
  }

  if (priceHistory.length === 0) {
    return <div className="text-white/40 text-sm">No price history available yet</div>;
  }

  // Calculate price trend
  const latestPrice = priceHistory[0]?.price || 0;
  const oldestPrice = priceHistory[priceHistory.length - 1]?.price || latestPrice;
  const priceChange = ((latestPrice - oldestPrice) / oldestPrice) * 100;

  const chartData = priceHistory
    .slice()
    .reverse()
    .map(item => ({
      date: new Date(item.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: item.price,
      demand: item.market_demand_index
    }));

  const getTrendIcon = () => {
    if (priceChange > 2) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (priceChange < -2) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-white/60" />;
  };

  const getTrendColor = () => {
    if (priceChange > 2) return 'text-green-400';
    if (priceChange < -2) return 'text-red-400';
    return 'text-white/60';
  };

  return (
    <Card className="bg-white/5 border-white/10 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-white/60 text-xs mb-1">Price Analytics</div>
          <div className="text-white text-2xl font-bold">${latestPrice.toFixed(2)}</div>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${getTrendColor()}`}>
            {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="date" 
            stroke="rgba(255,255,255,0.5)" 
            style={{ fontSize: '10px' }}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.5)" 
            style={{ fontSize: '10px' }}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1a0a3e', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px'
            }}
            labelStyle={{ color: '#fff' }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#f5a623" 
            strokeWidth={2}
            dot={{ fill: '#f5a623', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="bg-black/20 rounded p-2">
          <div className="text-white/40 text-xs">Avg Price</div>
          <div className="text-white text-sm font-semibold">
            ${(chartData.reduce((sum, d) => sum + d.price, 0) / chartData.length).toFixed(2)}
          </div>
        </div>
        <div className="bg-black/20 rounded p-2">
          <div className="text-white/40 text-xs">Demand</div>
          <div className="text-white text-sm font-semibold">
            {priceHistory[0]?.market_demand_index?.toFixed(0) || 'N/A'}
          </div>
        </div>
        <div className="bg-black/20 rounded p-2">
          <div className="text-white/40 text-xs">Velocity</div>
          <div className="text-white text-sm font-semibold">
            {priceHistory[0]?.sales_velocity?.toFixed(1) || '0'}/day
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-white/40">
        ⚖️ Price visualization for informational purposes only. Not financial advice.
      </div>
    </Card>
  );
}