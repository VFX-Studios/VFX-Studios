import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription
    const subscriptions = await base44.entities.Subscription.filter({ user_id: user.id });
    const subscription = subscriptions[0];

    if (!subscription) {
      return Response.json({
        canSell: false,
        reason: 'No subscription found',
        message: 'You must have an active subscription to sell assets.'
      }, { status: 403 });
    }

    // CRITICAL: Free users CANNOT sell assets
    const allowedTiers = ['weekly', 'monthly', 'annual', 'creator_pro'];
    if (!allowedTiers.includes(subscription.tier)) {
      return Response.json({
        canSell: false,
        reason: 'free_tier_restriction',
        tier: subscription.tier,
        message: 'Asset sales are limited to premium members only. Upgrade to sell your creations on the marketplace.',
        upgradeUrl: '/pricing'
      }, { status: 403 });
    }

    // Check subscription status
    if (subscription.status === 'cancelled' || subscription.status === 'past_due') {
      return Response.json({
        canSell: false,
        reason: 'subscription_inactive',
        status: subscription.status,
        message: 'Your subscription is inactive. Please renew to continue selling.'
      }, { status: 403 });
    }

    // All checks passed
    return Response.json({
      canSell: true,
      tier: subscription.tier,
      message: 'You are authorized to sell assets on the marketplace.'
    });

  } catch (error) {
    console.error('marketplace-validate-seller error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
