import { getClient } from './_client.ts';
import { getPayPalManageSubscriptionsUrl } from './_paypal.ts';
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
      return Response.json({ error: 'No PayPal subscription found' }, { status: 404 });
    }

    return Response.json({
      url: getPayPalManageSubscriptionsUrl(),
      note: 'PayPal does not provide a direct per-subscription portal URL via API. Open Auto Payments and manage the active billing agreement.'
    });
    } catch (error) {
      console.error('create-portal-session error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }
  })
);

