import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all performances
    const performances = await base44.entities.LivePerformance.filter({ 
      host_user_id: user.id 
    }, '-created_date', 50);

    // Get all reactions across performances
    const allReactions = await base44.entities.PerformanceReaction.list('-created_date', 1000);
    
    // Get learning data for correlation
    const learningData = await base44.entities.AILearningData.filter(
      { user_id: user.id },
      '-created_date',
      500
    );

    // Analyze reaction trends by song section
    const reactionsBySongSection = {};
    const reactionsByStyle = {};
    const reactionTimeline = [];

    for (const performance of performances) {
      const perfReactions = allReactions.filter(r => r.performance_id === performance.id);
      
      perfReactions.forEach(reaction => {
        // Determine song section based on timestamp
        const section = getEmotionalArc(reaction.timestamp_seconds || 0, 180); // assume 3min avg
        
        if (!reactionsBySongSection[section]) {
          reactionsBySongSection[section] = {};
        }
        reactionsBySongSection[section][reaction.reaction_type] = 
          (reactionsBySongSection[section][reaction.reaction_type] || 0) + 1;

        reactionTimeline.push({
          type: reaction.reaction_type,
          timestamp: reaction.created_date,
          section,
          intensity: reaction.intensity || 5
        });
      });
    }

    // Correlate reactions with AI settings
    const aiSettingsCorrelation = {};
    learningData.forEach(entry => {
      if (entry.style_tags) {
        entry.style_tags.forEach(style => {
          if (!aiSettingsCorrelation[style]) {
            aiSettingsCorrelation[style] = {
              uses: 0,
              avgReactions: 0,
              reactions: {}
            };
          }
          aiSettingsCorrelation[style].uses++;
        });
      }
    });

    // Calculate most impactful AI Director suggestions
    const directorImpactAnalysis = {
      preset_changes: { suggested: 0, positive_reactions: 0, impact_score: 0 },
      asset_suggestions: { suggested: 0, positive_reactions: 0, impact_score: 0 },
      parameter_tweaks: { suggested: 0, positive_reactions: 0, impact_score: 0 },
      art_generation: { suggested: 0, positive_reactions: 0, impact_score: 0 }
    };

    // Top reaction moments
    const topReactionMoments = reactionTimeline
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 10);

    // Reaction heat map by time of day
    const reactionHeatMap = {};
    allReactions.forEach(r => {
      const hour = new Date(r.created_date).getHours();
      reactionHeatMap[hour] = (reactionHeatMap[hour] || 0) + 1;
    });

    // Most engaging styles based on reactions
    const styleEngagement = {};
    learningData.forEach(entry => {
      if (entry.style_tags && entry.effectiveness_score) {
        entry.style_tags.forEach(style => {
          if (!styleEngagement[style]) {
            styleEngagement[style] = { score: 0, count: 0 };
          }
          styleEngagement[style].score += entry.effectiveness_score;
          styleEngagement[style].count++;
        });
      }
    });

    const topEngagingStyles = Object.entries(styleEngagement)
      .map(([style, data]) => ({
        style,
        avgScore: data.count > 0 ? data.score / data.count : 0,
        uses: data.count
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 8);

    return Response.json({
      success: true,
      analytics: {
        totalPerformances: performances.length,
        totalReactions: allReactions.length,
        reactionsBySongSection,
        reactionsByStyle,
        topReactionMoments,
        reactionHeatMap,
        directorImpactAnalysis,
        topEngagingStyles,
        avgReactionsPerPerformance: performances.length > 0 ? 
          allReactions.length / performances.length : 0
      }
    });
  } catch (error) {
    console.error('Enhanced analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getEmotionalArc(currentTime, duration) {
  if (!duration) return 'intro';
  const progress = currentTime / duration;
  if (progress < 0.15) return 'intro';
  if (progress < 0.4) return 'building';
  if (progress < 0.7) return 'peak';
  if (progress < 0.9) return 'breakdown';
  return 'outro';
}

