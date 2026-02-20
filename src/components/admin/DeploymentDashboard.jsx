import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink, Rocket } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DeploymentDashboard() {
  const [deploymentStatus, setDeploymentStatus] = useState({
    google_drive: 'approved',
    facebook_oauth: 'pending',
    smart_contract: 'pending',
    creator_onboarding: 'active'
  });

  const checkGoogleDrive = async () => {
    try {
      await base44.functions.invoke('gdrive-export-project', { 
        project_id: 'test', 
        format: 'json' 
      });
      setDeploymentStatus(prev => ({ ...prev, google_drive: 'active' }));
      toast.success('Google Drive is active!');
    } catch (error) {
      if (error.message?.includes('No active connection')) {
        toast.error('Activate Google Drive in Dashboard > Integrations');
      }
    }
  };

  const steps = [
    {
      id: 'google_drive',
      title: 'Google Drive Integration',
      status: deploymentStatus.google_drive,
      action: 'Activate in Dashboard > Integrations',
      link: '/dashboard',
      autoCheck: checkGoogleDrive
    },
    {
      id: 'facebook_oauth',
      title: 'Facebook OAuth',
      status: deploymentStatus.facebook_oauth,
      action: 'Add App ID & Secret in Dashboard',
      link: '/dashboard'
    },
    {
      id: 'smart_contract',
      title: 'Polygon Smart Contract',
      status: deploymentStatus.smart_contract,
      action: 'Deploy via Deployment Center',
      link: '/deployment-center'
    },
    {
      id: 'creator_onboarding',
      title: 'Creator Onboarding',
      status: deploymentStatus.creator_onboarding,
      action: 'Already Active',
      link: '/dashboard?onboard=creator'
    }
  ];

  const getStatusColor = (status) => {
    if (status === 'active') return 'bg-green-500';
    if (status === 'approved') return 'bg-blue-500';
    if (status === 'pending') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <h2 className="text-white font-semibold text-xl mb-6">Deployment Checklist</h2>
      
      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className={`w-8 h-8 rounded-full ${getStatusColor(step.status)} flex items-center justify-center text-white font-bold`}>
              {step.status === 'active' ? <CheckCircle className="w-5 h-5" /> : index + 1}
            </div>
            
            <div className="flex-1">
              <h3 className="text-white font-medium">{step.title}</h3>
              <p className="text-white/60 text-sm">{step.action}</p>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(step.status)}>
                {step.status}
              </Badge>
              
              {step.autoCheck && step.status !== 'active' && (
                <Button size="sm" onClick={step.autoCheck} variant="outline" className="border-white/20 text-white">
                  Check
                </Button>
              )}

              {step.link && (
                <a href={step.link} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-white/20 text-white">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="text-white/70">
            Progress: {Object.values(deploymentStatus).filter(s => s === 'active').length}/4
          </div>
          <Button className="bg-[#f5a623]">
            <Rocket className="w-4 h-4 mr-2" />
            Launch Platform
          </Button>
        </div>
      </div>
    </Card>
  );
}