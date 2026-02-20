import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bot, Settings, Activity, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const agentConfigs = [
  { id: 'task_management_agent', name: 'Task Management', icon: '📋', color: 'blue' },
  { id: 'customer_support_agent', name: 'Customer Support', icon: '💬', color: 'green' },
  { id: 'content_management_agent', name: 'Content Management', icon: '📝', color: 'purple' },
  { id: 'data_entry_agent', name: 'Data Entry', icon: '📊', color: 'amber' },
  { id: 'reporting_agent', name: 'Reporting', icon: '📈', color: 'pink' },
];

export default function AgentManagement() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentStatus, setAgentStatus] = useState({});
  const queryClient = useQueryClient();

  const { data: agentLogs = [] } = useQuery({
    queryKey: ['agent-activity-logs'],
    queryFn: async () => {
      // Fetch recent analytics events related to agents
      const events = await base44.entities.AnalyticsEvent.filter(
        { event_type: 'agent_activity' },
        '-created_date',
        100
      );
      return events;
    },
    refetchInterval: 10000,
  });

  const updateAgentConfigMutation = useMutation({
    mutationFn: async ({ agentId, config }) => {
      // Update agent configuration via backend function
      const response = await base44.functions.invoke('update-agent-config', {
        agent_id: agentId,
        config,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-configs'] });
      toast.success('Agent configuration updated');
    },
    onError: (error) => {
      toast.error('Failed to update agent configuration');
      console.error('Agent config update error:', error);
    },
  });

  const toggleAgentMutation = useMutation({
    mutationFn: async ({ agentId, enabled }) => {
      const response = await base44.functions.invoke('toggle-agent', {
        agent_id: agentId,
        enabled,
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      setAgentStatus(prev => ({ ...prev, [variables.agentId]: variables.enabled }));
      toast.success(`Agent ${variables.enabled ? 'enabled' : 'disabled'}`);
    },
  });

  const handleToggleAgent = (agentId, currentStatus) => {
    toggleAgentMutation.mutate({ agentId, enabled: !currentStatus });
  };

  const getAgentStats = (agentId) => {
    const agentActivities = agentLogs.filter(
      log => log.metadata?.agent_id === agentId
    );
    return {
      totalActivities: agentActivities.length,
      recentActivity: agentActivities[0]?.created_date,
      successRate: agentActivities.filter(a => a.metadata?.success).length / Math.max(agentActivities.length, 1) * 100,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-[#f5a623]" />
          <h2 className="text-white text-xl font-medium">AI Agent Management</h2>
        </div>
        <Badge className="bg-green-500/20 text-green-400">
          {agentConfigs.filter(a => agentStatus[a.id] !== false).length}/{agentConfigs.length} Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agentConfigs.map(agent => {
          const stats = getAgentStats(agent.id);
          const isEnabled = agentStatus[agent.id] !== false;

          return (
            <div
              key={agent.id}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{agent.icon}</div>
                  <div>
                    <h3 className="text-white font-medium">{agent.name}</h3>
                    <p className="text-white/40 text-xs">
                      {stats.totalActivities} activities
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => handleToggleAgent(agent.id, isEnabled)}
                  />
                  {isEnabled ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="text-white/40 text-[10px] mb-1">Activities</div>
                  <div className="text-white font-mono text-sm">{stats.totalActivities}</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="text-white/40 text-[10px] mb-1">Success Rate</div>
                  <div className="text-white font-mono text-sm">{stats.successRate.toFixed(0)}%</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="text-white/40 text-[10px] mb-1">Status</div>
                  <div className={`text-sm font-medium ${isEnabled ? 'text-green-400' : 'text-red-400'}`}>
                    {isEnabled ? 'Active' : 'Disabled'}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-white/10 text-white/70"
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <Settings className="w-3 h-3 mr-2" />
                      Configure
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1a0a3e] border-white/10 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-white">Configure {agent.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white/70 mb-2">Agent Instructions</Label>
                        <Textarea
                          placeholder="Update agent behavior and instructions..."
                          className="bg-white/5 border-white/10 text-white h-32"
                          defaultValue="Default agent configuration..."
                        />
                      </div>
                      <div>
                        <Label className="text-white/70 mb-2">WhatsApp Integration</Label>
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-white/40" />
                          <a
                            href={base44.agents.getWhatsAppConnectURL(agent.id)}
                            target="_blank"
                            className="text-[#f5a623] hover:underline text-sm"
                          >
                            Connect WhatsApp
                          </a>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-[#f5a623] hover:bg-[#e91e8c]"
                        onClick={() => {
                          updateAgentConfigMutation.mutate({
                            agentId: agent.id,
                            config: { /* updated config */ }
                          });
                        }}
                      >
                        Save Configuration
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 text-white/70"
                    >
                      <Activity className="w-3 h-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#1a0a3e] border-white/10 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-white">Activity Logs - {agent.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {agentLogs
                        .filter(log => log.metadata?.agent_id === agent.id)
                        .slice(0, 20)
                        .map(log => (
                          <div
                            key={log.id}
                            className="bg-white/5 rounded-lg p-3 border border-white/10"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge className={log.metadata?.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                                {log.metadata?.success ? 'Success' : 'Error'}
                              </Badge>
                              <span className="text-white/40 text-xs">
                                {new Date(log.created_date).toLocaleString()}
                              </span>
                            </div>
                            <div className="text-white/70 text-sm">
                              {log.metadata?.action || 'Activity'}
                            </div>
                            {log.metadata?.details && (
                              <div className="text-white/40 text-xs mt-1">
                                {log.metadata.details}
                              </div>
                            )}
                          </div>
                        ))}
                      {agentLogs.filter(log => log.metadata?.agent_id === agent.id).length === 0 && (
                        <div className="text-center text-white/40 py-8">
                          No activity logs yet
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}