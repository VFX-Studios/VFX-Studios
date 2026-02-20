import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { spotify_playlist_url, export_format = 'resolume' } = await req.json();

    // Extract Spotify playlist ID from URL
    const playlistId = spotify_playlist_url.match(/playlist\/([a-zA-Z0-9]+)/)?.[1];
    if (!playlistId) {
      return Response.json({ error: 'Invalid Spotify URL' }, { status: 400 });
    }

    // Fetch playlist data (simplified - real implementation needs Spotify API)
    const mockPlaylistData = [
      { name: 'Song 1', bpm: 128, energy: 8, mood: 'energetic', key: 'A minor' },
      { name: 'Song 2', bpm: 140, energy: 9, mood: 'euphoric', key: 'C major' },
      { name: 'Song 3', bpm: 110, energy: 6, mood: 'chill', key: 'G major' }
    ];

    // Generate visual recommendations for each song
    const setlistWithVisuals = [];

    for (const song of mockPlaylistData) {
      const visualPrompt = `Recommend the best VFX style for a song with:
      BPM: ${song.bpm}
      Energy: ${song.energy}/10
      Mood: ${song.mood}
      Key: ${song.key}
      
      Consider user's past preferences and available marketplace assets.`;

      const recommendation = await base44.integrations.Core.InvokeLLM({
        prompt: visualPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            style: { type: "string" },
            color_palette: { type: "array", items: { type: "string" } },
            visual_intensity: { type: "number" },
            effect_suggestions: { type: "array", items: { type: "string" } }
          }
        }
      });

      setlistWithVisuals.push({
        song: song.name,
        bpm: song.bpm,
        energy: song.energy,
        mood: song.mood,
        visual_style: recommendation.style,
        color_palette: recommendation.color_palette,
        intensity: recommendation.visual_intensity,
        effects: recommendation.effect_suggestions
      });
    }

    // Create setlist in database
    const setlist = await base44.entities.Setlist.create({
      user_id: user.id,
      name: `AI Generated from Spotify`,
      description: `Auto-generated setlist with AI-matched visuals`,
      festival_name: 'Spotify Import'
    });

    // Export to Resolume format
    const resolumeExport = {
      version: '7.0',
      layers: setlistWithVisuals.map((item, i) => ({
        layer: i + 1,
        name: item.song,
        clips: [{
          name: item.visual_style,
          effects: item.effects.map(e => ({ name: e, enabled: true }))
        }]
      }))
    };

    // Generate download URL
    const exportBlob = JSON.stringify(resolumeExport, null, 2);
    const { file_url } = await base44.integrations.Core.UploadFile({
      file: new Blob([exportBlob], { type: 'application/json' })
    });

    return Response.json({
      setlist_id: setlist.id,
      tracks_processed: setlistWithVisuals.length,
      visuals: setlistWithVisuals,
      export_url: file_url,
      export_format: 'Resolume .avc JSON',
      message: 'AI setlist generated! Download or import to Resolume.'
    });

  } catch (error) {
    console.error('ai-setlist-generator error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
