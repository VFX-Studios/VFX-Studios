import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { video_project_id, marketplace_asset_id, platforms } = await req.json();

    if (!video_project_id && !marketplace_asset_id) {
      return Response.json({ error: 'Provide video_project_id or marketplace_asset_id' }, { status: 400 });
    }

    let contentData;
    if (video_project_id) {
      const projects = await base44.entities.VideoProject.filter({ id: video_project_id });
      contentData = projects[0];
    } else {
      const assets = await base44.entities.MarketplaceAsset.filter({ id: marketplace_asset_id });
      contentData = assets[0];
    }

    if (!contentData) {
      return Response.json({ error: 'Content not found' }, { status: 404 });
    }

    const targetPlatforms = platforms || ['youtube', 'tiktok', 'instagram', 'twitter'];

    const copyVariations = await base44.integrations.Core.InvokeLLM({
      prompt: `Generate viral social media promotional copy for this content:

**Title:** ${contentData.title}
**Description:** ${contentData.description || 'N/A'}
**Type:** ${video_project_id ? 'Video Project' : 'Marketplace Asset'}
${contentData.scene_analysis ? `**Scenes:** ${JSON.stringify(contentData.scene_analysis)}` : ''}

**Platforms:** ${targetPlatforms.join(', ')}

For EACH platform, generate 5 copy variations optimized for that platform's algorithm and audience.

**Output Format (JSON):**
{
  "youtube": [
    {
      "title": "...",
      "description": "...",
      "hashtags": ["#tag1", "#tag2"],
      "hook_type": "stat|question|controversy|story",
      "predicted_ctr": 0.05-0.15
    }
  ],
  "tiktok": [
    {
      "caption": "...",
      "hashtags": ["#fyp", "#tag2"],
      "hook_type": "...",
      "cta": "Follow for Part 2"
    }
  ],
  "instagram": [...],
  "twitter": [
    {
      "thread": ["Tweet 1...", "Tweet 2..."],
      "hashtags": [...]
    }
  ]
}

**Rules:**
- YouTube titles: 60 chars max, SEO-optimized
- TikTok captions: 150 chars, hook-first, trending hashtags
- Instagram: Emoji-rich, storytelling, 30 hashtags max
- Twitter: 280 chars/tweet, viral hooks, engagement bait

Front-load value. Use power words. Create curiosity gaps. Be authentic.`,
      add_context_from_internet: true, // Use trending data
      response_json_schema: {
        type: "object",
        properties: {
          youtube: { type: "array" },
          tiktok: { type: "array" },
          instagram: { type: "array" },
          twitter: { type: "array" }
        }
      }
    });

    return Response.json({
      success: true,
      copy_variations: copyVariations,
      message: `Generated ${Object.values(copyVariations).flat().length} copy variations across ${targetPlatforms.length} platforms`
    });

  } catch (error) {
    console.error('generate-social-copy error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
