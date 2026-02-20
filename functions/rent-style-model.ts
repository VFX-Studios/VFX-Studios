import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { model_id, prompt } = await req.json();

    // Get style model
    const model = await base44.entities.AIStyleModel.get(model_id);
    if (!model || model.model_status !== 'active') {
      return Response.json({ error: 'Model not available' }, { status: 404 });
    }

    // Check user credits
    if (user.ai_credits_remaining < 1) {
      return Response.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Deduct credit
    await base44.auth.updateMe({
      ai_credits_remaining: user.ai_credits_remaining - 1
    });

    // Generate using style (placeholder - actual generation uses model)
    const result = await base44.integrations.Core.GenerateImage({
      prompt: `${prompt}. Style: ${model.model_name}`,
      existing_image_urls: model.training_images?.slice(0, 2)
    });

    // Record rental
    const creatorPayout = model.rental_price * 0.70;
    const platformFee = model.rental_price * 0.30;

    await base44.entities.StyleModelRental.create({
      renter_user_id: user.id,
      model_id,
      creator_user_id: model.creator_user_id,
      price_paid: model.rental_price,
      creator_payout: creatorPayout,
      platform_fee: platformFee,
      generated_asset_url: result.url,
      generation_prompt: prompt
    });

    // Update model stats
    await base44.entities.AIStyleModel.update(model_id, {
      total_rentals: (model.total_rentals || 0) + 1,
      total_revenue: (model.total_revenue || 0) + model.rental_price
    });

    // Pay creator (add to their balance)
    const creators = await base44.asServiceRole.entities.User.filter({ id: model.creator_user_id });
    if (creators[0]) {
    // In production: integrate with payouts (e.g., PayPal Payouts or platform wallet)
      console.log(`Creator ${model.creator_user_id} earned $${creatorPayout}`);
    }

    return Response.json({
      success: true,
      generated_url: result.url,
      credits_remaining: user.ai_credits_remaining - 1
    });

  } catch (error) {
    console.error('rent-style-model error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
