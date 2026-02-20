import { getClient } from './_client.ts';
import { paypalRequest } from './_paypal.ts';
import { withSecurity } from './_security.ts';

Deno.serve(
  withSecurity(async (req) => {
    try {
      const base44 = getClient(req);
      const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subs = await base44.entities.Subscription.filter({ user_id: user.id });
    if (subs.length === 0 || !subs[0].paypal_subscription_id) {
      return Response.json({ error: 'No active PayPal subscription' }, { status: 404 });
    }

    await paypalRequest(
      `/v1/billing/subscriptions/${subs[0].paypal_subscription_id}/cancel`,
      'POST',
      { reason: 'Cancelled by user request' }
    );

    await base44.entities.Subscription.update(subs[0].id, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    });

    return Response.json({ success: true });
    } catch (error) {
      console.error('cancel-subscription error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  })
);

