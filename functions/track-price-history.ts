import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch all active marketplace assets
    const assets = await base44.asServiceRole.entities.MarketplaceAsset.filter({
      status: 'approved'
    });

    const snapshots = [];

    for (const asset of assets) {
      // Calculate sales velocity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentPurchases = await base44.asServiceRole.entities.MarketplacePurchase.filter({
        marketplace_asset_id: asset.id
      });

      const recentSales = recentPurchases.filter(
        p => new Date(p.created_date) >= sevenDaysAgo
      );

      const salesVelocity = recentSales.length / 7; // sales per day

      // Calculate market demand index (0-100)
      const views = asset.view_count || 0;
      const purchases = asset.purchase_count || 0;
      const rating = asset.rating || 3;
      
      const demandIndex = Math.min(100, 
        (purchases * 10) + 
        (views * 0.1) + 
        (rating * 5) +
        (salesVelocity * 20)
      );

      // Get category average price
      const categoryAssets = await base44.asServiceRole.entities.MarketplaceAsset.filter({
        category: asset.category,
        status: 'approved'
      });

      const categoryAvgPrice = categoryAssets.length > 0
        ? categoryAssets.reduce((sum, a) => sum + a.price, 0) / categoryAssets.length
        : asset.price;

      // Create price history snapshot
      const snapshot = await base44.asServiceRole.entities.AssetPriceHistory.create({
        marketplace_asset_id: asset.id,
        price: asset.price,
        sales_velocity: salesVelocity,
        market_demand_index: demandIndex,
        category_average_price: categoryAvgPrice,
        price_change_reason: 'automated_tracking',
        recorded_at: new Date().toISOString()
      });

      snapshots.push(snapshot);
    }

    return Response.json({
      success: true,
      snapshots_created: snapshots.length,
      message: `Tracked price history for ${snapshots.length} assets`
    });

  } catch (error) {
    console.error('track-price-history error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
