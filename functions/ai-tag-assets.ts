import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assetId, imageUrl } = await req.json();

    // Use AI to analyze and tag the asset
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this visual asset for VJ performance use. Identify:
- Visual style (e.g., abstract, geometric, organic, cyberpunk, psychedelic)
- Color palette dominant colors
- Motion type (if applicable: fast, slow, pulsing, flowing)
- Energy level (calm, medium, intense, chaotic)
- Best use cases (opener, build, peak, breakdown, ambient)
- Mood descriptors (e.g., energetic, dreamy, aggressive, ethereal)

Return 8-12 relevant tags that would help VJs find this asset.`,
      file_urls: [imageUrl],
      response_json_schema: {
        type: "object",
        properties: {
          tags: { 
            type: "array", 
            items: { type: "string" },
            description: "8-12 descriptive tags"
          },
          primary_color: { type: "string" },
          energy_level: { 
            type: "string",
            enum: ["calm", "medium", "intense", "chaotic"]
          },
          visual_style: { type: "string" },
          best_for: { 
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    // Update asset with AI-generated tags
    await base44.entities.VisualAsset.update(assetId, {
      tags: analysis.tags,
      metadata: {
        ai_analysis: {
          primary_color: analysis.primary_color,
          energy_level: analysis.energy_level,
          visual_style: analysis.visual_style,
          best_for: analysis.best_for
        }
      }
    });

    return Response.json({
      success: true,
      tags: analysis.tags,
      analysis
    });
  } catch (error) {
    console.error('AI tagging error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
