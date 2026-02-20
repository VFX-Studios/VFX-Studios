import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, CheckCircle, AlertTriangle, Clock, FileText, Lock, Database, Users, Activity } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SOC2Compliance() {
  const [user, setUser] = useState(null);
  const [checklistProgress, setChecklistProgress] = useState(0);

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u || u.role !== 'admin') {
        window.location.href = '/';
      }
      setUser(u);
    });

    // Calculate progress
    const completed = complianceChecklist.filter(cat => 
      cat.items.every(item => item.status === 'complete')
    ).length;
    setChecklistProgress((completed / complianceChecklist.length) * 100);
  }, []);

  const complianceChecklist = [
    {
      category: 'Security (CC6)',
      icon: Shield,
      color: 'from-blue-500 to-cyan-500',
      items: [
        { id: 'sec1', name: 'Multi-factor authentication (MFA)', status: 'complete', notes: 'Google OAuth implemented' },
        { id: 'sec2', name: 'Password encryption (bcrypt/SHA-256)', status: 'complete', notes: 'SHA-256 hashing active' },
        { id: 'sec3', name: 'Role-based access control (RBAC)', status: 'complete', notes: 'Admin/User/Creator roles' },
        { id: 'sec4', name: 'API token encryption', status: 'complete', notes: 'SHA-256 hashed tokens' },
        { id: 'sec5', name: 'SQL injection prevention', status: 'complete', notes: 'Parameterized queries (Base44 SDK)' },
        { id: 'sec6', name: 'XSS protection', status: 'complete', notes: 'React auto-escaping + CSP headers' },
        { id: 'sec7', name: 'CSRF protection', status: 'complete', notes: 'SameSite cookies + CORS' },
        { id: 'sec8', name: 'Rate limiting', status: 'in-progress', notes: 'Need Cloudflare Workers (1000 req/hr)' },
        { id: 'sec9', name: 'DDoS protection', status: 'pending', notes: 'Cloudflare required' },
        { id: 'sec10', name: 'Penetration testing', status: 'pending', notes: 'Schedule external audit Q2 2026' }
      ]
    },
    {
      category: 'Confidentiality (CC7)',
      icon: Lock,
      color: 'from-purple-500 to-pink-500',
      items: [
        { id: 'conf1', name: 'Data encryption at rest', status: 'complete', notes: 'Supabase AES-256 encryption' },
        { id: 'conf2', name: 'Data encryption in transit (TLS 1.3)', status: 'complete', notes: 'HTTPS enforced' },
        { id: 'conf3', name: 'Secure file storage', status: 'complete', notes: 'Signed URLs, expiring tokens' },
        { id: 'conf4', name: 'PII data masking', status: 'in-progress', notes: 'Mask emails in logs' },
        { id: 'conf5', name: 'Data classification policy', status: 'pending', notes: 'Document sensitive data types' },
        { id: 'conf6', name: 'Secrets management', status: 'complete', notes: 'Deno.env + Base44 secrets' },
        { id: 'conf7', name: 'Third-party vendor security', status: 'in-progress', notes: 'PayPal (PCI DSS), Base44/Supabase providers' }
      ]
    },
    {
      category: 'Availability (CC3)',
      icon: Activity,
      color: 'from-green-500 to-emerald-500',
      items: [
        { id: 'avail1', name: 'Uptime monitoring (99.9% SLA)', status: 'in-progress', notes: 'Set up UptimeRobot' },
        { id: 'avail2', name: 'Automated backups (daily)', status: 'complete', notes: 'Supabase point-in-time recovery' },
        { id: 'avail3', name: 'Disaster recovery plan', status: 'pending', notes: 'Document RPO/RTO targets' },
        { id: 'avail4', name: 'Redundant infrastructure', status: 'complete', notes: 'Multi-region Supabase' },
        { id: 'avail5', name: 'Load balancing', status: 'complete', notes: 'Cloudflare CDN' },
        { id: 'avail6', name: 'Auto-scaling', status: 'complete', notes: 'Deno Deploy auto-scale' },
        { id: 'avail7', name: 'Incident response plan', status: 'pending', notes: 'Create runbook for outages' }
      ]
    },
    {
      category: 'Privacy (GDPR/CCPA)',
      icon: Users,
      color: 'from-orange-500 to-red-500',
      items: [
        { id: 'priv1', name: 'Privacy policy published', status: 'complete', notes: 'Available at /terms' },
        { id: 'priv2', name: 'Cookie consent banner', status: 'pending', notes: 'Add EU cookie consent' },
        { id: 'priv3', name: 'Data deletion (Right to be Forgotten)', status: 'pending', notes: 'Create delete-user function' },
        { id: 'priv4', name: 'Data export (Right to Access)', status: 'pending', notes: 'Export user data to JSON' },
        { id: 'priv5', name: 'Data retention policy', status: 'in-progress', notes: 'Auto-delete analytics after 90 days' },
        { id: 'priv6', name: 'Third-party data sharing disclosure', status: 'complete', notes: 'PayPal payment processor only' },
        { id: 'priv7', name: 'DPA (Data Processing Agreement)', status: 'pending', notes: 'Legal review required' }
      ]
    },
    {
      category: 'Change Management (CC8)',
      icon: FileText,
      color: 'from-indigo-500 to-purple-500',
      items: [
        { id: 'change1', name: 'Version control (Git)', status: 'complete', notes: 'GitHub repository' },
        { id: 'change2', name: 'Code review process', status: 'complete', notes: 'AI-assisted reviews (Codex Guardian)' },
        { id: 'change3', name: 'Deployment pipeline (CI/CD)', status: 'complete', notes: 'Base44 auto-deploy' },
        { id: 'change4', name: 'Change approval workflow', status: 'pending', notes: 'Require admin approval for production' },
        { id: 'change5', name: 'Rollback procedures', status: 'complete', notes: 'Base44 version history' },
        { id: 'change6', name: 'Release notes documentation', status: 'pending', notes: 'Create changelog page' }
      ]
    },
    {
      category: 'Monitoring & Logging (CC7)',
      icon: Database,
      color: 'from-pink-500 to-rose-500',
      items: [
        { id: 'log1', name: 'Access logs retention (1 year)', status: 'complete', notes: 'AnalyticsEvent entity' },
        { id: 'log2', name: 'Error logging & alerting', status: 'in-progress', notes: 'Console errors logged, need Sentry' },
        { id: 'log3', name: 'Audit trail for admin actions', status: 'complete', notes: 'All admin functions logged' },
        { id: 'log4', name: 'Real-time security monitoring', status: 'pending', notes: 'Set up anomaly detection' },
        { id: 'log5', name: 'Performance monitoring (APM)', status: 'pending', notes: 'Integrate New Relic or Datadog' },
        { id: 'log6', name: 'Log data encryption', status: 'complete', notes: 'Logs stored encrypted' }
      ]
    }
  ];

  const getStatusBadge = (status) => {
    const config = {
      complete: { color: 'bg-green-500', icon: CheckCircle, text: 'Complete' },
      'in-progress': { color: 'bg-yellow-500', icon: Clock, text: 'In Progress' },
      pending: { color: 'bg-red-500', icon: AlertTriangle, text: 'Pending' }
    };
    const StatusIcon = config[status].icon;
    return (
      <Badge className={`${config[status].color} text-white`}>
        <StatusIcon className="w-3 h-3 mr-1" />
        {config[status].text}
      </Badge>
    );
  };

  const exportChecklist = () => {
    const data = JSON.stringify(complianceChecklist, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `soc2-checklist-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Checklist exported');
  };

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-10 h-10 text-[#f5a623]" />
              <div>
                <h1 className="text-3xl font-bold text-white">SOC 2 Compliance Dashboard</h1>
                <p className="text-white/60">Type II Audit Preparation</p>
              </div>
            </div>
            <Button onClick={exportChecklist} variant="outline" className="border-white/10 text-white">
              <FileText className="w-4 h-4 mr-2" />
              Export Checklist
            </Button>
          </div>

          {/* Progress Overview */}
          <Card className="bg-white/5 border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-white/60 text-sm mb-1">Overall Compliance</div>
                <div className="text-3xl font-bold text-white">{checklistProgress.toFixed(1)}%</div>
              </div>
              <div className="text-right">
                <div className="text-white/60 text-sm mb-1">Status</div>
                <Badge className="bg-yellow-500 text-white">In Progress</Badge>
              </div>
            </div>
            <Progress value={checklistProgress} className="h-3" />
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {complianceChecklist.reduce((acc, cat) => 
                    acc + cat.items.filter(i => i.status === 'complete').length, 0
                  )}
                </div>
                <div className="text-white/60 text-xs">Complete</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {complianceChecklist.reduce((acc, cat) => 
                    acc + cat.items.filter(i => i.status === 'in-progress').length, 0
                  )}
                </div>
                <div className="text-white/60 text-xs">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {complianceChecklist.reduce((acc, cat) => 
                    acc + cat.items.filter(i => i.status === 'pending').length, 0
                  )}
                </div>
                <div className="text-white/60 text-xs">Pending</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Compliance Categories */}
        <div className="space-y-6">
          {complianceChecklist.map((category, i) => {
            const Icon = category.icon;
            const completedItems = category.items.filter(item => item.status === 'complete').length;
            const progressPercent = (completedItems / category.items.length) * 100;

            return (
              <Card key={i} className="bg-white/5 border-white/10 overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${category.color}`}></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold text-lg">{category.category}</h3>
                        <p className="text-white/60 text-sm">
                          {completedItems}/{category.items.length} controls implemented
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{progressPercent.toFixed(0)}%</div>
                    </div>
                  </div>

                  <Progress value={progressPercent} className="mb-4 h-2" />

                  <div className="space-y-3">
                    {category.items.map((item, j) => (
                      <div key={j} className="bg-black/20 rounded-lg p-4 border border-white/5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="text-white font-medium text-sm mb-1">{item.name}</div>
                            <div className="text-white/40 text-xs">{item.notes}</div>
                          </div>
                          {getStatusBadge(item.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Audit Timeline */}
        <Card className="bg-white/5 border-white/10 p-6 mt-8">
          <h3 className="text-white font-semibold text-xl mb-4">Audit Timeline</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-24 text-white/60 text-sm">Q1 2026</div>
              <div className="flex-1 bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                <div className="text-green-400 font-medium text-sm">Internal Assessment Complete</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 text-white/60 text-sm">Q2 2026</div>
              <div className="flex-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                <div className="text-yellow-400 font-medium text-sm">External Audit Scheduled</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 text-white/60 text-sm">Q3 2026</div>
              <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3">
                <div className="text-white/60 font-medium text-sm">SOC 2 Type II Certification</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Next Actions */}
        <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-400/30 p-6 mt-8">
          <h3 className="text-white font-semibold text-xl mb-4">Priority Actions</h3>
          <ul className="space-y-2">
            <li className="text-white/80 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Implement rate limiting (Cloudflare Workers)
            </li>
            <li className="text-white/80 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Schedule penetration testing (external vendor)
            </li>
            <li className="text-white/80 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Implement GDPR data deletion endpoint
            </li>
            <li className="text-white/80 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Create incident response runbook
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
