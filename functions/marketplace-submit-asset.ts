import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error('marketplace-submit-asset: Unauthorized');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // CRITICAL: Verify premium membership (free users blocked)
    const subscriptions = await base44.entities.Subscription.filter({ user_id: user.id });
    const subscription = subscriptions[0];

    const allowedTiers = ['weekly', 'monthly', 'annual', 'creator_pro'];
    if (!subscription || !allowedTiers.includes(subscription.tier)) {
      console.error('marketplace-submit-asset: Non-premium user blocked:', subscription?.tier);
      return Response.json({
        error: 'Premium membership required',
        message: 'Asset sales are limited to premium members. Upgrade to start selling.',
        tier: subscription?.tier || 'free'
      }, { status: 403 });
    }

    const { title, description, price, category, tags, preview_file, asset_file } = await req.json();

    // Validation
    if (!title || !description || !price || !category || !preview_file || !asset_file) {
      console.error('marketplace-submit-asset: Missing required fields');
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (price < 0.99) {
      return Response.json({ error: 'Minimum price is $0.99' }, { status: 400 });
    }

    // Upload files to storage
    let previewUrl, assetUrl;
    
    try {
      // Upload preview
      const previewResponse = await base44.integrations.Core.UploadFile({ 
        file: preview_file 
      });
      previewUrl = previewResponse.file_url;

      // Upload full asset
      const assetResponse = await base44.integrations.Core.UploadFile({ 
        file: asset_file 
      });
      assetUrl = assetResponse.file_url;
    } catch (uploadError) {
      console.error('marketplace-submit-asset: Upload failed:', uploadError);
      return Response.json({ error: 'File upload failed' }, { status: 500 });
    }

    // Create marketplace asset
    const asset = await base44.entities.MarketplaceAsset.create({
      seller_user_id: user.id,
      seller_subscription_tier: subscription.tier,
      title,
      description,
      price: parseFloat(price),
      preview_url: previewUrl,
      file_url: assetUrl,
      category,
      tags: tags || [],
      status: 'pending'
    });

    // Track submission analytics
    await base44.analytics.track({
      eventName: 'marketplace_asset_submitted',
      properties: { 
        asset_id: asset.id, 
        category, 
        price: parseFloat(price) 
      }
    });

    console.log('marketplace-submit-asset: Success:', asset.id);

    return Response.json({ 
      success: true, 
      asset_id: asset.id,
      message: 'Asset submitted for review. You will be notified when approved.' 
    });

  } catch (error) {
    console.error('marketplace-submit-asset: Error:', error.message);
    return Response.json({ 
      error: 'Failed to submit asset',
      details: error.message 
    }, { status: 500 });
  }
  }));
