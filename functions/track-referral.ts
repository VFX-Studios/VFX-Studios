import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const { referral_code, new_user_id } = await req.json();

    if (!referral_code || !new_user_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find referrer
    const referrals = await base44.asServiceRole.entities.ReferralProgram.filter({ 
      referral_code 
    });

    if (referrals.length === 0) {
      return Response.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    const referral = referrals[0];

    // Update referral with referred user
    await base44.asServiceRole.entities.ReferralProgram.update(referral.id, {
      referred_user_id: new_user_id,
      status: 'completed'
    });

    // Award credits to referrer (20 credits special promotion)
    const referrerUsers = await base44.asServiceRole.entities.User.filter({ 
      id: referral.referrer_user_id 
    });
    
    if (referrerUsers[0]) {
      const referrer = referrerUsers[0];
      const newCredits = (referrer.ai_credits_remaining || 0) + 20; // SPECIAL: 20 credits for first 6 months
      
      await base44.asServiceRole.entities.User.update(referral.referrer_user_id, {
        ai_credits_remaining: newCredits
      });

      // Check for milestone (5+ referrals)
      const totalReferrals = await base44.asServiceRole.entities.ReferralProgram.filter({
        referrer_user_id: referral.referrer_user_id,
        status: 'completed'
      });

      if (totalReferrals.length >= 5 && !referral.milestone_reached) {
        await base44.asServiceRole.entities.ReferralProgram.update(referral.id, {
          milestone_reached: true
        });
        // Unlock permanent 50% bonus achievement
        await base44.asServiceRole.entities.UserAchievement.create({
          user_id: referral.referrer_user_id,
          achievement_key: 'referral_master'
        });
      }
    }

    // Award bonus credits to new user
    const newUsers = await base44.asServiceRole.entities.User.filter({ id: new_user_id });
    if (newUsers[0]) {
      const newUser = newUsers[0];
      await base44.asServiceRole.entities.User.update(new_user_id, {
        ai_credits_remaining: (newUser.ai_credits_remaining || 0) + 5
      });
    }

    // Track analytics
    await base44.asServiceRole.entities.AnalyticsEvent.create({
      event_type: 'referral_completed',
      event_data: {
        referrer_id: referral.referrer_user_id,
        referred_id: new_user_id,
        timestamp: new Date().toISOString()
      }
    });

    console.log('Referral tracked:', referral_code);

    return Response.json({ 
      success: true,
      message: 'Referral bonus applied!' 
    });

  } catch (error) {
    console.error('track-referral error:', error.message);
    return Response.json({ 
      error: 'Failed to track referral',
      details: error.message 
    }, { status: 500 });
  }
  }));
