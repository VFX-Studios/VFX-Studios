import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      song_id, 
      current_energy, 
      current_state, 
      viewer_reactions, 
      elapsed_time,
      all_songs = [],
      available_assets = []
    } = await req.json();

    if (!song_id) {
      return Response.json({ error: 'song_id required' }, { status: 400 });
    }

    // Fetch comprehensive context
    const [song, learningData, userHistory] = await Promise.all([
      base44.entities.Song.get(song_id),
      base44.entities.AILearningData.filter({ user_id: user.id }, '-created_date', 100),
      base44.entities.AILearningData.filter({ 
        user_id: user.id, 
        learning_type: 'accepted_suggestion' 
      }, '-created_date', 20),
    ]);

    if (!song) {
      return Response.json({ error: 'Song not found' }, { status: 404 });
    }

    // Analyze viewer reactions
    const reactionAnalysis = viewer_reactions && viewer_reactions.length > 0 ? {
      total: viewer_reactions.length,
      sentiment: analyzeReactionSentiment(viewer_reactions),
      recent_spike: viewer_reactions.filter(r => 
        r.timestamp_seconds >= (elapsed_time - 10)
      ).length > 5,
      dominant_type: getDominantReaction(viewer_reactions),
      avg_intensity: viewer_reactions.reduce((sum, r) => sum + (r.intensity || 5), 0) / viewer_reactions.length,
    } : null;

    // Analyze historical preferences
    const acceptedPatterns = userHistory
      .filter(h => (h.effectiveness_score || 0) >= 7)
      .slice(0, 10);

    const stylePreferences = extractStylePreferences(learningData);
    const colorPreferences = extractColorPreferences(learningData);

    // Build comprehensive AI prompt
    const prompt = `You are an expert VJ AI co-pilot providing PROACTIVE, REAL-TIME performance suggestions.

**CURRENT PERFORMANCE CONTEXT:**
Song: "${song.title}" (${song.set_section} section)
- Song Energy: ${song.energy_level}/10, Current Energy: ${current_energy}/10
- BPM: ${song.tempo_bpm_estimate}
- Mood: ${song.visual_mood}
- Progress: ${elapsed_time}s / ${song.duration_seconds}s (${Math.round((elapsed_time / song.duration_seconds) * 100)}%)

**CURRENT VFX STATE:**
${JSON.stringify(current_state, null, 2)}

${reactionAnalysis ? `**LIVE AUDIENCE REACTIONS:**
- Total: ${reactionAnalysis.total} reactions
- Sentiment: ${reactionAnalysis.sentiment}
- Dominant: ${reactionAnalysis.dominant_type}
- Intensity: ${reactionAnalysis.avg_intensity.toFixed(1)}/10
- Recent spike: ${reactionAnalysis.recent_spike ? 'YES - High engagement!' : 'No'}
` : '**AUDIENCE:** No reactions data available'}

**USER'S LEARNED PREFERENCES:**
- Top accepted patterns: ${acceptedPatterns.length} high-effectiveness configs
- Style preferences: ${stylePreferences.join(', ') || 'Learning...'}
- Color preferences: Hue ${colorPreferences.preferred_hue || 'varied'}

**AVAILABLE VISUAL ASSETS (${available_assets.length}):**
${available_assets.slice(0, 10).map(a => `- ${a.name} (${a.type}): ${a.tags?.join(', ') || 'no tags'}`).join('\n')}

**SETLIST CONTEXT:**
Current song position: ${song.set_position || 'unknown'}
Available songs: ${all_songs.length}
${all_songs.slice(0, 5).map(s => `- ${s.title} (pos: ${s.set_position}, energy: ${s.energy_level})`).join('\n')}

**YOUR TASK:**
Provide a COMPREHENSIVE, ACTIONABLE suggestion RIGHT NOW considering:

1. **VFX Adjustments:** Specific parameter changes (glow, distortion, saturation, layers, etc.)
2. **Visual Assets:** Recommend specific assets from the library that match the current moment
3. **Setlist Adjustments:** If engagement is low or energy mismatch, suggest song changes (skip/reorder)
4. **Timing:** When should changes be applied for maximum impact?
5. **User Preferences:** Respect learned patterns while suggesting growth

Be SPECIFIC and ACTIONABLE. This is LIVE - suggest concrete numbers and clear actions.`;

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
              action_type: { 
                type: "string",
                enum: ["vfx_adjustment", "asset_switch", "setlist_change", "combined"]
              },
              description: { type: "string" },
              apply_in_seconds: { type: "number" },
              parameters: { 
                type: "object",
                properties: {
                  effects: { type: "object" },
                  color_grading: { type: "object" },
                  layers: { type: "object" },
                  particles: { type: "object" },
                }
              },
            }
          },
          recommended_assets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                asset_id: { type: "string" },
                name: { type: "string" },
                reason: { type: "string" },
                when_to_apply: { type: "string" },
              }
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
              suggested_change: { 
                type: "string",
                enum: ["none", "skip_to_next", "go_back_one", "jump_to_peak", "slow_down"]
              },
              reason: { type: "string" },
              confidence: { type: "number" },
            }
          },
        }
      }
    });

    const suggestionId = crypto.randomUUID();

    // Log for future learning
    await base44.entities.AILearningData.create({
      user_id: user.id,
      learning_type: "ai_suggestion",
      song_id: song.id,
      music_context: {
        energy_level: current_energy,
        bpm: song.tempo_bpm_estimate,
        mood: song.visual_mood,
        timestamp: elapsed_time,
        progress_percent: Math.round((elapsed_time / song.duration_seconds) * 100),
      },
      parameters: aiSuggestion.primary_suggestion.parameters,
      emotional_arc: song.set_section,
      style_tags: ['ai-copilot', aiSuggestion.urgency, aiSuggestion.primary_suggestion.action_type],
    });

    return Response.json({
      success: true,
      suggestion: {
        ...aiSuggestion,
        suggestion_id: suggestionId,
        timestamp: new Date().toISOString(),
      },
      context: {
        song_progress: Math.round((elapsed_time / song.duration_seconds) * 100),
        audience_engagement: reactionAnalysis,
        assets_analyzed: available_assets.length,
        learning_applied: {
          patterns_count: acceptedPatterns.length,
          total_learning_data: learningData.length,
        }
      },
    });

  } catch (error) {
    console.error('AI Proactive Co-Pilot Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function analyzeReactionSentiment(reactions) {
  const positiveTypes = ['fire', 'energy', 'love', 'mind_blown', 'colors'];
  const neutralTypes = ['chill'];
  
  const positive = reactions.filter(r => positiveTypes.includes(r.reaction_type)).length;
  const neutral = reactions.filter(r => neutralTypes.includes(r.reaction_type)).length;
  
  const ratio = positive / (reactions.length || 1);
  
  if (ratio > 0.7) return 'very_positive';
  if (ratio > 0.5) return 'positive';
  if (ratio > 0.3) return 'mixed';
  return 'low_engagement';
}

function getDominantReaction(reactions) {
  const counts = {};
  reactions.forEach(r => {
    counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';
}

function extractStylePreferences(learningData) {
  const styles = {};
  learningData.forEach(d => {
    if (d.style_tags) {
      d.style_tags.forEach(tag => {
        styles[tag] = (styles[tag] || 0) + 1;
      });
    }
  });
  return Object.entries(styles)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([style]) => style);
}

function extractColorPreferences(learningData) {
  const hues = [];
  learningData.forEach(d => {
    if (d.parameters?.color_grading?.hue) {
      hues.push(d.parameters.color_grading.hue);
    }
  });
  
  if (hues.length === 0) return { preferred_hue: null };
  
  const avg = hues.reduce((sum, h) => sum + h, 0) / hues.length;
  return { preferred_hue: Math.round(avg) };
}

