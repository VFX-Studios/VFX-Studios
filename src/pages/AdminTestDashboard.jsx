import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Loader2, PlayCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import DeploymentDashboard from '@/components/admin/DeploymentDashboard';

export default function AdminTestDashboard() {
  const [user, setUser] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [securityResults, setSecurityResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [runningSecurity, setRunningSecurity] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(u => {
      if (u.role !== 'admin') {
        window.location.href = '/';
      }
      setUser(u);
    });
  }, []);

  const runTests = async () => {
    setRunning(true);
    try {
      const response = await base44.functions.invoke('test-suite-comprehensive', {});
      setTestResults(response.data);
      
      if (parseFloat(response.data.pass_rate) === 100) {
        toast.success('All tests passed! ✅');
      } else {
        toast.warning(`${response.data.pass_rate} tests passed`);
      }
    } catch (error) {
      toast.error('Test suite failed to run');
    } finally {
      setRunning(false);
    }
  };

  const runSecurityAudit = async () => {
    setRunningSecurity(true);
    try {
      const response = await base44.functions.invoke('security-audit-test', {});
      setSecurityResults(response.data);
      
      const score = parseFloat(response.data.security_score);
      if (score >= 90) {
        toast.success('Excellent security! 🛡️');
      } else if (score >= 70) {
        toast.warning('Security audit passed with warnings');
      } else {
        toast.error('Security vulnerabilities detected!');
      }
    } catch (error) {
      toast.error('Security audit failed to run');
    } finally {
      setRunningSecurity(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">System Test & Deployment</h1>
          <p className="text-white/60">Comprehensive platform verification & configuration</p>
        </div>

        <Tabs defaultValue="tests">
          <TabsList className="bg-white/5 mb-6">
            <TabsTrigger value="tests">Feature Tests</TabsTrigger>
            <TabsTrigger value="security">Security Audit</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
          </TabsList>

          {/* Feature Tests Tab */}
          <TabsContent value="tests">
            <Card className="bg-white/5 border-white/10 p-6 mb-6">
              <Button 
                onClick={runTests} 
                disabled={running}
                className="bg-gradient-to-r from-[#f5a623] to-[#e91e8c]"
              >
                {running ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Run Comprehensive Test Suite
                  </>
                )}
              </Button>
            </Card>

        {testResults && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-900/20 to-blue-700/20 border-blue-500/30 p-6">
                <div className="text-3xl font-bold text-white mb-2">{testResults.tests_run}</div>
                <div className="text-blue-300 text-sm">Tests Run</div>
              </Card>
              <Card className="bg-gradient-to-br from-green-900/20 to-green-700/20 border-green-500/30 p-6">
                <div className="text-3xl font-bold text-white mb-2">{testResults.tests_passed}</div>
                <div className="text-green-300 text-sm">Passed</div>
              </Card>
              <Card className="bg-gradient-to-br from-red-900/20 to-red-700/20 border-red-500/30 p-6">
                <div className="text-3xl font-bold text-white mb-2">{testResults.tests_failed}</div>
                <div className="text-red-300 text-sm">Failed</div>
              </Card>
              <Card className="bg-gradient-to-br from-purple-900/20 to-purple-700/20 border-purple-500/30 p-6">
                <div className="text-3xl font-bold text-white mb-2">{testResults.pass_rate}</div>
                <div className="text-purple-300 text-sm">Pass Rate</div>
              </Card>
            </div>

            {/* Detailed Results */}
            <Card className="bg-white/5 border-white/10 p-6">
              <h2 className="text-white font-semibold text-xl mb-4">Test Details</h2>
              <div className="space-y-2">
                {testResults.details.map((detail, index) => (
                  <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      {detail.status === 'PASS' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className="text-white font-medium">{detail.test}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {detail.count !== undefined && (
                        <span className="text-white/60 text-sm">{detail.count} records</span>
                      )}
                      <Badge className={detail.status === 'PASS' ? 'bg-green-500' : 'bg-red-500'}>
                        {detail.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            </>
            )}
            </TabsContent>

            {/* Security Audit Tab */}
            <TabsContent value="security">
            <Card className="bg-white/5 border-white/10 p-6 mb-6">
            <Button 
              onClick={runSecurityAudit} 
              disabled={runningSecurity}
              className="bg-gradient-to-r from-red-600 to-orange-600"
            >
              {runningSecurity ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Security Audit...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Run Security Audit
                </>
              )}
            </Button>
            </Card>

            {securityResults && (
            <Card className="bg-white/5 border-white/10 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-semibold text-xl">Security Score</h2>
                <Badge className={
                  parseFloat(securityResults.security_score) >= 90 ? 'bg-green-500' :
                  parseFloat(securityResults.security_score) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                }>
                  {securityResults.security_score}
                </Badge>
              </div>

              <div className="space-y-3">
                {securityResults.tests.map((test, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      {test.status === 'PASS' ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : test.status === 'WARNING' ? (
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className="text-white font-medium">{test.test}</span>
                    </div>
                    <div className="text-right">
                      <Badge className={
                        test.status === 'PASS' ? 'bg-green-500' :
                        test.status === 'WARNING' ? 'bg-yellow-500' : 'bg-red-500'
                      }>
                        {test.status}
                      </Badge>
                      {test.detail && (
                        <div className="text-white/60 text-xs mt-1">{test.detail}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            )}
            </TabsContent>

            {/* Deployment Tab */}
            <TabsContent value="deployment">
            <DeploymentDashboard />
            </TabsContent>
            </Tabs>
            </div>
            </div>
            );
            }