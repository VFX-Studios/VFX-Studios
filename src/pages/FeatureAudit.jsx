import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, AlertCircle, Play, Zap, Database, Code, Layout } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function FeatureAudit() {
  const [user, setUser] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      if (u?.role === 'admin') {
        runAudit();
      }
    }).catch(() => {});
  }, []);

  const runAudit = async () => {
    setTesting(true);
    try {
      const response = await base44.functions.invoke('run-feature-audit', {});
      setTestResults(response.data);
      toast.success('Audit complete');
    } catch (error) {
      toast.error('Audit failed');
    } finally {
      setTesting(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#050510] p-6 flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/60">Admin access required</p>
        </Card>
      </div>
    );
  }

  const categories = [
    { id: 'entities', label: 'Entities', icon: Database },
    { id: 'functions', label: 'Functions', icon: Code },
    { id: 'pages', label: 'Pages', icon: Layout },
    { id: 'components', label: 'Components', icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Feature Audit</h1>
            <p className="text-white/60">System health check and activation status</p>
          </div>
          <Button onClick={runAudit} disabled={testing} className="bg-[#f5a623]">
            <Play className="w-4 h-4 mr-2" />
            {testing ? 'Running...' : 'Run Audit'}
          </Button>
        </div>

        {testing && (
          <Card className="bg-white/5 border-white/10 p-8 mb-8 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-[#f5a623] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-white">Running comprehensive system audit...</p>
          </Card>
        )}

        {testResults && (
          <Tabs defaultValue="entities" className="space-y-6">
            <TabsList className="bg-white/5">
              {categories.map(cat => {
                const Icon = cat.icon;
                return (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    <Icon className="w-4 h-4 mr-2" />
                    {cat.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {categories.map(cat => (
              <TabsContent key={cat.id} value={cat.id}>
                <Card className="bg-white/5 border-white/10 p-6">
                  <div className="space-y-3">
                    {testResults[cat.id]?.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.status === 'active' ? (
                            <Check className="w-5 h-5 text-green-400" />
                          ) : item.status === 'inactive' ? (
                            <AlertCircle className="w-5 h-5 text-yellow-400" />
                          ) : (
                            <X className="w-5 h-5 text-red-400" />
                          )}
                          <div>
                            <div className="text-white font-semibold">{item.name}</div>
                            {item.description && (
                              <div className="text-white/60 text-sm">{item.description}</div>
                            )}
                          </div>
                        </div>
                        <Badge className={
                          item.status === 'active' ? 'bg-green-500/20 text-green-300' :
                          item.status === 'inactive' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }>
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}