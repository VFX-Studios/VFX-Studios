import { getClient } from './_client.ts';
import { encodeCustomMetadata, getApprovalLink, paypalRequest } from './_paypal.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { model_name, training_images, rental_price, tier } = await req.json();

    if (!model_name || !training_images || training_images.length < 5) {
      return Response.json({ error: 'Provide model name and at least 5 training images' }, { status: 400 });
    }

    const tierPricing: Record<string, number> = {
      basic: 49.97,
      advanced: 99.97,
      professional: 199.97
    };

    const trainingFee = tierPricing[tier] || 49.97;

    const model = await base44.entities.AIStyleModel.create({
      creator_user_id: user.id,
      model_name,
      training_images,
      rental_price: parseFloat(rental_price),
      model_status: 'pending_payment',
      total_rentals: 0
    });

    const origin = req.headers.get('origin');
    const metadata = encodeCustomMetadata({
      purchase_type: 'custom_ai_model',
      user_id: user.id,
      model_id: model.id
    });

    const order = await paypalRequest('/v2/checkout/orders', 'POST', {
      intent: 'CAPTURE',
      processing_instruction: 'ORDER_COMPLETE_ON_PAYMENT_APPROVAL',
      purchase_units: [
        {
          custom_id: metadata,
          description: `Custom AI Style Training - ${tier}`,
          amount: {
            currency_code: 'USD',
            value: trainingFee.toFixed(2)
          }
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            user_action: 'PAY_NOW',
            return_url: `${origin}/dashboard?model_training=true`,
            cancel_url: `${origin}/style-marketplace`
          }
        }
      }
    });

    return Response.json({ checkout_url: getApprovalLink(order), order_id: order.id, model_id: model.id });
  } catch (error) {
    console.error('train-custom-style error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
