import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { song_id, context } = await req.json();

    if (!song_id) {
      return Response.json({ error: 'song_id required' }, { status: 400 });
    }

    // Fetch song details
    const song = await base44.entities.Song.get(song_id);
    if (!song) {
      return Response.json({ error: 'Song not found' }, { status: 404 });
    }

    // Fetch user's visual assets and learning data
    const [visualAssets, learningData, generatedArt] = await Promise.all([
      base44.entities.VisualAsset.filter({ user_id: user.id }),
      base44.entities.AILearningData.filter({ user_id: user.id }, '-created_date', 100),
      base44.entities.GeneratedArt.filter({ user_id: user.id, used_in_performance: true }),
    ]);

    // Analyze learning patterns
    const songContextLearning = learningData.filter(l => {
      const musicCtx = l.music_context || {};
      const energyMatch = Math.abs((musicCtx.energy_level || 5) - (song.energy_level || 5)) <= 2;
      const bpmMatch = Math.abs((musicCtx.bpm || 120) - (song.tempo_bpm_estimate || 120)) <= 15;
      return energyMatch || bpmMatch;
    });

    // Extract style preferences
    const preferredStyles = [...new Set(
      songContextLearning.flatMap(l => l.style_tags || [])
    )].slice(0, 5);

    const preferredEmotionalArc = songContextLearning
      .filter(l => l.emotional_arc === song.set_section)
      .slice(0, 10);

    const highEffectivenessParams = songContextLearning
      .filter(l => (l.effectiveness_score || 0) >= 7)
      .map(l => l.parameters);

    // AI recommendation prompt
    const prompt = `You are an AI recommendation engine for VJ visual assets. Recommend the best visual assets from the user's library for this song.

**Current Song:**
- Title: ${song.title}
- Energy: ${song.energy_level}/10
- BPM: ${song.tempo_bpm_estimate}
- Set Section: ${song.set_section}
- Mood: ${song.visual_mood}

**User's Asset Library:**
${visualAssets.slice(0, 20).map((asset, i) => `${i + 1}. "${asset.name}" (${asset.type}) - Tags: ${asset.tags?.join(', ') || 'none'} - Usage: ${asset.usage_count || 0}x, Rating: ${asset.rating || 'N/A'}`).join('\n')}

**Previously Generated Art (Used in Performances):**
${generatedArt.slice(0, 10).map((art, i) => `${i + 1}. Prompt: "${art.prompt}" - Style: ${art.style}`).join('\n')}

**User Preferences (Learned from ${songContextLearning.length} similar contexts):**
- Preferred styles: ${preferredStyles.join(', ') || 'No strong preference'}
- Emotional arc match: ${preferredEmotionalArc.length} similar performances
- High effectiveness parameters: ${highEffectivenessParams.length} successful configurations

**Task:**
Recommend the top 5 assets from the library that best match this song. Consider:
1. Energy level matching
2. Mood/vibe alignment
3. Historical usage patterns and ratings
4. User's learned style preferences
5. Set section appropriateness (opener/build/peak/cooldown/closer)

Also suggest 2-3 new visual generation prompts if existing assets are insufficient.`;

    const aiRecommendation = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          reasoning: { type: "string" },
          recommended_assets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                asset_name: { type: "string" },
                match_score: { type: "number" },
                why_recommended: { type: "string" },
              }
            }
          },
          suggested_generations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                prompt: { type: "string" },
                style_notes: { type: "string" },
                type: { type: "string" },
              }
            }
          },
          style_insights: { type: "string" },
        }
      }
    });

    // Match recommended asset names to actual asset IDs
    const recommendedAssetIds = aiRecommendation.recommended_assets
      .map(rec => {
        const asset = visualAssets.find(a => 
          a.name.toLowerCase().includes(rec.asset_name.toLowerCase()) ||
          rec.asset_name.toLowerCase().includes(a.name.toLowerCase())
        );
        return asset ? { ...rec, asset_id: asset.id, asset } : null;
      })
      .filter(Boolean);

    return Response.json({
      success: true,
      song: {
        id: song.id,
        title: song.title,
        energy: song.energy_level,
        bpm: song.tempo_bpm_estimate,
      },
      recommendations: {
        assets: recommendedAssetIds,
        new_generation_prompts: aiRecommendation.suggested_generations,
      },
      reasoning: aiRecommendation.reasoning,
      style_insights: aiRecommendation.style_insights,
      learning_context: {
        similar_contexts: songContextLearning.length,
        preferred_styles: preferredStyles,
        high_effectiveness_count: highEffectivenessParams.length,
      }
    });

  } catch (error) {
    console.error('AI Asset Recommendation Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
