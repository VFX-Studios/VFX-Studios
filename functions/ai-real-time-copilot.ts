import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { song_id, current_energy, current_state, viewer_reactions, elapsed_time } = await req.json();

    if (!song_id) {
      return Response.json({ error: 'song_id required' }, { status: 400 });
    }

    // Fetch song and performance context
    const [song, learningData, reactions] = await Promise.all([
      base44.entities.Song.get(song_id),
      base44.entities.AILearningData.filter({ user_id: user.id, song_id }, '-created_date', 20),
      viewer_reactions ? Promise.resolve(viewer_reactions) : Promise.resolve([]),
    ]);

    if (!song) {
      return Response.json({ error: 'Song not found' }, { status: 404 });
    }

    // Analyze viewer engagement
    const reactionAnalysis = reactions.length > 0 ? {
      total_reactions: reactions.length,
      dominant_reaction: reactions.reduce((acc, r) => {
        acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
        return acc;
      }, {}),
      avg_intensity: reactions.reduce((sum, r) => sum + (r.intensity || 5), 0) / reactions.length,
      recent_spike: reactions.filter(r => r.timestamp_seconds >= (elapsed_time - 10)).length > 5,
    } : null;

    // Build learning context
    const recentAdjustments = learningData
      .filter(l => l.learning_type === 'manual_adjustment')
      .slice(0, 5);

    const acceptedSuggestions = learningData
      .filter(l => l.learning_type === 'accepted_suggestion' && (l.effectiveness_score || 0) >= 7)
      .slice(0, 5);

    // Real-time AI co-pilot prompt
    const prompt = `You are an expert VJ (visual jockey) AI co-pilot providing real-time performance suggestions during a live show.

**Current Performance Context:**
- Song: "${song.title}" (${song.set_section} section)
- Song Energy: ${song.energy_level}/10, Current Measured Energy: ${current_energy}/10
- BPM: ${song.tempo_bpm_estimate}
- Mood: ${song.visual_mood}
- Elapsed Time: ${elapsed_time}s / ${song.duration_seconds}s (${Math.round((elapsed_time / song.duration_seconds) * 100)}% complete)

**Current VFX State:**
${JSON.stringify(current_state || {}, null, 2)}

${reactionAnalysis ? `**Live Audience Reactions:**
- Total reactions: ${reactionAnalysis.total_reactions}
- Dominant reaction: ${Object.entries(reactionAnalysis.dominant_reaction).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none'}
- Average intensity: ${reactionAnalysis.avg_intensity.toFixed(1)}/10
- Recent spike detected: ${reactionAnalysis.recent_spike ? 'YES - High engagement!' : 'no'}` : ''}

**User's Performance History (Learned Patterns):**
- Recent manual adjustments: ${recentAdjustments.length} changes
- Accepted suggestions: ${acceptedSuggestions.length} high-effectiveness configurations

**Task:**
Provide real-time suggestions to enhance the performance RIGHT NOW. Consider:
1. Song progression (are we approaching a drop/peak?)
2. Energy levels (should visuals ramp up or cool down?)
3. Viewer engagement (reactions indicate what's working)
4. User's learned preferences
5. Smooth transitions vs. dramatic changes

Suggest:
- VFX adjustments (specific parameter changes)
- Asset library recommendations
- Setlist adjustments (if current song isn't landing well)
- Timing suggestions (when to apply changes)

Be specific and actionable. This is LIVE performance assistance.`;

    const aiSuggestion = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          urgency: { 
            type: "string",
            enum: ["low", "medium", "high", "critical"]
          },
          primary_suggestion: {
            type: "object",
            properties: {
              action_type: { type: "string" },
              description: { type: "string" },
              apply_in_seconds: { type: "number" },
              parameters: { type: "object" },
            }
          },
          secondary_suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action_type: { type: "string" },
                description: { type: "string" },
                timing: { type: "string" },
              }
            }
          },
          reasoning: { type: "string" },
          audience_insight: { type: "string" },
          setlist_recommendation: { 
            type: "object",
            properties: {
              suggested_change: { type: "string" },
              reason: { type: "string" },
            }
          },
        }
      }
    });

    // Log this interaction for future learning
    await base44.entities.AILearningData.create({
      user_id: user.id,
      learning_type: "ai_suggestion",
      song_id: song.id,
      music_context: {
        energy_level: current_energy,
        bpm: song.tempo_bpm_estimate,
        mood: song.visual_mood,
        timestamp: elapsed_time,
      },
      parameters: aiSuggestion.primary_suggestion.parameters,
      emotional_arc: song.set_section,
      style_tags: ['ai-copilot', aiSuggestion.urgency],
    });

    return Response.json({
      success: true,
      suggestion: aiSuggestion,
      context: {
        song_progress: Math.round((elapsed_time / song.duration_seconds) * 100),
        audience_engagement: reactionAnalysis,
        learning_applied: {
          manual_adjustments: recentAdjustments.length,
          accepted_patterns: acceptedSuggestions.length,
        }
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI Real-Time Co-Pilot Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
