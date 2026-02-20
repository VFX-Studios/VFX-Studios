import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { time_range = '30d', format = 'csv' } = await req.json();

    // Calculate date range
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const days = daysMap[time_range] || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all data
    const [users, subscriptions, analyticsEvents, visualAssets, aiLearningData] = 
      await Promise.all([
        base44.asServiceRole.entities.User.list('-created_date', 1000),
        base44.asServiceRole.entities.Subscription.list('-created_date', 1000),
        base44.asServiceRole.entities.AnalyticsEvent.list('-created_date', 5000),
        base44.asServiceRole.entities.VisualAsset.list('-created_date', 1000),
        base44.asServiceRole.entities.AILearningData.list('-created_date', 2000),
      ]);

    const recentEvents = analyticsEvents.filter(e => new Date(e.created_date) >= new Date(startDate));

    if (format === 'csv') {
      // Generate CSV
      const csvRows = [];
      csvRows.push('Event Type,User ID,Created Date,Metadata,Revenue');
      
      recentEvents.forEach(event => {
        csvRows.push([
          event.event_type,
          event.user_id || '',
          event.created_date,
          JSON.stringify(event.metadata || {}),
          event.revenue_amount || 0,
        ].join(','));
      });

      return Response.json({
        success: true,
        format: 'csv',
        csv: csvRows.join('\n'),
      });
    } else {
      // Return JSON
      return Response.json({
        success: true,
        format: 'json',
        data: {
          time_range,
          export_date: new Date().toISOString(),
          analytics_events: recentEvents,
          summary: {
            total_users: users.length,
            total_subscriptions: subscriptions.length,
            total_events: recentEvents.length,
            total_visual_assets: visualAssets.length,
            total_ai_learning_data: aiLearningData.length,
          },
        },
      });
    }

  } catch (error) {
    console.error('Export Analytics Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
