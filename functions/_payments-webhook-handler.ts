import { withSecurity } from './_security.ts';
import { decodeCustomMetadata } from './_paypal.ts';
import { getMarketplaceFeePercentForTier } from './_marketplace-fees.ts';

function extractMetadata(event: any) {
  const resource = event?.resource || {};

  const customRaw =
    resource.custom_id ||
    resource?.purchase_units?.[0]?.custom_id ||
    resource?.supplementary_data?.related_ids?.order_id ||
    '';

  return decodeCustomMetadata(customRaw);
}

function captureAmount(event: any) {
  const resource = event?.resource || {};
  const value =
    resource.amount?.value ||
    resource.seller_receivable_breakdown?.gross_amount?.value ||
    resource?.purchase_units?.[0]?.amount?.value ||
    '0';
  return Number(value || 0);
}

export async function handlePayPalEvent(base44: any, event: any) {
  const eventType = event?.event_type;
  const resource = event?.resource || {};
  const metadata = extractMetadata(event);

  if (eventType === 'CHECKOUT.ORDER.APPROVED' || eventType === 'PAYMENT.CAPTURE.COMPLETED') {
    const purchaseType = metadata.purchase_type;

    if (purchaseType === 'ai_credits') {
      const userId = metadata.user_id;
      const creditAmount = Number(metadata.credit_amount || 0);
      const users = await base44.asServiceRole.entities.User.filter({ id: userId });
      const user = users[0];
      if (user && creditAmount > 0) {
        await base44.asServiceRole.entities.User.update(userId, {
          ai_credits_remaining: (user.ai_credits_remaining || 0) + creditAmount,
          total_credits_purchased: (user.total_credits_purchased || 0) + creditAmount
        });
      }
    }

    if (purchaseType === 'marketplace_asset') {
      const buyerUserId = metadata.buyer_user_id;
      const sellerUserId = metadata.seller_user_id;
      const assetId = metadata.asset_id;
      const amount = captureAmount(event);
      const sellerSubs = await base44.asServiceRole.entities.Subscription.filter({ user_id: sellerUserId });
      const sellerTier = sellerSubs[0]?.tier || 'free';
      const feePercent = getMarketplaceFeePercentForTier(sellerTier);
      const platformFee = Number((amount * feePercent) / 100);
      const sellerPayout = Number(amount - platformFee);

      await base44.asServiceRole.entities.MarketplacePurchase.create({
        buyer_user_id: buyerUserId,
        marketplace_asset_id: assetId,
        seller_user_id: sellerUserId,
        price_paid: amount,
        platform_fee: platformFee,
        seller_payout: sellerPayout,
        platform_fee_percent: feePercent,
        paypal_order_id: resource?.supplementary_data?.related_ids?.order_id || resource?.id,
        paypal_capture_id: resource?.id,
        status: 'completed'
      });

      const assets = await base44.asServiceRole.entities.MarketplaceAsset.filter({ id: assetId });
      if (assets[0]) {
        await base44.asServiceRole.entities.MarketplaceAsset.update(assetId, {
          purchase_count: (assets[0].purchase_count || 0) + 1,
          revenue_total: (assets[0].revenue_total || 0) + amount
        });
      }
    }

    if (purchaseType === 'custom_ai_model') {
      const modelId = metadata.model_id;
      if (modelId) {
        await base44.asServiceRole.entities.CustomAIModel.update(modelId, {
          training_status: 'training',
          model_status: 'training'
        });
      }
    }

    if (purchaseType === 'featured_asset') {
      const assetId = metadata.asset_id;
      const userId = metadata.user_id;
      const durationDays = Number(metadata.duration_days || 0);
      const placementSlot = Number(metadata.placement_slot || 1);
      const amount = captureAmount(event);

      await base44.asServiceRole.entities.FeaturedAssetSponsorship.create({
        marketplace_asset_id: assetId,
        creator_user_id: userId,
        duration_days: durationDays,
        price_paid: amount,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
        placement_slot: placementSlot,
        status: 'active'
      });
    }

    await base44.asServiceRole.entities.AnalyticsEvent.create({
      event_type: 'purchase_completed',
      user_id: metadata.user_id || metadata.buyer_user_id,
      event_data: {
        purchase_type: metadata.purchase_type,
        amount: captureAmount(event),
        timestamp: new Date().toISOString()
      }
    });
  }

  if (
    eventType === 'BILLING.SUBSCRIPTION.CREATED' ||
    eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' ||
    eventType === 'BILLING.SUBSCRIPTION.UPDATED'
  ) {
    const userId = resource.custom_id;
    const planId = resource.plan_id;

    const tierMap: Record<string, string> = {
      [Deno.env.get('PAYPAL_PLAN_WEEKLY') || '']: 'weekly',
      [Deno.env.get('PAYPAL_PLAN_MONTHLY') || '']: 'monthly',
      [Deno.env.get('PAYPAL_PLAN_ANNUAL') || '']: 'annual',
      [Deno.env.get('PAYPAL_PLAN_CREATOR_PRO') || '']: 'creator_pro',
      [Deno.env.get('PAYPAL_PLAN_ENTERPRISE') || '']: 'enterprise'
    };

    const tier = tierMap[planId] || 'free';

    if (userId) {
      const subs = await base44.asServiceRole.entities.Subscription.filter({ user_id: userId });
      const payload = {
        user_id: userId,
        tier,
        status: resource.status ? String(resource.status).toLowerCase() : 'active',
        paypal_subscription_id: resource.id,
        paypal_plan_id: planId,
        current_period_start: new Date().toISOString(),
        current_period_end: resource.billing_info?.next_billing_time || null
      };

      if (subs.length > 0) {
        await base44.asServiceRole.entities.Subscription.update(subs[0].id, payload);
      } else {
        await base44.asServiceRole.entities.Subscription.create(payload);
      }

      await base44.asServiceRole.entities.AnalyticsEvent.create({
        event_type: 'subscription_updated',
        user_id: userId,
        metadata: { tier, status: payload.status, subscription_id: resource.id }
      });
    }
  }

  if (
    eventType === 'BILLING.SUBSCRIPTION.CANCELLED' ||
    eventType === 'BILLING.SUBSCRIPTION.EXPIRED' ||
    eventType === 'BILLING.SUBSCRIPTION.SUSPENDED'
  ) {
    const subscriptionId = resource.id;
    const subs = await base44.asServiceRole.entities.Subscription.filter({ paypal_subscription_id: subscriptionId });
    if (subs[0]) {
      await base44.asServiceRole.entities.Subscription.update(subs[0].id, { status: 'cancelled' });
      await base44.asServiceRole.entities.AnalyticsEvent.create({
        event_type: 'subscription_cancelled',
        user_id: subs[0].user_id,
        metadata: { subscription_id: subscriptionId }
      });
    }
  }

  if (eventType === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
    const subscriptionId = resource.id;
    const subs = await base44.asServiceRole.entities.Subscription.filter({ paypal_subscription_id: subscriptionId });
    if (subs[0]) {
      await base44.asServiceRole.entities.Subscription.update(subs[0].id, { status: 'past_due' });
      await base44.asServiceRole.entities.AnalyticsEvent.create({
        event_type: 'payment_failed',
        user_id: subs[0].user_id,
        metadata: { subscription_id: subscriptionId }
      });
    }
  }
}


