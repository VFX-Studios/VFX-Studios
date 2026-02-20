import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AgentDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const agents = [
    {
      id: 'performance_heatmap',
      name: 'Performance Heatmap AI',
      description: 'Analyzes audience reactions and generates actionable insights',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      capabilities: [
        'Real-time sentiment tracking',
        'Identifies peak moments',
        'Suggests visual improvements',
        'Generates heatmap reports'
      ],
      whatsapp: base44.agents?.getWhatsAppConnectURL ? base44.agents.getWhatsAppConnectURL('performance_heatmap_agent') : '#'
    },
    {
      id: 'marketing_content',
      name: 'Marketing Content AI',
      description: 'Creates promotional posts and marketing materials',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-500',
      capabilities: [
        'Writes blog posts automatically',
        'Generates social media content',
        'Creates press releases',
        'SEO-optimized copy'
      ],
      whatsapp: base44.agents?.getWhatsAppConnectURL ? base44.agents.getWhatsAppConnectURL('marketing_content_agent') : '#'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AI Agent Dashboard</h1>
          <p className="text-white/60">Autonomous AI assistants working 24/7 for your platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents.map((agent, i) => {
            const Icon = agent.icon;
            
            return (
              <Card key={i} className="bg-white/5 border-white/10 p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-xl mb-1">{agent.name}</h3>
                    <p className="text-white/60 text-sm">{agent.description}</p>
                  </div>
                  <Badge className="bg-green-500">Active</Badge>
                </div>

                <div className="mb-6">
                  <div className="text-white/70 text-sm mb-3">Capabilities:</div>
                  <ul className="space-y-2">
                    {agent.capabilities.map((cap, j) => (
                      <li key={j} className="flex items-center gap-2 text-white/60 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#f5a623]"></div>
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                    <Brain className="w-4 h-4 mr-2" />
                    Chat with Agent
                  </Button>
                  
                  <a href={agent.whatsapp} target="_blank" rel="noopener">
                    <Button variant="outline" className="w-full border-green-500/30 text-green-400">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Connect via WhatsApp
                    </Button>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Usage Stats */}
        <Card className="bg-white/5 border-white/10 p-6 mt-8">
          <h2 className="text-white font-semibold text-xl mb-6">Agent Activity</h2>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">156</div>
              <div className="text-white/60 text-sm">Insights Generated</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">43</div>
              <div className="text-white/60 text-sm">Blog Posts Created</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">2,347</div>
              <div className="text-white/60 text-sm">Messages Processed</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}