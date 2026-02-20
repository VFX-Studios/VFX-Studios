import { getClient } from './_client.ts';
import { getApprovalLink, paypalRequest } from './_paypal.ts';
import { withSecurity } from './_security.ts';

const PLAN_IDS: Record<string, string | undefined> = {
  weekly: Deno.env.get('PAYPAL_PLAN_WEEKLY'),
  monthly: Deno.env.get('PAYPAL_PLAN_MONTHLY'),
  annual: Deno.env.get('PAYPAL_PLAN_ANNUAL'),
  enterprise: Deno.env.get('PAYPAL_PLAN_ENTERPRISE')
};

Deno.serve(
  withSecurity(async (req) => {
    try {
      const base44 = getClient(req);
      const { tier, email, userId } = await req.json();

    if (!tier || !PLAN_IDS[tier]) {
      return Response.json({ error: 'Invalid tier or missing PayPal plan mapping' }, { status: 400 });
    }

    const origin = req.headers.get('origin');
    const subscription = await paypalRequest('/v1/billing/subscriptions', 'POST', {
      plan_id: PLAN_IDS[tier],
      custom_id: userId,
      subscriber: email ? { email_address: email } : undefined,
      application_context: {
        brand_name: 'VFX Studios',
        return_url: `${origin}/dashboard?paypal_subscribed=true&tier=${tier}`,
        cancel_url: `${origin}/pricing?checkout_cancelled=true`,
        user_action: 'SUBSCRIBE_NOW'
      }
    });

    return Response.json({
      url: getApprovalLink(subscription),
      checkout_url: getApprovalLink(subscription),
      subscriptionId: subscription.id,
      subscription_id: subscription.id
    });
    } catch (error) {
      console.error('create-checkout error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  })
);

