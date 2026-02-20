import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function FontMarketplace() {
  const [user, setUser] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: fonts = [], isLoading } = useQuery({
    queryKey: ['fonts'],
    queryFn: async () => {
      return await base44.entities.FontAsset.filter({ status: 'approved' }, '-download_count', 50);
    }
  });

  const handleUploadFont = async (e) => {
    e.preventDefault();
    setUploading(true);
    setVerificationResult(null);

    const formData = new FormData(e.target);
    const fontName = formData.get('font_name');
    const licenseType = formData.get('license_type');
    const price = formData.get('price');
    const fontFile = formData.get('font_file');

    try {
      // Step 1: Verify copyright
      setVerifying(true);
      const verification = await base44.functions.invoke('verify-font-copyright', {
        font_name: fontName
      });

      setVerificationResult(verification.data.verification);
      setVerifying(false);

      if (verification.data.verification.status === 'needs_documentation') {
        toast.error(verification.data.verification.rejection_reason);
        return;
      }

      // Step 2: Upload font file
      const uploadResult = await base44.integrations.Core.UploadFile({ file: fontFile });

      // Step 3: Create font asset
      const fontAsset = await base44.entities.FontAsset.create({
        creator_user_id: user.id,
        font_name: fontName,
        font_file_url: uploadResult.file_url,
        license_type: licenseType,
        price: parseFloat(price || 0),
        copyright_verified: verification.data.verification.status === 'verified',
        copyright_check_status: verification.data.verification.status,
        status: verification.data.verification.status === 'verified' ? 'approved' : 'pending_review'
      });

      toast.success('Font submitted successfully!');
      setUploadDialogOpen(false);
      e.target.reset();

    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Font Marketplace</h1>
            <p className="text-white/60">Browse and upload custom fonts for video overlays</p>
          </div>

          {user && (
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#f5a623]">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Font
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#1a0a3e] border-white/10 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Upload Custom Font</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUploadFont} className="space-y-4">
                  <div>
                    <Label className="text-white/70">Font Name</Label>
                    <Input name="font_name" required className="mt-2 bg-white/5 border-white/10 text-white" />
                  </div>

                  <div>
                    <Label className="text-white/70">Font File (.ttf, .otf, .woff)</Label>
                    <Input 
                      name="font_file" 
                      type="file" 
                      accept=".ttf,.otf,.woff,.woff2" 
                      required 
                      className="mt-2 bg-white/5 border-white/10 text-white" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/70">License Type</Label>
                      <Select name="license_type" required>
                        <SelectTrigger className="mt-2 bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select license" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a0a3e] border-white/10">
                          <SelectItem value="open_source">Open Source (OFL/MIT)</SelectItem>
                          <SelectItem value="commercial">Commercial License</SelectItem>
                          <SelectItem value="personal_use_only">Personal Use Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white/70">Price (USD) - 0 for free</Label>
                      <Input 
                        name="price" 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        defaultValue="0"
                        className="mt-2 bg-white/5 border-white/10 text-white" 
                      />
                    </div>
                  </div>

                  {/* Copyright Verification Alert */}
                  {verifying && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                      <span className="text-blue-300 text-sm">Verifying copyright...</span>
                    </div>
                  )}

                  {verificationResult && verificationResult.status === 'needs_documentation' && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-red-300 font-semibold text-sm mb-1">Copyright Match Detected</div>
                          <div className="text-red-200 text-xs">{verificationResult.rejection_reason}</div>
                        </div>
                      </div>
                      <div className="bg-red-500/20 rounded p-3 text-xs text-red-200">
                        <div className="font-semibold mb-1">⚠️ Action Required:</div>
                        <div>
                          To upload this font, please submit proof of license ownership:
                          <ul className="list-disc ml-4 mt-2 space-y-1">
                            <li>License purchase receipt</li>
                            <li>Commercial usage agreement</li>
                            <li>Designer contract (if custom-made)</li>
                          </ul>
                          <div className="mt-3">
                            Email: <a href="mailto:fonts@vfxstudios.com" className="underline">fonts@vfxstudios.com</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {verificationResult && verificationResult.status === 'verified' && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-300 text-sm">✓ Copyright verified - no issues detected</span>
                    </div>
                  )}

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-blue-300 text-xs">
                      All fonts are automatically checked against copyright databases. 
                      Protected fonts require proof of license.
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={uploading || verifying || (verificationResult?.status === 'needs_documentation')} 
                    className="w-full bg-[#f5a623]"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {verifying ? 'Verifying...' : 'Upload Font'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Fonts Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#f5a623] animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fonts.map((font) => (
              <Card key={font.id} className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition">
                <div className="text-4xl text-white mb-4" style={{ fontFamily: font.font_name }}>
                  Aa Bb Cc
                </div>
                <div className="text-white font-semibold mb-1">{font.font_name}</div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={font.price > 0 ? 'bg-[#f5a623]' : 'bg-green-500'}>
                    {font.price > 0 ? `$${font.price}` : 'Free'}
                  </Badge>
                  <Badge variant="outline" className="border-white/20 text-white/60">
                    {font.license_type}
                  </Badge>
                </div>
                <div className="text-white/40 text-xs">
                  {font.download_count || 0} downloads
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}