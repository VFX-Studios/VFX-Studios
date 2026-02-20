import { getClient } from './_client.ts';
import { handlePayPalEvent } from './_payments-webhook-handler.ts';
import { verifyWebhookSignature } from './_paypal.ts';
import { withSecurity } from './_security.ts';

Deno.serve(
  withSecurity(async (req) => {
    const base44 = getClient(req);

  try {
    const body = await req.text();
    const verified = await verifyWebhookSignature(req, body);
    if (!verified) {
      return Response.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    console.log('PayPal webhook event:', event.event_type);
    await handlePayPalEvent(base44, event);

    return Response.json({ received: true });
  } catch (error) {
    console.error('paypal-webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
  })
);

