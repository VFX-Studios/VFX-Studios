import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Rocket, Code, CheckCircle, ExternalLink, Copy, FileText } from 'lucide-react';
import { toast } from 'sonner';
import PatentFilingGuide from '@/components/admin/PatentFilingGuide';

export default function DeploymentCenter() {
  const [user, setUser] = useState(null);
  const [contractAddress, setContractAddress] = useState('');
  const [deployed, setDeployed] = useState(false);
  const [compiledContract, setCompiledContract] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(u => {
      if (u.role !== 'admin') {
        window.location.href = '/';
      }
      setUser(u);
    });
  }, []);

  const handleCompile = async () => {
    try {
      const response = await base44.functions.invoke('deploy-polygon-testnet', {
        action: 'compile'
      });
      setCompiledContract(response.data.compiled);
      toast.success('Contract compiled!');
    } catch (error) {
      toast.error('Compilation failed');
    }
  };

  const handleGetDeploymentInfo = async () => {
    try {
      const response = await base44.functions.invoke('deploy-polygon-testnet', {
        action: 'deploy'
      });
      
      // Open Remix with pre-filled contract
      window.open(response.data.remix_url, '_blank');
      toast.success('Opening Remix IDE...');
    } catch (error) {
      toast.error('Failed to get deployment info');
    }
  };

  const handleStoreAddress = async () => {
    try {
      await base44.functions.invoke('deploy-polygon-testnet', {
        action: 'store_contract_address',
        contract_address: contractAddress,
        network: 'polygon-mumbai'
      });
      setDeployed(true);
      toast.success('Contract address stored!');
    } catch (error) {
      toast.error('Storage failed');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Deployment Center</h1>
          <p className="text-white/60">Deploy smart contracts and configure integrations</p>
        </div>

        <Tabs defaultValue="contracts">
          <TabsList className="bg-white/5">
            <TabsTrigger value="contracts">Smart Contracts</TabsTrigger>
            <TabsTrigger value="oauth">OAuth Config</TabsTrigger>
            <TabsTrigger value="drive">Google Drive</TabsTrigger>
            <TabsTrigger value="patent">
              <FileText className="w-4 h-4 mr-2" />
              Patent Filing
            </TabsTrigger>
          </TabsList>

          {/* Smart Contracts */}
          <TabsContent value="contracts" className="space-y-6">
            <Card className="bg-white/5 border-white/10 p-6">
              <h2 className="text-white font-semibold text-xl mb-4">Polygon Payment Contract</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-white/70 text-sm mb-1">Status</div>
                    <Badge className={deployed ? 'bg-green-500' : 'bg-yellow-500'}>
                      {deployed ? 'Deployed' : 'Not Deployed'}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <div className="text-white/70 text-sm mb-1">Network</div>
                    <Badge className="bg-purple-500">Polygon Mumbai Testnet</Badge>
                  </div>
                </div>

                {!deployed && (
                  <>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm">
                      <div className="text-blue-300 font-semibold mb-2">Deployment Steps:</div>
                      <ol className="text-blue-200/70 space-y-1 list-decimal list-inside">
                        <li>Get testnet MATIC from faucet</li>
                        <li>Compile contract</li>
                        <li>Deploy via Remix IDE</li>
                        <li>Store contract address below</li>
                      </ol>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleCompile}
                        className="bg-[#f5a623]"
                      >
                        <Code className="w-4 h-4 mr-2" />
                        1. Compile Contract
                      </Button>

                      <Button
                        onClick={handleGetDeploymentInfo}
                        disabled={!compiledContract}
                        variant="outline"
                        className="border-white/20 text-white"
                      >
                        <Rocket className="w-4 h-4 mr-2" />
                        2. Deploy in Remix
                      </Button>
                    </div>

                    <div>
                      <label className="text-white/70 text-sm">3. Paste Contract Address</label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={contractAddress}
                          onChange={(e) => setContractAddress(e.target.value)}
                          placeholder="0x..."
                          className="bg-white/5 border-white/10 text-white"
                        />
                        <Button
                          onClick={handleStoreAddress}
                          disabled={!contractAddress}
                          className="bg-green-600"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Store
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {deployed && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
                    <div className="text-green-300 font-semibold">Contract Deployed!</div>
                    <div className="text-green-200/70 text-sm mt-1">
                      Address: {contractAddress}
                    </div>
                  </div>
                )}

                <a 
                  href="https://faucet.polygon.technology"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full border-white/20 text-white">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Get Testnet MATIC
                  </Button>
                </a>
              </div>
            </Card>
          </TabsContent>

          {/* OAuth Config */}
          <TabsContent value="oauth" className="space-y-6">
            <Card className="bg-white/5 border-white/10 p-6">
              <h2 className="text-white font-semibold text-xl mb-4">Facebook OAuth Setup</h2>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <div className="text-yellow-300 font-semibold mb-2">⚠️ Configuration Required</div>
                <div className="text-yellow-200/70 text-sm space-y-1">
                  <div>1. Go to Dashboard → Integrations</div>
                  <div>2. Set FACEBOOK_APP_ID</div>
                  <div>3. Set FACEBOOK_APP_SECRET</div>
                </div>
              </div>

              <div className="space-y-3">
                <a 
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full bg-blue-600">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Create Facebook App
                  </Button>
                </a>

                <div className="bg-white/5 rounded-lg p-3 font-mono text-xs">
                  <div className="text-white/40 mb-1">Redirect URI:</div>
                  <div className="text-cyan-400 flex items-center justify-between">
                    <span>{window.location.origin}/auth/facebook/callback</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/auth/facebook/callback`);
                        toast.success('Copied!');
                      }}
                      className="text-white/60 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Google Drive */}
          <TabsContent value="drive" className="space-y-6">
            <Card className="bg-white/5 border-white/10 p-6">
              <h2 className="text-white font-semibold text-xl mb-4">Google Drive Integration</h2>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
                <div className="text-green-300 font-semibold">OAuth Approved</div>
                <div className="text-green-200/70 text-sm">
                  Activation pending - click button below
                </div>
              </div>

              <Button 
                onClick={() => window.open('/dashboard', '_blank')}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Activate in Dashboard → Integrations
              </Button>

              <div className="mt-4 text-white/60 text-sm">
                <div className="font-semibold mb-2">Features enabled:</div>
                <ul className="space-y-1">
                  <li>• Export VJ projects to Drive</li>
                  <li>• Format conversion (Resolume, TD, MadMapper)</li>
                  <li>• Collaborative file sharing</li>
                  <li>• Auto-backup on save</li>
                </ul>
              </div>
            </Card>
          </TabsContent>

          {/* Patent Filing */}
          <TabsContent value="patent">
            <PatentFilingGuide />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}