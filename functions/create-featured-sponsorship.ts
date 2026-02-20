import { getClient } from './_client.ts';
import { encodeCustomMetadata, getApprovalLink, paypalRequest } from './_paypal.ts';
import { withSecurity } from './_security.ts';

Deno.serve(
  withSecurity(async (req) => {
    try {
      const base44 = getClient(req);
      const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { asset_id, duration_days } = await req.json();
    const pricing: Record<number, number> = {
      7: 19.97,
      14: 29.97,
      30: 49.97
    };

    const price = pricing[duration_days];
    if (!price) {
      return Response.json({ error: 'Invalid duration' }, { status: 400 });
    }

    const activeSponsors = await base44.asServiceRole.entities.FeaturedAssetSponsorship.filter({ status: 'active' });
    const usedSlots = new Set(activeSponsors.map((s) => s.placement_slot));
    let placementSlot = 1;
    while (usedSlots.has(placementSlot) && placementSlot <= 6) placementSlot += 1;

    if (placementSlot > 6) {
      return Response.json({ error: 'All featured slots are full. Try again later.' }, { status: 409 });
    }

    const origin = req.headers.get('origin');
    const metadata = encodeCustomMetadata({
      purchase_type: 'featured_asset',
      user_id: user.id,
      asset_id,
      duration_days,
      placement_slot: placementSlot
    });

    const order = await paypalRequest('/v2/checkout/orders', 'POST', {
      intent: 'CAPTURE',
      processing_instruction: 'ORDER_COMPLETE_ON_PAYMENT_APPROVAL',
      purchase_units: [
        {
          custom_id: metadata,
          description: `Featured Asset Sponsorship - ${duration_days} Days`,
          amount: {
            currency_code: 'USD',
            value: price.toFixed(2)
          }
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            user_action: 'PAY_NOW',
            return_url: `${origin}/marketplace?featured_activated=true`,
            cancel_url: `${origin}/marketplace`
          }
        }
      }
    });

    return Response.json({ checkout_url: getApprovalLink(order), order_id: order.id });
    } catch (error) {
      console.error('create-featured-sponsorship error:', error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }
  })
);

