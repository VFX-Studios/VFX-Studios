import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { source_asset_id, variation_prompt } = await req.json();

    if (!source_asset_id) {
      return Response.json({ error: 'source_asset_id required' }, { status: 400 });
    }

    // Fetch source asset
    const sourceAsset = await base44.entities.MarketplaceAsset.filter({ id: source_asset_id });
    if (!sourceAsset[0]) {
      return Response.json({ error: 'Asset not found' }, { status: 404 });
    }

    const asset = sourceAsset[0];

    // Generate variation using AI
    const prompt = variation_prompt || `Create a variation of this VFX asset. ${asset.description}. Keep the same style but introduce subtle differences.`;

    const generatedImage = await base44.integrations.Core.GenerateImage({
      prompt: prompt,
      existing_image_urls: [asset.preview_url]
    });

    // Deduct 1 credit for variation generation
    const subscriptions = await base44.entities.Subscription.filter({ user_id: user.id });
    const subscription = subscriptions[0];

    if (subscription && subscription.credits > 0) {
      await base44.entities.Subscription.update(subscription.id, {
        credits: subscription.credits - 1
      });
    }

    // Track analytics
    await base44.analytics.track({
      eventName: 'ai_asset_variation_generated',
      properties: {
        source_asset_id,
        user_id: user.id
      }
    });

    return Response.json({
      success: true,
      variation_url: generatedImage.url,
      credits_remaining: subscription ? subscription.credits - 1 : 0,
      message: 'Variation generated! You can now save this as a new asset or purchase the original.'
    });

  } catch (error) {
    console.error('ai-generate-asset-variation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
