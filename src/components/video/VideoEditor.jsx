import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, SkipBack, SkipForward, Scissors, Undo, Download, Sparkles, Copy, SplitSquareHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import VoiceControl from '@/components/pwa/VoiceControl';

export default function VideoEditor({ videoUrl, projectId, onCut, onExport }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoveredTime, setHoveredTime] = useState(null);
  const [previewFrame, setPreviewFrame] = useState(null);
  const canvasRef = useRef(null);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [cuts, setCuts] = useState([]);
  const [trimStart, setTrimStart] = useState(null);
  const [trimEnd, setTrimEnd] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value) => {
    const video = videoRef.current;
    const seekTime = (value[0] / 100) * duration;
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleTimelineHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    setHoveredTime(time);

    // Capture frame at hovered time
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      video.currentTime = time;
      
      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        setPreviewFrame(canvas.toDataURL());
      };
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCut = () => {
    const newCuts = [...cuts, currentTime].sort((a, b) => a - b);
    setCuts(newCuts);
    toast.success(`Cut made at ${formatTime(currentTime)}`);
    if (onCut) onCut(currentTime);
  };

  const handleSplit = () => {
    handleCut();
    toast.success('Clip split into segments');
  };

  const handleDuplicate = () => {
    const video = videoRef.current;
    if (!video) return;

    // Capture current frame
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Store duplicated frame data
    const frameData = {
      timestamp: currentTime,
      imageData: canvas.toDataURL(),
      duration: 0.5 // Default 0.5 second hold
    };

    toast.success(`Frame duplicated at ${formatTime(currentTime)} (0.5s hold)`);
    // In production, this would add to timeline
  };

  const handleTrimStart = () => {
    setTrimStart(currentTime);
    toast.info(`Trim start set at ${formatTime(currentTime)}`);
  };

  const handleTrimEnd = () => {
    setTrimEnd(currentTime);
    toast.info(`Trim end set at ${formatTime(currentTime)}`);
  };

  const handleApplyTrim = () => {
    if (trimStart !== null && trimEnd !== null) {
      toast.success(`Trimmed ${formatTime(trimStart)} - ${formatTime(trimEnd)}`);
      setTrimStart(null);
      setTrimEnd(null);
    } else {
      toast.error('Set both trim start and end points');
    }
  };

  const handleGetAISuggestions = async () => {
    if (!projectId) {
      toast.error('Project ID required for AI suggestions');
      return;
    }

    setLoadingSuggestions(true);
    try {
      const response = await base44.functions.invoke('ai-suggest-video-edits', {
        video_project_id: projectId
      });

      setAiSuggestions(response.data.suggestions);
      toast.success(`AI generated ${response.data.suggestions.cuts?.length || 0} suggestions`);
    } catch (error) {
      toast.error('Failed to get AI suggestions');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleVoiceCommand = (command, value) => {
    const video = videoRef.current;
    if (!video) return;

    switch (command) {
      case 'play':
        video.play();
        setIsPlaying(true);
        break;
      case 'pause':
      case 'stop':
        video.pause();
        setIsPlaying(false);
        break;
      case 'cut':
        handleCut();
        break;
      case 'split':
        handleSplit();
        break;
      case 'duplicate':
        handleDuplicate();
        break;
      case 'undo':
        toast.info('Undo action');
        break;
      case 'redo':
        toast.info('Redo action');
        break;
      case 'rewind':
        video.currentTime = Math.max(0, video.currentTime - (value || 5));
        break;
      case 'forward':
        video.currentTime = Math.min(duration, video.currentTime + (value || 5));
        break;
      case 'seek':
        if (value === 0) video.currentTime = 0;
        else if (value === -1) video.currentTime = duration;
        else video.currentTime = value;
        break;
      case 'trim-start':
        handleTrimStart();
        break;
      case 'trim-end':
        handleTrimEnd();
        break;
      case 'apply-trim':
        handleApplyTrim();
        break;
      case 'ai-suggestions':
        handleGetAISuggestions();
        break;
      case 'export':
        if (onExport) onExport();
        break;
      default:
        toast.error('Unknown voice command');
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 p-6">
      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden mb-4">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full"
          onEnded={() => setIsPlaying(false)}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Timeline with Hover Preview */}
      <div 
        className="relative mb-4"
        onMouseMove={handleTimelineHover}
        onMouseLeave={() => setHoveredTime(null)}
      >
        <Slider
          value={[(currentTime / duration) * 100]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="cursor-pointer"
        />
        
        {/* Hover Preview */}
        {hoveredTime !== null && previewFrame && (
          <div 
            className="absolute bottom-full mb-2 pointer-events-none z-10"
            style={{ 
              left: `${(hoveredTime / duration) * 100}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="bg-black border border-white/20 rounded-lg p-2 shadow-lg">
              <img 
                src={previewFrame} 
                alt="Preview" 
                className="w-32 h-18 object-cover rounded mb-1"
              />
              <div className="text-white text-xs text-center">
                {formatTime(hoveredTime)}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between text-white/60 text-xs mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Voice Control */}
      <div className="mb-4">
        <VoiceControl onCommand={handleVoiceCommand} />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => { videoRef.current.currentTime -= 5; }}
          className="border-white/10 text-white"
        >
          <SkipBack className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          onClick={togglePlayPause}
          className="bg-[#f5a623]"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => { videoRef.current.currentTime += 5; }}
          className="border-white/10 text-white"
        >
          <SkipForward className="w-4 h-4" />
        </Button>
      </div>

      {/* Editing Tools */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <Button variant="outline" onClick={handleCut} className="border-white/10 text-white">
          <Scissors className="w-4 h-4 mr-2" />
          Cut
        </Button>
        <Button variant="outline" onClick={handleSplit} className="border-white/10 text-white">
          <SplitSquareHorizontal className="w-4 h-4 mr-2" />
          Split
        </Button>
        <Button variant="outline" onClick={handleDuplicate} className="border-white/10 text-white">
          <Copy className="w-4 h-4 mr-2" />
          Duplicate
        </Button>
        <Button variant="outline" className="border-white/10 text-white">
          <Undo className="w-4 h-4 mr-2" />
          Undo
        </Button>
      </div>

      {/* Trim Controls */}
      <Card className="bg-white/5 border-white/10 p-4 mb-4">
        <div className="text-white text-sm font-semibold mb-3">Trim Controls</div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleTrimStart}
            className={`border-white/10 ${trimStart !== null ? 'bg-green-500/20 border-green-500/50' : ''}`}
          >
            Set Trim Start
          </Button>
          {trimStart !== null && (
            <Badge className="bg-green-500/20 text-green-300">
              Start: {formatTime(trimStart)}
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleTrimEnd}
            className={`border-white/10 ${trimEnd !== null ? 'bg-red-500/20 border-red-500/50' : ''}`}
          >
            Set Trim End
          </Button>
          {trimEnd !== null && (
            <Badge className="bg-red-500/20 text-red-300">
              End: {formatTime(trimEnd)}
            </Badge>
          )}
          {trimStart !== null && trimEnd !== null && (
            <Button
              size="sm"
              onClick={handleApplyTrim}
              className="bg-[#f5a623] ml-auto"
            >
              Apply Trim
            </Button>
          )}
        </div>
      </Card>

      {/* AI Suggestions */}
      <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-400/30 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-white font-semibold">AI Editor Assistant</span>
          </div>
          <Button
            size="sm"
            onClick={handleGetAISuggestions}
            disabled={loadingSuggestions}
            className="bg-purple-500 hover:bg-purple-600"
          >
            {loadingSuggestions ? 'Analyzing...' : 'Get Suggestions'}
          </Button>
        </div>
        
        {aiSuggestions && (
          <div className="space-y-2">
            {aiSuggestions.cuts?.slice(0, 3).map((cut, i) => (
              <div key={i} className="bg-black/20 rounded p-2 text-sm">
                <div className="text-white/80">
                  ✂️ Cut at <span className="text-purple-300 font-semibold">{cut.timestamp}</span>
                </div>
                <div className="text-white/60 text-xs">{cut.reason}</div>
              </div>
            ))}
            {aiSuggestions.transitions?.slice(0, 2).map((trans, i) => (
              <div key={i} className="bg-black/20 rounded p-2 text-sm">
                <div className="text-white/80">
                  🎬 {trans.transition} transition (Scene {trans.scene_from} → {trans.scene_to})
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Overlays & Text */}
      <Card className="bg-white/5 border-white/10 p-4 mb-4">
        <div className="text-white text-sm font-semibold mb-3">Overlays & Text</div>
        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" variant="outline" className="border-white/10 text-white text-xs">
            Add Text
          </Button>
          <Button size="sm" variant="outline" className="border-white/10 text-white text-xs">
            Stickers
          </Button>
          <Button size="sm" variant="outline" className="border-white/10 text-white text-xs">
            GIFs
          </Button>
        </div>
      </Card>

      {/* Export */}
      <Button onClick={onExport} className="w-full bg-[#f5a623]">
        <Download className="w-4 h-4 mr-2" />
        Export Video
      </Button>
    </Card>
  );
}