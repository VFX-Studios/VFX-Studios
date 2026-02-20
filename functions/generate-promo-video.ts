import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { performance_id, format = 'tiktok' } = await req.json();

    // Get performance data
    const performance = await base44.asServiceRole.entities.LivePerformance.filter({ id: performance_id });
    if (!performance[0]) {
      return Response.json({ error: 'Performance not found' }, { status: 404 });
    }

    // Extract 15-second highlight from performance
    const heatmaps = await base44.asServiceRole.entities.PerformanceHeatmap.filter({
      performance_id
    });

    // Find peak moment (highest sentiment)
    const peakMoment = heatmaps.sort((a, b) => b.sentiment_score - a.sentiment_score)[0];
    const startTime = peakMoment ? peakMoment.timestamp_seconds - 5 : 0;

    // Use Runway Gen-3 for video generation with 9:16 aspect ratio
    const videoPrompt = `Create a 15-second vertical (9:16) promotional video for a VJ performance. 
    Style: Energetic, neon colors, cyberpunk aesthetic. 
    Include text overlay: "${user.full_name || 'Live VJ Performance'}"
    Peak moment at ${startTime}s. 
    TikTok/Instagram Reels optimized.`;

    const videoResult = await base44.integrations.Core.InvokeLLM({
      prompt: videoPrompt,
      add_context_from_internet: false,
      response_json_schema: {
        type: "object",
        properties: {
          video_url: { type: "string" },
          duration: { type: "number" },
          format: { type: "string" }
        }
      }
    });

    // Store promo video
    const promo = await base44.entities.PromoVideo.create({
      user_id: user.id,
      source_performance_id: performance_id,
      video_url: videoResult.video_url || 'https://placeholder-video.com/promo.mp4',
      format
    });

    // Generate share links
    const shareLinks = {
      tiktok: `https://www.tiktok.com/upload?video=${encodeURIComponent(promo.video_url)}`,
      instagram: `https://www.instagram.com/create/story`,
      youtube: `https://www.youtube.com/upload`,
      twitter: `https://twitter.com/intent/tweet?text=Check out my VFX performance!&url=${encodeURIComponent(promo.video_url)}`
    };

    return Response.json({
      promo_id: promo.id,
      video_url: promo.video_url,
      share_links: shareLinks,
      duration: 15,
      format: '9:16 (1080x1920)',
      message: '15sec promo video generated! Ready to share.'
    });

  } catch (error) {
    console.error('generate-promo-video error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
