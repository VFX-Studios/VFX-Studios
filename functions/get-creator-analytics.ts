import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { time_range } = await req.json();

    // Calculate date range
    const now = new Date();
    const daysAgo = time_range === '7d' ? 7 : time_range === '30d' ? 30 : time_range === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Fetch user's video projects
    const projects = await base44.entities.VideoProject.filter({ 
      user_id: user.id,
      created_date: { $gte: startDate.toISOString() }
    }, '-created_date', 100);

    // Fetch REAL analytics from tracking events
    const analyticsEvents = await base44.entities.AnalyticsEvent.filter({ 
      user_id: user.id,
      created_date: { $gte: startDate.toISOString() }
    }, '-created_date', 1000);

    // Calculate real statistics from actual events
    const videoViews = analyticsEvents.filter(e => e.event_type === 'video_view').length;
    const watchTimeEvents = analyticsEvents.filter(e => e.event_type === 'video_watch_time');
    const totalWatchTime = watchTimeEvents.reduce((sum, e) => sum + (e.value || 0), 0);
    
    const socialImpressions = analyticsEvents.filter(e => e.event_type === 'social_impression').length;
    const socialClicks = analyticsEvents.filter(e => e.event_type === 'social_click').length;
    
    const thumbnailImpressions = analyticsEvents.filter(e => e.event_type === 'thumbnail_impression').length;
    const thumbnailClicks = analyticsEvents.filter(e => e.event_type === 'thumbnail_click').length;

    const stats = {
      totalViews: videoViews,
      watchTime: totalWatchTime,
      avgRetention: videoViews > 0 && projects.length > 0 
        ? totalWatchTime / (videoViews * (projects.reduce((sum, p) => sum + (p.duration_seconds || 0), 0) / projects.length))
        : 0,
      ctr: thumbnailImpressions > 0 ? thumbnailClicks / thumbnailImpressions : 0,
      socialEngagement: socialClicks,
      thumbnailTests: 0 // Real A/B tests would be tracked separately
    };

    // Build real video performance timeline from actual events
    const videoPerformance = [];
    for (let i = 0; i < daysAgo; i++) {
      const dayStart = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const dayEvents = analyticsEvents.filter(e => {
        const eventDate = new Date(e.created_date);
        return eventDate >= dayStart && eventDate < dayEnd;
      });

      const dayViews = dayEvents.filter(e => e.event_type === 'video_view').length;
      const dayWatchTime = dayEvents.filter(e => e.event_type === 'video_watch_time').reduce((sum, e) => sum + (e.value || 0), 0);
      const dayThumbnailImpressions = dayEvents.filter(e => e.event_type === 'thumbnail_impression').length;
      const dayThumbnailClicks = dayEvents.filter(e => e.event_type === 'thumbnail_click').length;

      videoPerformance.push({
        date: dayStart.toISOString().split('T')[0],
        views: dayViews,
        watchTime: dayWatchTime,
        retention: dayViews > 0 ? dayWatchTime / (dayViews * 300) : 0, // Assuming avg 5min videos
        ctr: dayThumbnailImpressions > 0 ? dayThumbnailClicks / dayThumbnailImpressions : 0
      });
    }

    // Calculate real metrics per project
    const projectsWithMetrics = projects.slice(0, 10).map(p => {
      const projectEvents = analyticsEvents.filter(e => e.entity_id === p.id);
      const projectViews = projectEvents.filter(e => e.event_type === 'video_view').length;
      const projectWatchTime = projectEvents.filter(e => e.event_type === 'video_watch_time').reduce((sum, e) => sum + (e.value || 0), 0);
      const projectThumbnailImpressions = projectEvents.filter(e => e.event_type === 'thumbnail_impression' && e.entity_id === p.id).length;
      const projectThumbnailClicks = projectEvents.filter(e => e.event_type === 'thumbnail_click' && e.entity_id === p.id).length;

      return {
        title: p.title,
        views: projectViews,
        retention: projectViews > 0 && p.duration_seconds ? projectWatchTime / (projectViews * p.duration_seconds) : 0,
        ctr: projectThumbnailImpressions > 0 ? projectThumbnailClicks / projectThumbnailImpressions : 0,
        duration: p.duration_seconds || 0
      };
    });

    // NOTE: Social copy performance would come from actual social media integrations
    // For now, returning empty array. To implement:
    // 1. Store generated social copy in database with tracking IDs
    // 2. Use social media APIs (YouTube Analytics, TikTok API, Instagram Graph API)
    // 3. Track UTM parameters on shared links
    // 4. Aggregate real impression/click data
    const socialCopyPerformance = [];

    // NOTE: Thumbnail A/B tests would require:
    // 1. Separate entity to track active A/B tests
    // 2. Random serving of variant A or B to users
    // 3. Tracking impressions and clicks per variant
    // 4. Statistical significance calculation
    // Returning empty array - this is a placeholder for future implementation
    const thumbnailABTests = [];

    // Generate real AI recommendations based on actual data patterns
    const recommendations = [];
    
    // Analyze upload timing patterns
    const uploadsByHour = {};
    projects.forEach(p => {
      const hour = new Date(p.created_date).getHours();
      uploadsByHour[hour] = (uploadsByHour[hour] || 0) + 1;
    });

    // Analyze retention patterns
    const avgProjectRetention = projectsWithMetrics.length > 0
      ? projectsWithMetrics.reduce((sum, p) => sum + p.retention, 0) / projectsWithMetrics.length
      : 0;

    if (avgProjectRetention < 0.4 && avgProjectRetention > 0) {
      recommendations.push({
        title: 'Improve Content Retention',
        description: `Your average retention is ${(avgProjectRetention * 100).toFixed(1)}%. Focus on stronger hooks in the first 30 seconds.`,
        impact: 'High Impact',
        estimatedImpact: 'Data-driven insight'
      });
    }

    // Analyze CTR
    const avgCTR = stats.ctr;
    if (avgCTR < 0.05 && thumbnailImpressions > 100) {
      recommendations.push({
        title: 'Optimize Thumbnail Design',
        description: `Your CTR is ${(avgCTR * 100).toFixed(2)}%. Industry average is 5-10%. Consider using bolder text and higher contrast.`,
        impact: 'High Impact',
        estimatedImpact: 'Data-driven insight'
      });
    }

    if (recommendations.length === 0 && projects.length > 0) {
      recommendations.push({
        title: 'Track More Data',
        description: 'Integrate analytics tracking to receive personalized recommendations based on your actual performance data.',
        impact: 'Foundation',
        estimatedImpact: 'Enable insights'
      });
    }

    return Response.json({
      success: true,
      stats,
      videoPerformance: projectsWithMetrics.length > 0 ? projectsWithMetrics.concat(videoPerformance.slice(0, 10)) : videoPerformance,
      socialCopyPerformance,
      thumbnailABTests,
      recommendations
    });

  } catch (error) {
    console.error('[Analytics] Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
