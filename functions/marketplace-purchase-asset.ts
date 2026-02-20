import { getClient } from './_client.ts';
import { encodeCustomMetadata, getApprovalLink, paypalRequest } from './_paypal.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { asset_id } = await req.json();
    const asset = await base44.entities.MarketplaceAsset.get(asset_id);
    if (!asset || asset.status !== 'approved') {
      return Response.json({ error: 'Asset not available' }, { status: 404 });
    }

    const existingPurchases = await base44.entities.MarketplacePurchase.filter({
      buyer_user_id: user.id,
      marketplace_asset_id: asset_id
    });
    if (existingPurchases.length > 0) {
      return Response.json({ error: 'You already own this asset', download_url: asset.file_url }, { status: 400 });
    }

    const origin = req.headers.get('origin');
    const metadata = encodeCustomMetadata({
      purchase_type: 'marketplace_asset',
      buyer_user_id: user.id,
      seller_user_id: asset.seller_user_id,
      asset_id
    });

    const order = await paypalRequest('/v2/checkout/orders', 'POST', {
      intent: 'CAPTURE',
      processing_instruction: 'ORDER_COMPLETE_ON_PAYMENT_APPROVAL',
      purchase_units: [
        {
          custom_id: metadata,
          description: asset.title,
          amount: {
            currency_code: 'USD',
            value: Number(asset.price || 0).toFixed(2)
          }
        }
      ],
      payment_source: {
        paypal: {
          experience_context: {
            user_action: 'PAY_NOW',
            return_url: `${origin}/marketplace?purchase_success=true&asset_id=${asset_id}`,
            cancel_url: `${origin}/marketplace?purchase_cancelled=true`
          }
        }
      }
    });

    return Response.json({ checkout_url: getApprovalLink(order), order_id: order.id });
  } catch (error) {
    console.error('marketplace-purchase-asset error:', error.message);
    return Response.json({ error: 'Purchase failed', details: error.message }, { status: 500 });
  }
  }));
