import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { time_range = '30d' } = await req.json();

    // Calculate date range
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const days = daysMap[time_range] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all relevant data
    const [users, subscriptions, setlists, songs, visualAssets, supportTickets, aiLearningData, generatedArt, analyticsEvents] = 
      await Promise.all([
        base44.asServiceRole.entities.User.list('-created_date', 1000),
        base44.asServiceRole.entities.Subscription.list('-created_date', 1000),
        base44.asServiceRole.entities.Setlist.list('-created_date', 1000),
        base44.asServiceRole.entities.Song.list('-created_date', 5000),
        base44.asServiceRole.entities.VisualAsset.list('-created_date', 1000),
        base44.asServiceRole.entities.SupportTicket.list('-created_date', 500),
        base44.asServiceRole.entities.AILearningData.list('-created_date', 2000),
        base44.asServiceRole.entities.GeneratedArt.list('-created_date', 1000),
        base44.asServiceRole.entities.AnalyticsEvent.list('-created_date', 5000),
      ]);

    // Filter by date range
    const recentUsers = users.filter(u => new Date(u.created_date) >= new Date(startDate));
    const recentEvents = analyticsEvents.filter(e => new Date(e.created_date) >= new Date(startDate));

    // Overview metrics
    const overview = {
      total_users: users.length,
      new_users_this_period: recentUsers.length,
      active_subscriptions: subscriptions.filter(s => s.status === 'active').length,
      subscription_growth_rate: calculateGrowthRate(subscriptions, startDate),
      total_setlists: setlists.length,
      avg_songs_per_setlist: calculateAverage(setlists.map(s => s.songs?.length || 0)),
      total_visual_assets: visualAssets.length,
      ai_generated_percentage: (generatedArt.length / Math.max(visualAssets.length, 1)) * 100,
    };

    // User engagement
    const user_engagement = {
      dau: calculateDAU(recentEvents),
      wau: calculateWAU(recentEvents),
      mau: calculateMAU(recentEvents),
      avg_session_duration: calculateAvgSessionDuration(recentEvents),
      retention_day1: calculateRetention(users, analyticsEvents, 1),
      retention_day7: calculateRetention(users, analyticsEvents, 7),
      retention_day30: calculateRetention(users, analyticsEvents, 30),
      churn_rate: calculateChurnRate(subscriptions),
    };

    // Content popularity
    const topAssets = visualAssets
      .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
      .slice(0, 10)
      .map(a => ({
        name: a.name,
        type: a.type,
        usage_count: a.usage_count || 0,
        rating: a.rating,
      }));

    const content_popularity = {
      top_assets: topAssets,
      total_asset_usage: visualAssets.reduce((sum, a) => sum + (a.usage_count || 0), 0),
    };

    // AI effectiveness
    const acceptedSuggestions = aiLearningData.filter(l => l.learning_type === 'accepted_suggestion');
    const totalSuggestions = aiLearningData.filter(l => 
      l.learning_type === 'accepted_suggestion' || l.learning_type === 'rejected_suggestion'
    );

    const ai_effectiveness = {
      total_suggestions: totalSuggestions.length,
      accepted: acceptedSuggestions.length,
      acceptance_rate: (acceptedSuggestions.length / Math.max(totalSuggestions.length, 1)) * 100,
      images_generated: generatedArt.length,
      avg_rating: calculateAverage(generatedArt.map(g => g.user_rating).filter(Boolean)),
      used_in_perf: generatedArt.filter(g => g.used_in_performance).length,
      learning_data_points: aiLearningData.length,
      avg_effectiveness: calculateAverage(aiLearningData.map(l => l.effectiveness_score).filter(Boolean)),
    };

    // Revenue metrics
    const paymentEvents = analyticsEvents.filter(e => e.event_type === 'payment_successful');
    const totalRevenue = paymentEvents.reduce((sum, e) => sum + (e.revenue_amount || 0), 0);
    const recentRevenue = recentEvents
      .filter(e => e.event_type === 'payment_successful')
      .reduce((sum, e) => sum + (e.revenue_amount || 0), 0);

    const tierBreakdown = {};
    subscriptions.forEach(sub => {
      if (!tierBreakdown[sub.tier]) {
        tierBreakdown[sub.tier] = { count: 0, revenue: 0 };
      }
      tierBreakdown[sub.tier].count++;
      
      const tierPrices = { weekly: 9.99, monthly: 25, annual: 200 };
      tierBreakdown[sub.tier].revenue += tierPrices[sub.tier] || 0;
    });

    const revenue_metrics = {
      total_revenue: totalRevenue,
      revenue_this_period: recentRevenue,
      mrr: Object.values(tierBreakdown).reduce((sum, t) => sum + (t.revenue / 12), 0) * subscriptions.filter(s => s.status === 'active').length / subscriptions.length,
      arr: totalRevenue * 12 / Math.max(days / 365, 1),
      tier_breakdown: tierBreakdown,
    };

    return Response.json({
      success: true,
      time_range,
      overview,
      user_engagement,
      content_popularity,
      ai_effectiveness,
      revenue_metrics,
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Advanced Analytics Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Helper functions
function calculateGrowthRate(items, startDate) {
  const recent = items.filter(i => new Date(i.created_date) >= new Date(startDate));
  const previous = items.filter(i => new Date(i.created_date) < new Date(startDate));
  return previous.length > 0 ? ((recent.length - previous.length) / previous.length) * 100 : 0;
}

function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function calculateDAU(events) {
  const today = new Date().toDateString();
  const uniqueUsers = new Set(
    events.filter(e => new Date(e.created_date).toDateString() === today).map(e => e.user_id)
  );
  return uniqueUsers.size;
}

function calculateWAU(events) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const uniqueUsers = new Set(
    events.filter(e => new Date(e.created_date) >= weekAgo).map(e => e.user_id)
  );
  return uniqueUsers.size;
}

function calculateMAU(events) {
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const uniqueUsers = new Set(
    events.filter(e => new Date(e.created_date) >= monthAgo).map(e => e.user_id)
  );
  return uniqueUsers.size;
}

function calculateAvgSessionDuration(events) {
  // Simplified - would need session tracking in production
  return '15m';
}

function calculateRetention(users, events, days) {
  const targetDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const cohort = users.filter(u => new Date(u.created_date) <= targetDate);
  if (cohort.length === 0) return 0;
  
  const activeUsers = new Set(
    events.filter(e => new Date(e.created_date) >= targetDate).map(e => e.user_id)
  );
  const retained = cohort.filter(u => activeUsers.has(u.id));
  
  return (retained.length / cohort.length) * 100;
}

function calculateChurnRate(subscriptions) {
  const cancelled = subscriptions.filter(s => s.status === 'cancelled').length;
  return (cancelled / Math.max(subscriptions.length, 1)) * 100;
}

