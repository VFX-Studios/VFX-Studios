import { getClient } from './_client.ts';
import { getApprovalLink, paypalRequest } from './_paypal.ts';
import { withSecurity } from './_security.ts';

const CREATOR_PRO_PLAN_ID = Deno.env.get('PAYPAL_PLAN_CREATOR_PRO');

Deno.serve(
  withSecurity(async (req) => {
    try {
      const base44 = getClient(req);
      const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!CREATOR_PRO_PLAN_ID) {
      return Response.json({ error: 'Missing PAYPAL_PLAN_CREATOR_PRO env var' }, { status: 500 });
    }

    const origin = req.headers.get('origin');
    const subscription = await paypalRequest('/v1/billing/subscriptions', 'POST', {
      plan_id: CREATOR_PRO_PLAN_ID,
      custom_id: user.id,
      subscriber: user.email ? { email_address: user.email } : undefined,
      application_context: {
        brand_name: 'VFX Studios',
        return_url: `${origin}/dashboard?creator_pro_activated=true`,
        cancel_url: `${origin}/creator-pro?checkout_cancelled=true`,
        user_action: 'SUBSCRIBE_NOW'
      }
    });

    return Response.json({
      checkout_url: getApprovalLink(subscription),
      subscription_id: subscription.id
    });
    } catch (error) {
      console.error('create-creator-pro-checkout error:', error.message);
      return Response.json({ error: 'Checkout creation failed', details: error.message }, { status: 500 });
    }
  })
);

