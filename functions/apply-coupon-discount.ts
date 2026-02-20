import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { coupon_code, original_price } = await req.json();

    // Get user's streak rewards
    const streaks = await base44.entities.StreakReward.filter({ user_id: user.id });
    if (!streaks[0]) {
      return Response.json({ error: 'No rewards available' }, { status: 404 });
    }

    const streak = streaks[0];
    
    // Check BOGO coupons
    const validCoupon = streak.bogo_coupons?.find(c => 
      c.code === coupon_code && new Date(c.expires) > new Date()
    );

    if (!validCoupon) {
      return Response.json({ error: 'Invalid or expired coupon' }, { status: 400 });
    }

    // Apply BOGO (buy one get one free = 50% off)
    const discountedPrice = original_price * 0.5;

    // Geographic discount
    let finalPrice = discountedPrice;
    if (streak.geographic_discount > 0) {
      finalPrice = finalPrice * (1 - streak.geographic_discount / 100);
    }

    // Monday discount (20% off)
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 1) {
      finalPrice = finalPrice * 0.8;
    }

    // Remove used coupon
    const remainingCoupons = streak.bogo_coupons.filter(c => c.code !== coupon_code);
    await base44.entities.StreakReward.update(streak.id, {
      bogo_coupons: remainingCoupons
    });

    return Response.json({
      original_price,
      discounted_price: Math.round(finalPrice * 100) / 100,
      savings: Math.round((original_price - finalPrice) * 100) / 100,
      discounts_applied: [
        validCoupon && 'BOGO (50% off)',
        streak.geographic_discount > 0 && `Geographic (${streak.geographic_discount}% off)`,
        dayOfWeek === 1 && 'Monday Special (20% off)'
      ].filter(Boolean),
      coupon_consumed: true
    });

  } catch (error) {
    console.error('apply-coupon error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
