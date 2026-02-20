import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { video_project_id, scene_analysis, setlist_id } = await req.json();

    if (!video_project_id) {
      return Response.json({ error: 'video_project_id required' }, { status: 400 });
    }

    // Fetch project
    const projects = await base44.entities.VideoProject.filter({ id: video_project_id });
    if (!projects[0]) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projects[0];

    // Fetch linked setlist if provided
    let setlistData = null;
    if (setlist_id || project.storyboard_linked) {
      const setlists = await base44.entities.Setlist.filter({ 
        id: setlist_id || project.storyboard_linked 
      });
      if (setlists[0]) {
        setlistData = setlists[0];
        
        // Get songs in setlist
        const setlistSongs = await base44.entities.SetlistSong.filter({ 
          setlist_id: setlistData.id 
        }, 'order', 50);
        
        setlistData.songs = setlistSongs;
      }
    }

    // Use AI to generate comprehensive edit suggestions
    const suggestions = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this video project and provide intelligent editing suggestions:

**Project:** ${project.title}
**User Type:** ${project.user_type} (CRITICAL: Personalize suggestions for this demographic)
**Duration:** ${project.duration_seconds}s
**Scene Analysis:** ${JSON.stringify(scene_analysis || project.scene_analysis)}
${setlistData ? `**Linked Setlist:** ${JSON.stringify(setlistData)}` : ''}

**User Type Personalization Rules:**
- **vj**: Suggest beat-reactive effects (strobes, particle systems, beat-synced transitions like "glitch", "rgb split"), high-energy assets
- **youtuber**: Suggest retention tactics (jump cuts, zoom transitions, text overlays, thumbnail-worthy moments)
- **vlogger**: Suggest B-roll placement, talking-head framing, subtle transitions (crossfade, dissolve)
- **filmmaker**: Suggest cinematic transitions (whip pan, match cut, J/L cuts), color grading cues, establishing shots
- **video_editor**: Suggest efficiency shortcuts (ripple delete, batch operations, proxy workflows)

Provide:

1. **Cut Suggestions**: Specific timestamps where cuts would improve pacing
   - Format: {"timestamp": "MM:SS", "reason": "Long talking segment, cut to B-roll", "confidence": 0.9}
   
2. **Transition Suggestions**: Best transitions between scenes (personalized to user type)
   - VJ: glitch, rgb_split, strobe, warp, kaleidoscope
   - YouTuber: zoom, swipe, morph, quick_cut
   - Vlogger: crossfade, dissolve, dip_to_black
   - Filmmaker: whip_pan, match_cut, j_cut, l_cut, iris_wipe
   - Video Editor: All types with rationale
   - Format: {"scene_from": 1, "scene_to": 2, "transition": "glitch", "duration": 0.3, "reason": "High-energy scene change, matches BPM"}

3. **Visual Asset Placement**: Suggest VFX assets for each scene (user-type personalized)
   - VJ: Reactive shaders, particle systems, strobes (sync to BPM if music present)
   - YouTuber: Lower thirds, animated text, thumbnail frames
   - Vlogger: B-roll overlays, location tags, transition stingers
   - Filmmaker: Lens flares, film grain, light leaks, color LUTs
   - Video Editor: All categories with technical justification
   - Format: {"scene": 1, "timestamp": "00:15", "asset_type": "shader", "style": "cyberpunk", "reason": "High energy music drop at 128 BPM", "user_type_rationale": "VJ mode: Beat-reactive neon shader for festival aesthetic"}

4. **Scene Reordering**: If narrative flow could be improved
   - Format: {"original_order": [1,2,3,4], "suggested_order": [1,3,2,4], "reason": "Build-up to climax"}

5. **Trim Recommendations**: Frames to remove for tighter pacing
   - Format: {"timestamp_start": "01:23", "timestamp_end": "01:28", "reason": "Dead air, no visual interest"}

6. **Music Sync Suggestions** (if setlist provided):
   - Analyze song BPM, energy curve, drop timing, build-ups
   - Suggest VFX timing aligned to audio cues
   - Format: {"song": "Song Title", "timestamp": "02:15", "bpm": 128, "suggestion": "Drop particle effect on bass drop", "effect_type": "particle_explosion", "sync_to": "drop", "intensity": "high"}

7. **Frame Duplication Suggestions**:
   - Identify moments worth duplicating (freeze frames, dramatic pauses)
   - Format: {"timestamp": "01:45", "reason": "Peak moment - duplicate for emphasis", "duration": 0.5}

Return JSON format with all suggestions.`,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          cuts: { type: "array" },
          transitions: { type: "array" },
          asset_placements: { type: "array" },
          scene_reorder: { type: "object" },
          trims: { type: "array" },
          music_sync: { type: "array" }
        }
      }
    });

    // Fetch matching VFX assets from marketplace
    const assetRecommendations = [];
    for (const placement of suggestions.asset_placements || []) {
      const matchingAssets = await base44.asServiceRole.entities.MarketplaceAsset.filter({
        category: placement.asset_type || 'effect',
        status: 'approved'
      }, '-purchase_count', 5);

      if (matchingAssets.length > 0) {
        assetRecommendations.push({
          scene: placement.scene,
          timestamp: placement.timestamp,
          recommended_assets: matchingAssets.map(a => ({
            id: a.id,
            title: a.title,
            preview_url: a.preview_url,
            price: a.price
          }))
        });
      }
    }

    // Update project with suggestions
    await base44.entities.VideoProject.update(video_project_id, {
      timeline_data: {
        ...project.timeline_data,
        ai_suggestions: suggestions,
        asset_recommendations: assetRecommendations
      }
    });

    return Response.json({
      success: true,
      suggestions,
      asset_recommendations: assetRecommendations,
      message: `Generated ${suggestions.cuts?.length || 0} cut suggestions, ${suggestions.transitions?.length || 0} transitions, and ${assetRecommendations.length} asset recommendations`
    });

  } catch (error) {
    console.error('ai-suggest-video-edits error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
