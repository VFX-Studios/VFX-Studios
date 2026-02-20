import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { achievement_key, progress } = await req.json();

    // Check if already unlocked
    const existing = await base44.entities.UserAchievement.filter({
      user_id: user.id,
      achievement_key
    });

    if (existing.length > 0) {
      return Response.json({ 
        success: false, 
        message: 'Already unlocked' 
      });
    }

    // Get achievement details
    const achievements = await base44.entities.Achievement.filter({ achievement_key });
    const achievement = achievements[0];

    if (!achievement) {
      return Response.json({ error: 'Achievement not found' }, { status: 404 });
    }

    // Check if requirement met
    if (progress < achievement.requirement_value) {
      // Update progress
      const progressRecords = await base44.entities.UserAchievement.filter({
        user_id: user.id,
        achievement_key
      });

      if (progressRecords[0]) {
        await base44.entities.UserAchievement.update(progressRecords[0].id, {
          progress
        });
      } else {
        await base44.entities.UserAchievement.create({
          user_id: user.id,
          achievement_key,
          progress
        });
      }

      return Response.json({ 
        success: false, 
        message: 'Progress updated',
        progress,
        required: achievement.requirement_value
      });
    }

    // Unlock achievement
    await base44.entities.UserAchievement.create({
      user_id: user.id,
      achievement_key,
      unlocked_at: new Date().toISOString(),
      progress: achievement.requirement_value
    });

    // Award bonus credits
    if (achievement.reward_credits > 0) {
      const newCredits = (user.ai_credits_remaining || 0) + achievement.reward_credits;
      await base44.auth.updateMe({
        ai_credits_remaining: newCredits
      });
    }

    // Track analytics
    await base44.analytics.track({
      eventName: 'achievement_unlocked',
      properties: {
        achievement_key,
        rarity: achievement.rarity
      }
    });

    console.log('Achievement unlocked:', achievement_key);

    return Response.json({ 
      success: true,
      message: `Achievement unlocked: ${achievement.title}!`,
      credits_awarded: achievement.reward_credits
    });

  } catch (error) {
    console.error('unlock-achievement error:', error.message);
    return Response.json({ 
      error: 'Failed to unlock achievement',
      details: error.message 
    }, { status: 500 });
  }
  }));
