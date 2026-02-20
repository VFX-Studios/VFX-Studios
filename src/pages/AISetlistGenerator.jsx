import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wand2, Download, Loader2, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AISetlistGenerator() {
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);

  const generateSetlist = async () => {
    if (!spotifyUrl.includes('spotify.com/playlist/')) {
      toast.error('Enter a valid Spotify playlist URL');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.functions.invoke('ai-setlist-generator', {
        spotify_playlist_url: spotifyUrl,
        export_format: 'resolume'
      });

      setResult(response.data);
      toast.success('AI setlist generated!');
    } catch (error) {
      toast.error('Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const downloadExport = () => {
    window.open(result.export_url, '_blank');
    toast.success('Downloading Resolume file...');
  };

  return (
    <div className="min-h-screen bg-[#050510] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AI Setlist Generator</h1>
          <p className="text-white/60">Turn Spotify playlists into VFX setlists automatically</p>
        </div>

        <Card className="bg-white/5 border-white/10 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="text-white/70 text-sm mb-2 block">
                Spotify Playlist URL
              </label>
              <div className="flex gap-2">
                <Input
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  placeholder="https://open.spotify.com/playlist/..."
                  className="bg-white/5 border-white/10 text-white"
                />
                <Button
                  onClick={generateSetlist}
                  disabled={generating}
                  className="bg-gradient-to-r from-[#f5a623] to-[#e91e8c]"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-200/70">
              💡 AI will analyze each song's BPM, energy, mood, and key signature to automatically assign matching visuals
            </div>
          </div>
        </Card>

        {result && (
          <Card className="bg-white/5 border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white font-semibold text-xl">Generated Setlist</h2>
                <p className="text-white/60 text-sm">{result.tracks_processed} tracks processed</p>
              </div>
              <Button onClick={downloadExport} className="bg-green-600">
                <Download className="w-4 h-4 mr-2" />
                Export to Resolume
              </Button>
            </div>

            <div className="space-y-3">
              {result.visuals.map((track, i) => (
                <Card key={i} className="bg-white/5 border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium">{track.song}</div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge className="bg-[#f5a623]/20 text-[#f5a623]">
                          {track.bpm} BPM
                        </Badge>
                        <Badge className="bg-purple-500/20 text-purple-300">
                          {track.mood}
                        </Badge>
                        <Badge className="bg-cyan-500/20 text-cyan-300">
                          Energy: {track.energy}/10
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/60 text-sm mb-1">Assigned Visual</div>
                      <div className="text-white font-semibold">{track.visual_style}</div>
                      <div className="flex gap-1 mt-2">
                        {track.color_palette.slice(0, 4).map((color, j) => (
                          <div
                            key={j}
                            className="w-6 h-6 rounded border border-white/20"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-white/50 text-xs">
                    Effects: {track.effects.join(', ')}
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div className="text-green-300 text-sm">
                Setlist ready! Download and import to Resolume, or continue editing in VFX Studios.
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}