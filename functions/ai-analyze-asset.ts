import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { asset_url, asset_type } = await req.json();

    if (!asset_url) {
      return Response.json({ error: 'asset_url required' }, { status: 400 });
    }

    // Use InvokeLLM with vision to analyze the asset
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this VFX asset image/video and provide:

1. **Visual Style Tags** (5-10 tags): Identify the aesthetic (cyberpunk, neon, abstract, glitch, retro, minimalist, organic, geometric, etc.)
2. **Technical Tags** (3-5 tags): Resolution indicators (4K, HD, SD), format (loop, shader, animation), complexity (simple, intermediate, advanced)
3. **Category**: Choose ONE: shader, animation, loop, ai_art, preset, effect
4. **Pricing Recommendation**: Suggest price in USD based on:
   - Quality/resolution: SD ($0.99-$4.99), HD ($4.99-$14.99), 4K ($14.99-$49.99)
   - Complexity: Simple loop (lower end), Advanced shader (upper end)
   - Market trends: Cyberpunk/neon currently +25% premium, minimalist -10%
   - Creator status: New seller (15% below market average)
5. **Description**: Write a 2-3 sentence SEO-optimized description highlighting style, technical specs, and use cases
6. **Promotional Copy**: Write a 1-sentence punchy tagline for social media

Return JSON format:
{
  "tags": ["tag1", "tag2", ...],
  "category": "category_name",
  "suggested_price": 14.99,
  "price_rationale": "High-quality 4K cyberpunk loop with advanced shader effects...",
  "description": "...",
  "promo_copy": "...",
  "market_demand": "high|medium|low"
}`,
      add_context_from_internet: false,
      file_urls: [asset_url],
      response_json_schema: {
        type: "object",
        properties: {
          tags: { type: "array", items: { type: "string" } },
          category: { type: "string" },
          suggested_price: { type: "number" },
          price_rationale: { type: "string" },
          description: { type: "string" },
          promo_copy: { type: "string" },
          market_demand: { type: "string" }
        }
      }
    });

    // Fetch market data for context
    const similarAssets = await base44.asServiceRole.entities.MarketplaceAsset.filter({
      category: analysis.category,
      status: 'approved'
    }, '-purchase_count', 10);

    const avgPrice = similarAssets.length > 0
      ? similarAssets.reduce((sum, a) => sum + a.price, 0) / similarAssets.length
      : analysis.suggested_price;

    const topSellingPrice = similarAssets[0]?.price || analysis.suggested_price;

    return Response.json({
      success: true,
      analysis,
      market_context: {
        category_average_price: avgPrice.toFixed(2),
        top_selling_price: topSellingPrice.toFixed(2),
        trending_tags: similarAssets.slice(0, 5).flatMap(a => a.tags || [])
      }
    });

  } catch (error) {
    console.error('ai-analyze-asset error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
