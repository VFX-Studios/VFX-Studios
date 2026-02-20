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

    const { credit_pack } = await req.json();

    const packs: Record<string, { credits: number; price: number; name: string }> = {
      starter: { credits: 10, price: 2.99, name: '10 Credits' },
      pro: { credits: 50, price: 11.99, name: '50 Credits' },
      mega: { credits: 200, price: 34.99, name: '200 Credits' }
    };

    const pack = packs[credit_pack];
    if (!pack) {
      return Response.json({ error: 'Invalid credit pack' }, { status: 400 });
    }

    const origin = req.headers.get('origin');
    const metadata = encodeCustomMetadata({
      purchase_type: 'ai_credits',
      user_id: user.id,
      credit_amount: pack.credits
    });

    const order = await paypalRequest('/v2/checkout/orders', 'POST', {
      intent: 'CAPTURE',
      processing_instruction: 'ORDER_COMPLETE_ON_PAYMENT_APPROVAL',
      purchase_units: [
        {
          custom_id: metadata,
          description: `AI Generation Credits - ${pack.name}`,
          amount: {
            currency_code: 'USD',
            value: pack.price.toFixed(2)
          }
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            user_action: 'PAY_NOW',
            return_url: `${origin}/dashboard?credits_purchased=true`,
            cancel_url: `${origin}/dashboard?credits_cancelled=true`
          }
        }
      }
    });

    const checkoutUrl = getApprovalLink(order);

    return Response.json({
      checkout_url: checkoutUrl,
      order_id: order.id
    });
    } catch (error) {
      console.error('create-credit-checkout error:', error.message);
      return Response.json({ error: 'Failed to create checkout', details: error.message }, { status: 500 });
    }
  })
);

