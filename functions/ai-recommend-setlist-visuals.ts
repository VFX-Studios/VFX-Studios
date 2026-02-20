import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { setlist_id } = await req.json();

    if (!setlist_id) {
      return Response.json({ error: 'setlist_id required' }, { status: 400 });
    }

    // Fetch setlist and songs
    const [setlist, setlistSongs] = await Promise.all([
      base44.entities.Setlist.get(setlist_id),
      base44.entities.SetlistSong.filter({ setlist_id }, 'position'),
    ]);

    if (!setlist || setlist.user_id !== user.id) {
      return Response.json({ error: 'Setlist not found' }, { status: 404 });
    }

    const songIds = setlistSongs.map(s => s.song_id);
    const songs = await Promise.all(
      songIds.map(id => base44.asServiceRole.entities.Song.get(id))
    );

    // Fetch user's AI learning data for personalization
    const learningData = await base44.entities.AILearningData.filter(
      { user_id: user.id },
      '-created_date',
      50
    );

    // Build learning context
    const stylePreferences = learningData
      .filter(l => l.learning_type === 'style_preference')
      .slice(0, 10);
    const acceptedSuggestions = learningData
      .filter(l => l.learning_type === 'accepted_suggestion')
      .slice(0, 10);

    const learningContext = {
      favorite_styles: [...new Set(stylePreferences.flatMap(l => l.style_tags || []))].slice(0, 5),
      preferred_colors: stylePreferences.map(l => l.parameters?.dominant_color).filter(Boolean).slice(0, 3),
      high_effectiveness: acceptedSuggestions.filter(l => (l.effectiveness_score || 0) >= 7),
    };

    // Generate AI suggestions for entire setlist
    const prompt = `You are a VJ (visual jockey) expert. Analyze this setlist and create a cohesive visual storyboard for the entire performance.

**Setlist:** ${setlist.name} (${setlist.festival_name || 'Live Performance'})

**Songs:**
${songs.map((song, i) => `${i + 1}. "${song.title}" - ${song.set_section} (Energy: ${song.energy_level}/10, BPM: ${song.tempo_bpm_estimate}, Mood: ${song.visual_mood})`).join('\n')}

**User Preferences (learned from past performances):**
- Favorite visual styles: ${learningContext.favorite_styles.join(', ') || 'No preference data'}
- Preferred color schemes: ${learningContext.preferred_colors.join(', ') || 'No preference data'}
- High-effectiveness patterns: ${learningContext.high_effectiveness.length} successful configurations

**Task:**
For each song, suggest:
1. **Visual Theme**: Abstract concept, color palette (3-5 hex codes), primary pattern type (fractals/particles/waves/geometric)
2. **VFX Preset Suggestion**: Intensity levels for glow, distortion, glitch, saturation
3. **Transition Strategy**: How to smoothly transition from previous song
4. **Energy Sync**: How visuals should react to energy changes
5. **Generated Art Prompt**: A detailed text prompt to generate a custom visual asset

Return a JSON array with one object per song, maintaining flow and coherence across the performance arc.`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          setlist_narrative: { type: "string" },
          songs: {
            type: "array",
            items: {
              type: "object",
              properties: {
                song_index: { type: "number" },
                song_title: { type: "string" },
                visual_theme: {
                  type: "object",
                  properties: {
                    concept: { type: "string" },
                    color_palette: { type: "array", items: { type: "string" } },
                    pattern_type: { type: "string" },
                  }
                },
                vfx_preset: {
                  type: "object",
                  properties: {
                    glow: { type: "number" },
                    distortion: { type: "number" },
                    glitch: { type: "number" },
                    saturation: { type: "number" },
                  }
                },
                transition_strategy: { type: "string" },
                energy_sync_notes: { type: "string" },
                generated_art_prompt: { type: "string" },
              }
            }
          }
        }
      }
    });

    // Update songs with AI suggestions
    const updates = aiResponse.songs.map((suggestion, idx) => {
      const song = songs[idx];
      return base44.asServiceRole.entities.Song.update(song.id, {
        vfx_description: `${suggestion.visual_theme.concept}. ${suggestion.transition_strategy}`,
        visual_mood: `${suggestion.visual_theme.pattern_type}, ${suggestion.visual_theme.color_palette.join(', ')}`,
      });
    });

    await Promise.all(updates);

    return Response.json({
      success: true,
      setlist_narrative: aiResponse.setlist_narrative,
      song_suggestions: aiResponse.songs,
      learning_applied: {
        styles: learningContext.favorite_styles,
        effectiveness_samples: learningContext.high_effectiveness.length,
      }
    });

  } catch (error) {
    console.error('AI Setlist Storyboard Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
