import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { video_url, video_project_id, platform } = await req.json();

    if (!video_url && !video_project_id) {
      return Response.json({ error: 'Provide video_url or video_project_id' }, { status: 400 });
    }

    let videoSource = video_url;
    if (video_project_id) {
      const projects = await base44.entities.VideoProject.filter({ id: video_project_id });
      videoSource = projects[0]?.video_url;
    }

    if (!videoSource) {
      return Response.json({ error: 'Video not found' }, { status: 404 });
    }

    // Analyze video for thumbnail-worthy moments
    const thumbnailAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this video and suggest optimal thumbnail designs for ${platform || 'YouTube/TikTok'}:

**Platform Rules:**
- **YouTube:** 1280x720px (16:9), high-contrast, faces with emotion, bold text (3-5 words), curiosity gap
- **TikTok:** 1080x1920px (9:16), vertical, first frame matters, text overlays, trending aesthetics

**Trending Thumbnail Styles (2026):**
1. **Reaction Face:** Exaggerated emotion (shock, excitement, confusion)
2. **Split Screen:** Before/After, Challenge, Comparison
3. **Bold Text:** ALL CAPS, neon colors, drop shadow, 3D text
4. **Arrows/Circles:** Point to subject, red circles, yellow arrows
5. **High Contrast:** Saturated colors, dark/light balance, pop art
6. **Minimalist:** Clean, single subject, negative space
7. **Cinematic:** Film grain, color grade, 2.35:1 aspect bars

**Provide 5 thumbnail concepts:**

For each concept:
1. **Best Frame Timestamp:** Extract frame from video (MM:SS)
2. **Text Overlay:** What text to add (max 5 words)
3. **Style:** Which trending style to apply
4. **Color Palette:** Hex codes for text/background
5. **Predicted CTR:** 0.05-0.20 based on current trends
6. **Rationale:** Why this thumbnail will perform well

Return JSON format.`,
      add_context_from_internet: true, // Get trending thumbnail data
      file_urls: [videoSource],
      response_json_schema: {
        type: "object",
        properties: {
          concepts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                timestamp: { type: "string" },
                text_overlay: { type: "string" },
                style: { type: "string" },
                color_palette: { type: "object" },
                predicted_ctr: { type: "number" },
                rationale: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Generate thumbnail images using AI
    const thumbnailUrls = [];
    for (const concept of thumbnailAnalysis.concepts.slice(0, 3)) {
      try {
        const thumbnail = await base44.integrations.Core.GenerateImage({
          prompt: `Create a ${platform || 'YouTube'} thumbnail: ${concept.style} style. ${concept.text_overlay}. High contrast, professional, eye-catching. Color palette: ${JSON.stringify(concept.color_palette)}.`,
          existing_image_urls: [videoSource]
        });
        thumbnailUrls.push({
          ...concept,
          thumbnail_url: thumbnail.url
        });
      } catch (error) {
        console.error('Thumbnail generation failed:', error);
      }
    }

    return Response.json({
      success: true,
      concepts: thumbnailAnalysis.concepts,
      generated_thumbnails: thumbnailUrls,
      message: `Generated ${thumbnailUrls.length} thumbnail designs`
    });

  } catch (error) {
    console.error('generate-thumbnail-suggestions error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
