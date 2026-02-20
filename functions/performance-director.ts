import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { songId, currentTime, currentState, emotionalArc } = await req.json();

    // Fetch song data
    const songs = await base44.entities.Song.filter({ id: songId });
    if (songs.length === 0) {
      return Response.json({ error: 'Song not found' }, { status: 404 });
    }
    const song = songs[0];

    // Get user's learning data and performance analytics
    const { data: analyticsData } = await base44.functions.invoke('performance-analytics', {});
    const analytics = analyticsData.analytics;

    // Get user's presets and assets
    const presets = await base44.entities.VJPreset.filter({ song_id: songId });
    const allPresets = await base44.entities.VJPreset.list('-created_date', 50);
    const assets = await base44.entities.VisualAsset.filter({ user_id: user.id });

    // Calculate progress through song
    const progress = song.duration_seconds ? currentTime / song.duration_seconds : 0;

    const directorPrompt = `You are an expert VJ Performance Director analyzing a live performance.

CURRENT CONTEXT:
- Song: "${song.title}" (${song.set_section} section)
- BPM: ${song.tempo_bpm_estimate}
- Energy: ${song.energy_level}/10
- Progress: ${(progress * 100).toFixed(0)}% through song
- Emotional Arc Phase: ${emotionalArc}
- Visual Mood: ${song.visual_mood}

USER PERFORMANCE STYLE (from analytics):
- Top Styles: ${analytics.topStyles.slice(0, 3).map(s => s.style).join(', ')}
- Preferred Effects: Glow ${analytics.avgParameters.effects.glow.toFixed(0)}, Glitch ${analytics.avgParameters.effects.glitch.toFixed(0)}
- Color Preferences: Sat ${analytics.avgParameters.color.saturation.toFixed(0)}, Hue ${analytics.avgParameters.color.hue.toFixed(0)}

AVAILABLE RESOURCES:
- ${presets.length} presets saved for this song
- ${allPresets.length} total presets in library
- ${assets.length} user assets available

MISSION: Provide proactive, intelligent direction for the next 30 seconds of performance.

Suggest:
1. Should a preset change occur? If yes, recommend timing and which preset (or suggest creating one)
2. Should any user assets be introduced? Which ones and how?
3. Should AI generate new art? What prompt and style blend?
4. What specific parameter adjustments align with the song's progression?
5. Any transitions or effects to prepare for upcoming song sections?

Be specific, actionable, and aligned with user's learned style.`;

    const direction = await base44.integrations.Core.InvokeLLM({
      prompt: directorPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "critical"],
            description: "Urgency of suggestions"
          },
          preset_recommendation: {
            type: "object",
            properties: {
              should_change: { type: "boolean" },
              preset_name: { type: "string" },
              timing_seconds: { type: "number" },
              reasoning: { type: "string" }
            }
          },
          asset_suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                asset_index: { type: "number" },
                usage: { type: "string" },
                timing: { type: "string" }
              }
            }
          },
          generate_art: {
            type: "object",
            properties: {
              should_generate: { type: "boolean" },
              prompt: { type: "string" },
              styles: { type: "array", items: { type: "string" } },
              reasoning: { type: "string" }
            }
          },
          parameter_adjustments: {
            type: "object",
            properties: {
              effects: { type: "object" },
              color_grading: { type: "object" },
              reasoning: { type: "string" }
            }
          },
          upcoming_transition: {
            type: "object",
            properties: {
              prepare_for: { type: "string" },
              countdown_seconds: { type: "number" },
              suggested_action: { type: "string" }
            }
          },
          overall_direction: {
            type: "string",
            description: "Brief performance direction summary"
          }
        }
      }
    });

    // Match suggested assets to actual asset objects
    if (direction.asset_suggestions && direction.asset_suggestions.length > 0) {
      direction.matched_assets = direction.asset_suggestions
        .map(sug => assets[sug.asset_index])
        .filter(Boolean);
    }

    return Response.json({
      success: true,
      direction,
      context: {
        songProgress: progress,
        emotionalArc,
        availablePresets: presets.length,
        availableAssets: assets.length
      }
    });
  } catch (error) {
    console.error('Performance Director error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
