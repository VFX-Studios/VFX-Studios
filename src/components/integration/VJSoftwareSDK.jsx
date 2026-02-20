import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Upload, Zap, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function VJSoftwareSDK({ projectId, projectData }) {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('resolume');
  const [driveExport, setDriveExport] = useState(false);

  const handleExportToFormat = async () => {
    setExporting(true);
    try {
      const response = await base44.functions.invoke('gdrive-export-project', {
        project_id: projectId,
        format: exportFormat
      });

      if (response.data?.file_id) {
        setDriveExport(true);
        toast.success(`Exported to Google Drive! Opening...`);
        window.open(response.data.drive_url, '_blank');
      }
    } catch (error) {
      toast.error('Export failed. Check Google Drive authorization.');
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const handleLocalDownload = () => {
    const formats = {
      resolume: {
        ext: 'avc',
        data: {
          version: "7.0",
          composition: {
            name: projectData?.session_name || 'VFX Project',
            layers: projectData?.layers || [],
            clips: projectData?.visual_data?.clips || [],
            effects: projectData?.effects || []
          }
        }
      },
      touchdesigner: {
        ext: 'toe.json',
        data: {
          project_name: projectData?.session_name,
          operators: projectData?.parameters || {},
          network: projectData?.visual_data || {}
        }
      },
      madmapper: {
        ext: 'madmap',
        data: {
          name: projectData?.session_name,
          surfaces: projectData?.layers || [],
          materials: projectData?.effects || [],
          version: "5.0"
        }
      }
    };

    const format = formats[exportFormat];
    const blob = new Blob([JSON.stringify(format.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectData?.session_name || 'project'}.${format.ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded!');
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      // Upload file first
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Detect format from extension
      const ext = file.name.split('.').pop();
      const formatMap = {
        'avc': 'resolume',
        'toe': 'touchdesigner',
        'json': 'touchdesigner',
        'madmap': 'madmapper'
      };

      const sourceFormat = formatMap[ext] || 'json';

      // Process import
      const fileContent = await fetch(file_url).then(r => r.text());
      const parsedData = JSON.parse(fileContent);

      // Convert and create VJ session
      let convertedProject = {};
      
      if (sourceFormat === 'resolume') {
        convertedProject = {
          session_name: parsedData.composition?.name || 'Imported Project',
          layers: parsedData.composition?.layers || [],
          visual_data: { clips: parsedData.composition?.clips || [] },
          effects: parsedData.composition?.effects || []
        };
      } else if (sourceFormat === 'touchdesigner') {
        convertedProject = {
          session_name: parsedData.project_name || 'Imported TD Project',
          parameters: parsedData.operators || {},
          visual_data: parsedData.network || {}
        };
      } else if (sourceFormat === 'madmapper') {
        convertedProject = {
          session_name: parsedData.name || 'Imported MadMapper',
          layers: parsedData.surfaces || [],
          effects: parsedData.materials || []
        };
      }

      const user = await base44.auth.me();
      await base44.entities.VJSession.create({
        user_id: user.id,
        ...convertedProject,
        imported_from: sourceFormat
      });

      toast.success('Project imported successfully!');
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error('Import failed');
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 p-6">
      <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-[#f5a623]" />
        VJ Software Integration SDK
      </h3>

      <div className="space-y-4">
        {/* Export Section */}
        <div>
          <div className="text-white/70 text-sm mb-2">Export Format</div>
          <div className="flex gap-3">
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="flex-1 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a0a3e] border-white/10">
                <SelectItem value="resolume">
                  <div className="flex items-center gap-2">
                    Resolume Arena (.avc)
                    <Badge className="bg-green-500 text-xs">Popular</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="touchdesigner">TouchDesigner (.toe.json)</SelectItem>
                <SelectItem value="madmapper">MadMapper (.madmap)</SelectItem>
                <SelectItem value="json">Generic JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleLocalDownload}
            variant="outline"
            className="border-white/20 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={handleExportToFormat}
            disabled={exporting}
            className="bg-gradient-to-r from-blue-600 to-cyan-600"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <img 
                src="https://www.google.com/drive/static/images/drive/logo.svg" 
                alt="Drive"
                className="w-4 h-4 mr-2"
              />
            )}
            {driveExport ? 'Exported ✓' : 'Export to Drive'}
          </Button>
        </div>

        {/* Import Section */}
        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="text-white/70 text-sm mb-2">Import Project</div>
          <div className="relative">
            <input
              type="file"
              accept=".avc,.toe,.json,.madmap"
              onChange={handleImport}
              disabled={importing}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Button
              disabled={importing}
              variant="outline"
              className="w-full border-white/20 text-white"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import from Resolume/TD/MadMapper
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Real-Time Plugin Info */}
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-sm">
          <div className="text-purple-300 font-semibold mb-1">🔌 Real-Time Plugin</div>
          <div className="text-purple-200/70 text-xs">
            Enable WebSocket sync in VJ software to control VFX Studios remotely via OSC/MIDI
          </div>
        </div>
      </div>
    </Card>
  );
}