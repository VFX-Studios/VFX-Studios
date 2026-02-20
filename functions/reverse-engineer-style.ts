import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { marketplace_asset_id } = await req.json();

    // Get marketplace asset
    const assets = await base44.asServiceRole.entities.MarketplaceAsset.filter({
      id: marketplace_asset_id
    });

    if (!assets[0]) {
      return Response.json({ error: 'Asset not found' }, { status: 404 });
    }

    const asset = assets[0];

    // AI reverse-engineers the style
    const analysisPrompt = `Analyze this visual asset and extract its technical parameters:
    Asset: ${asset.title}
    Description: ${asset.description}
    Preview URL: ${asset.preview_url}
    
    Reverse-engineer the style to reveal adjustable parameters that recreate similar effects.
    Include: color scheme, motion type, particle density, blur amount, saturation, contrast, etc.`;

    const styleAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      file_urls: asset.preview_url ? [asset.preview_url] : [],
      response_json_schema: {
        type: "object",
        properties: {
          style_name: { type: "string" },
          parameters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                value: { type: "number" },
                min: { type: "number" },
                max: { type: "number" },
                description: { type: "string" }
              }
            }
          },
          color_palette: {
            type: "array",
            items: { type: "string" }
          },
          difficulty: { type: "string" },
          estimated_time: { type: "string" }
        }
      }
    });

    // Calculate recreation difficulty
    const complexityScore = styleAnalysis.parameters.length * 10;
    const canRecreate = complexityScore < 80;

    return Response.json({
      asset_title: asset.title,
      asset_price: asset.price,
      reverse_engineered: styleAnalysis,
      can_recreate_free: canRecreate,
      recreation_difficulty: canRecreate ? 'Easy' : 'Complex - Buy recommended',
      upsell_message: canRecreate 
        ? `Recreate this for free using ${styleAnalysis.parameters.length} sliders`
        : `This style is complex. Buy exact asset for $${asset.price} to save ${styleAnalysis.estimated_time}`,
      parameters_ui: styleAnalysis.parameters.map(p => ({
        label: p.name,
        type: 'slider',
        min: p.min,
        max: p.max,
        default: p.value,
        tooltip: p.description
      }))
    });

  } catch (error) {
    console.error('reverse-engineer-style error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
