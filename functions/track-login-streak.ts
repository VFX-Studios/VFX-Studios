import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get or create streak record
    let streaks = await base44.entities.StreakReward.filter({ user_id: user.id });
    let streak = streaks[0];

    if (!streak) {
      // Detect geographic location for PPP pricing
      const geoData = await fetch('https://ipapi.co/json/').then(r => r.json()).catch(() => ({}));
      const discountCountries = ['IN', 'BR', 'MX', 'PH', 'ID'];
      const geoDiscount = discountCountries.includes(geoData.country_code) ? 40 : 0;

      streak = await base44.entities.StreakReward.create({
        user_id: user.id,
        current_streak: 1,
        longest_streak: 1,
        last_login_date: today,
        geographic_discount: geoDiscount
      });

      return Response.json({ 
        streak: 1, 
        reward: null,
        geographic_discount: geoDiscount 
      });
    }

    // Check if already logged in today
    if (streak.last_login_date === today) {
      return Response.json({ 
        streak: streak.current_streak,
        reward: null,
        message: 'Already logged in today'
      });
    }

    // Calculate streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;
    let reward = null;

    if (streak.last_login_date === yesterdayStr) {
      // Consecutive day
      newStreak = streak.current_streak + 1;

      // Check for 3-day milestone
      if (newStreak % 3 === 0) {
        const coupon = {
          code: `BOGO${Date.now()}`,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          discount: 'bogo'
        };

        const updatedCoupons = [...(streak.bogo_coupons || []), coupon];

        await base44.entities.StreakReward.update(streak.id, {
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak.longest_streak),
          last_login_date: today,
          three_day_rewards_earned: (streak.three_day_rewards_earned || 0) + 1,
          bogo_coupons: updatedCoupons
        });

        reward = {
          type: 'bogo_coupon',
          coupon,
          message: '🎉 3-day streak! BOGO credit purchase coupon unlocked!'
        };
      } else {
        await base44.entities.StreakReward.update(streak.id, {
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak.longest_streak),
          last_login_date: today
        });
      }
    } else {
      // Streak broken
      await base44.entities.StreakReward.update(streak.id, {
        current_streak: 1,
        last_login_date: today
      });
    }

    // Time-based discount (Monday = 20% off)
    const dayOfWeek = new Date().getDay();
    const mondayDiscount = dayOfWeek === 1 ? 20 : 0;

    return Response.json({
      streak: newStreak,
      reward,
      geographic_discount: streak.geographic_discount || 0,
      monday_discount: mondayDiscount,
      longest_streak: Math.max(newStreak, streak.longest_streak)
    });

  } catch (error) {
    console.error('track-login-streak error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
