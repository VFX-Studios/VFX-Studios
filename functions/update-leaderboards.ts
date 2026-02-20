import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    
    // This should run weekly via automation
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split('T')[0];

    console.log('Updating leaderboards for week:', weekStartStr);

    // Calculate Most Liked
    const creationFeedback = await base44.asServiceRole.entities.CreationFeedback.list();
    const likeCounts = {};
    
    creationFeedback.forEach(feedback => {
      if (feedback.reaction === 'like' && feedback.viewer_user_id) {
        likeCounts[feedback.viewer_user_id] = (likeCounts[feedback.viewer_user_id] || 0) + 1;
      }
    });

    // Create/update leaderboard entries
    const sortedByLikes = Object.entries(likeCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    
    for (let i = 0; i < sortedByLikes.length; i++) {
      const [userId, score] = sortedByLikes[i];
      const prize = i === 0 ? 100 : i === 1 ? 50 : i === 2 ? 25 : 0;
      
      await base44.asServiceRole.entities.Leaderboard.create({
        user_id: userId,
        leaderboard_type: 'most_liked',
        score,
        rank: i + 1,
        week_start: weekStartStr,
        prize_awarded: prize
      });

      // Award prizes
      if (prize > 0) {
        const users = await base44.asServiceRole.entities.User.filter({ id: userId });
        if (users[0]) {
          await base44.asServiceRole.entities.User.update(userId, {
            ai_credits_remaining: (users[0].ai_credits_remaining || 0) + prize
          });
        }
      }
    }

    // Calculate Top Earning
    const purchases = await base44.asServiceRole.entities.MarketplacePurchase.list();
    const earnings = {};
    
    purchases.forEach(purchase => {
      earnings[purchase.seller_user_id] = (earnings[purchase.seller_user_id] || 0) + purchase.seller_payout;
    });

    const sortedByEarnings = Object.entries(earnings).sort((a, b) => b[1] - a[1]).slice(0, 10);
    
    for (let i = 0; i < sortedByEarnings.length; i++) {
      const [userId, score] = sortedByEarnings[i];
      const prize = i === 0 ? 100 : i === 1 ? 50 : i === 2 ? 25 : 0;
      
      await base44.asServiceRole.entities.Leaderboard.create({
        user_id: userId,
        leaderboard_type: 'top_earning',
        score,
        rank: i + 1,
        week_start: weekStartStr,
        prize_awarded: prize
      });
    }

    console.log('Leaderboards updated successfully');

    return Response.json({ 
      success: true,
      most_liked_entries: sortedByLikes.length,
      top_earning_entries: sortedByEarnings.length
    });

  } catch (error) {
    console.error('update-leaderboards error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
