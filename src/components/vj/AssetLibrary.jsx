import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Search, Video, Grid3x3, Trash2, Star, Share2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AssetLibrary({ sessionId, onSelectAsset }) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [uploadData, setUploadData] = useState({
    name: '',
    description: '',
    tags: '',
    type: 'image',
    isPublic: false,
    category_id: null
  });
  const [uploading, setUploading] = useState(false);
  const [autoTagging, setAutoTagging] = useState(false);
  const [smartSearchQuery, setSmartSearchQuery] = useState('');
  const [smartSearching, setSmartSearching] = useState(false);
  const [smartResults, setSmartResults] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['visual-assets', user?.id],
    queryFn: async () => {
      const userAssets = await base44.entities.VisualAsset.filter({ user_id: user.id });
      const publicAssets = await base44.entities.VisualAsset.filter({ is_public: true });
      return [...userAssets, ...publicAssets.filter(a => a.user_id !== user.id)];
    },
    enabled: !!user
  });

  const deleteAssetMutation = useMutation({
    mutationFn: (id) => base44.entities.VisualAsset.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visual-assets'] });
      toast.success('Asset deleted');
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const asset = await base44.entities.VisualAsset.create({
        user_id: user.id,
        name: uploadData.name || file.name,
        file_url,
        type: uploadData.type,
        tags: uploadData.tags.split(',').map(t => t.trim()).filter(Boolean),
        description: uploadData.description,
        file_size: file.size,
        is_public: uploadData.isPublic,
        category_id: uploadData.category_id
      });

      // Auto-tag with AI
      if (autoTagging && uploadData.type === 'image') {
        try {
          const { data } = await base44.functions.invoke('ai-tag-assets', {
            assetId: asset.id,
            imageUrl: file_url
          });
          toast.success(`Asset uploaded & AI-tagged with ${data.tags.length} tags!`);
        } catch (error) {
          toast.success('Asset uploaded (AI tagging failed)');
        }
      } else {
        toast.success('Asset uploaded successfully');
      }

      queryClient.invalidateQueries({ queryKey: ['visual-assets'] });
      setUploadDialogOpen(false);
      setUploadData({ name: '', description: '', tags: '', type: 'image', isPublic: false, category_id: null });
    } catch (error) {
      toast.error('Upload failed');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSmartSearch = async () => {
    if (!smartSearchQuery.trim()) return;

    setSmartSearching(true);
    try {
      const { data } = await base44.functions.invoke('smart-asset-search', {
        query: smartSearchQuery
      });

      setSmartResults(data.assets);
      toast.success(`Found ${data.assets.length} matching assets`);
    } catch (error) {
      toast.error('Smart search failed');
    } finally {
      setSmartSearching(false);
    }
  };

  const toggleFavorite = async (assetId, currentRating) => {
    try {
      await base44.entities.VisualAsset.update(assetId, {
        rating: currentRating === 5 ? null : 5
      });
      queryClient.invalidateQueries({ queryKey: ['visual-assets'] });
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const displayAssets = smartResults || assets;
  
  const filteredAssets = displayAssets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-xl border border-indigo-500/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-4 h-4 text-indigo-400" />
          <h3 className="text-white/90 font-medium text-sm">VJ Asset Library</h3>
          <Badge variant="outline" className="text-indigo-400 border-indigo-400/30">
            {assets.length}
          </Badge>
        </div>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs">
              <Upload className="w-3 h-3 mr-2" />
              Upload Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1a0a3e] border-white/10">
            <DialogHeader>
              <DialogTitle className="text-white">Upload Visual Asset</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white/70 text-xs">Asset Name</Label>
                <Input
                  value={uploadData.name}
                  onChange={(e) => setUploadData(d => ({ ...d, name: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white text-sm"
                  placeholder="My awesome visual"
                />
              </div>
              
              <div>
                <Label className="text-white/70 text-xs">Type</Label>
                <Select value={uploadData.type} onValueChange={(v) => setUploadData(d => ({ ...d, type: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video Loop</SelectItem>
                    <SelectItem value="animation">Animation</SelectItem>
                    <SelectItem value="shader">Shader</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white/70 text-xs">Tags (comma-separated)</Label>
                <Input
                  value={uploadData.tags}
                  onChange={(e) => setUploadData(d => ({ ...d, tags: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white text-sm"
                  placeholder="psychedelic, abstract, colorful"
                />
              </div>

              <div>
                <Label className="text-white/70 text-xs">Description</Label>
                <Textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData(d => ({ ...d, description: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white text-sm"
                  placeholder="Describe this asset..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is-public"
                    checked={uploadData.isPublic}
                    onChange={(e) => setUploadData(d => ({ ...d, isPublic: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is-public" className="text-white/70 text-xs cursor-pointer">
                    Share with collaborators
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auto-tag"
                    checked={autoTagging}
                    onChange={(e) => setAutoTagging(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="auto-tag" className="text-white/70 text-xs cursor-pointer">
                    AI auto-tag (images only)
                  </Label>
                </div>
              </div>

              <div>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="h-10 bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center justify-center gap-2 transition-colors">
                    <Upload className="w-4 h-4 text-white" />
                    <span className="text-white text-sm">
                      {uploading ? 'Uploading...' : 'Choose File'}
                    </span>
                  </div>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2 mb-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets..."
              className="pl-9 bg-white/5 border-white/10 text-white text-xs h-8"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white text-xs h-8">
              <Filter className="w-3 h-3 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="animation">Animations</SelectItem>
              <SelectItem value="shader">Shaders</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Smart Search */}
        <div className="flex gap-2">
          <Input
            value={smartSearchQuery}
            onChange={(e) => setSmartSearchQuery(e.target.value)}
            placeholder="Smart search: 'find me fiery abstract loops'..."
            className="flex-1 bg-indigo-500/10 border-indigo-400/20 text-white text-xs h-8"
          />
          <Button
            size="sm"
            onClick={handleSmartSearch}
            disabled={smartSearching}
            className="h-8 bg-indigo-600 hover:bg-indigo-700 text-xs"
          >
            {smartSearching ? 'Searching...' : 'AI Search'}
          </Button>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
        <AnimatePresence>
          {filteredAssets.map((asset, idx) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.03 }}
              className="relative group cursor-pointer"
              onClick={() => onSelectAsset && onSelectAsset(asset)}
            >
              <div className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-black/40">
                {asset.type === 'image' ? (
                  <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                ) : asset.type === 'video' ? (
                  <video src={asset.file_url} className="w-full h-full object-cover" muted loop />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="w-8 h-8 text-white/40" />
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <div className="text-[10px] text-white/90 font-medium line-clamp-1 mb-1">
                      {asset.name}
                    </div>
                    {asset.tags && asset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} className="bg-indigo-500/30 text-white text-[8px] px-1 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="absolute top-1 right-1 flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(asset.id, asset.rating);
                      }}
                      className="h-6 w-6 bg-black/70 hover:bg-black/90"
                    >
                      <Star className={`w-3 h-3 ${asset.rating === 5 ? 'text-yellow-400 fill-yellow-400' : 'text-white/40'}`} />
                    </Button>
                    {asset.user_id === user?.id && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAssetMutation.mutate(asset.id);
                        }}
                        className="h-6 w-6 bg-red-500/80 hover:bg-red-600"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Type Badge */}
              <Badge className="absolute top-2 left-2 bg-black/70 text-white text-[8px] px-1 py-0">
                {asset.type}
              </Badge>
              
              {/* Public indicator */}
              {asset.is_public && (
                <Share2 className="absolute top-2 right-2 w-3 h-3 text-green-400" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredAssets.length === 0 && !isLoading && (
        <div className="text-center py-8 text-white/40 text-sm">
          {searchQuery ? 'No assets found' : 'Upload your first asset to get started'}
        </div>
      )}
    </div>
  );
}