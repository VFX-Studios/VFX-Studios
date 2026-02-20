import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { video_url, project_id } = await req.json();

    if (!video_url) {
      return Response.json({ error: 'video_url required' }, { status: 400 });
    }

    // Use AI to analyze video content
    const sceneAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this video and provide a detailed scene-by-scene breakdown:

1. **Scenes**: Identify distinct scenes with approximate timestamps (format: "MM:SS")
2. **Visual Content**: Describe what's happening visually in each scene
3. **Audio Cues**: Note important audio moments (music drops, dialogue, silence)
4. **Key Moments**: Highlight peaks, transitions, climax, ending
5. **Suggested Cuts**: Where the video could be trimmed for different platforms:
   - YouTube (full length)
   - TikTok (15-60 seconds)
   - Instagram Reels (15-90 seconds)
6. **VFX Suggestions**: Recommend visual effects that would enhance each scene

Return JSON format:
{
  "total_duration": "MM:SS",
  "scenes": [
    {
      "timestamp_start": "00:00",
      "timestamp_end": "00:15",
      "description": "Opening scene with...",
      "audio_cues": "Ambient music starts",
      "suggested_vfx": ["Neon overlay", "Particle effect"],
      "energy_level": "low|medium|high"
    }
  ],
  "key_moments": ["Peak at 1:23", "Transition at 2:45"],
  "platform_cuts": {
    "tiktok": {"start": "00:10", "end": "00:25"},
    "reels": {"start": "00:05", "end": "00:35"}
  },
  "ending_reminder": "Video ends with fade to black at 3:42"
}`,
      add_context_from_internet: false,
      file_urls: [video_url],
      response_json_schema: {
        type: "object",
        properties: {
          total_duration: { type: "string" },
          scenes: { type: "array" },
          key_moments: { type: "array", items: { type: "string" } },
          platform_cuts: { type: "object" },
          ending_reminder: { type: "string" }
        }
      }
    });

    // Update VideoProject with scene analysis
    if (project_id) {
      await base44.entities.VideoProject.update(project_id, {
        scene_analysis: sceneAnalysis.scenes
      });
    }

    return Response.json({
      success: true,
      analysis: sceneAnalysis
    });

  } catch (error) {
    console.error('analyze-video-scenes error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
