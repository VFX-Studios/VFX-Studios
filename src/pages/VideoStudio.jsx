import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Upload, Video, Film, Youtube, Clapperboard, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import VideoEditor from '@/components/video/VideoEditor';
import OverlayControls from '@/components/video/OverlayControls';
import AIContentGenerator from '@/components/video/AIContentGenerator';

export default function VideoStudio() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      loadProjects(u.id);
    }).catch(() => {});
  }, []);

  const loadProjects = async (userId) => {
    const userProjects = await base44.entities.VideoProject.filter({ user_id: userId }, '-created_date', 20);
    setProjects(userProjects);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      
      const project = await base44.entities.VideoProject.create({
        user_id: user.id,
        title: file.name.replace(/\.[^/.]+$/, ""),
        video_url: uploadResult.file_url,
        user_type: userType || 'video_editor',
        duration_seconds: 0,
        format: file.type
      });

      // Analyze video scenes
      const analysis = await base44.functions.invoke('analyze-video-scenes', {
        video_url: uploadResult.file_url,
        project_id: project.id
      });

      toast.success('Video uploaded and analyzed!');
      loadProjects(user.id);
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const demographicTypes = [
    { id: 'vj', label: 'VJ / Live Performer', icon: Video, color: 'from-purple-500 to-pink-500' },
    { id: 'youtuber', label: 'YouTuber', icon: Youtube, color: 'from-red-500 to-orange-500' },
    { id: 'vlogger', label: 'Vlogger', icon: Clapperboard, color: 'from-blue-500 to-cyan-500' },
    { id: 'filmmaker', label: 'Filmmaker', icon: Film, color: 'from-green-500 to-emerald-500' },
    { id: 'video_editor', label: 'Video Editor', icon: Edit3, color: 'from-yellow-500 to-amber-500' }
  ];

  if (!userType) {
    return (
      <div className="min-h-screen bg-[#050510] p-6 flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 p-8 max-w-4xl w-full">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome to Video Studio</h1>
          <p className="text-white/60 mb-8 text-center">Choose your creator type to get personalized AI assistance</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {demographicTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setUserType(type.id)}
                  className="group relative bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
                >
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${type.color} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-white font-semibold text-center">{type.label}</div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Video Studio</h1>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
              {demographicTypes.find(t => t.id === userType)?.label}
            </Badge>
          </div>
          <div>
            <Input
              type="file"
              accept="video/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
              id="video-upload"
            />
            <label htmlFor="video-upload">
              <Button disabled={uploading} asChild className="bg-[#f5a623] cursor-pointer">
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {selectedProject ? (
          <div>
            <Button variant="outline" onClick={() => setSelectedProject(null)} className="mb-4 border-white/10 text-white">
              ← Back to Projects
            </Button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <VideoEditor
                  videoUrl={selectedProject.video_url}
                  projectId={selectedProject.id}
                  onCut={(time) => console.log('Cut at:', time)}
                  onExport={() => toast.success('Export started!')}
                />
                <AIContentGenerator projectId={selectedProject.id} />
              </div>
              <div>
                <OverlayControls onAddOverlay={(overlay) => console.log('Overlay added:', overlay)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="bg-white/5 border-white/10 p-4 cursor-pointer hover:bg-white/10 transition"
                onClick={() => setSelectedProject(project)}
              >
                <div className="aspect-video bg-black rounded-lg mb-3 overflow-hidden">
                  <video src={project.video_url} className="w-full h-full object-cover" />
                </div>
                <div className="text-white font-semibold mb-1">{project.title}</div>
                <div className="text-white/60 text-sm">
                  {project.scene_analysis?.length || 0} scenes analyzed
                </div>
              </Card>
            ))}
          </div>
        )}

        {projects.length === 0 && (
          <Card className="bg-white/5 border-white/10 p-12 text-center">
            <Video className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-white text-xl mb-2">No Projects Yet</h3>
            <p className="text-white/60 mb-4">Upload your first video to get started</p>
          </Card>
        )}
      </div>
    </div>
  );
}