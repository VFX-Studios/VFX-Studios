import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all learning data for the user
    const learningData = await base44.entities.AILearningData.filter(
      { user_id: user.id },
      '-created_date',
      500
    );

    // Fetch generated art with ratings
    const generatedArt = await base44.entities.GeneratedArt.filter(
      { user_id: user.id },
      '-created_date',
      200
    );

    // Analyze top-performing styles
    const stylePerformance = {};
    learningData.forEach(entry => {
      if (entry.style_tags) {
        entry.style_tags.forEach(style => {
          if (!stylePerformance[style]) {
            stylePerformance[style] = { 
              count: 0, 
              totalScore: 0, 
              acceptances: 0,
              rejections: 0
            };
          }
          stylePerformance[style].count++;
          stylePerformance[style].totalScore += entry.effectiveness_score || 0;
          
          if (entry.learning_type === 'accepted_suggestion') {
            stylePerformance[style].acceptances++;
          } else if (entry.learning_type === 'rejected_suggestion') {
            stylePerformance[style].rejections++;
          }
        });
      }
    });

    // Calculate average scores
    const topStyles = Object.entries(stylePerformance)
      .map(([style, data]) => ({
        style,
        avgScore: data.count > 0 ? data.totalScore / data.count : 0,
        usageCount: data.count,
        acceptanceRate: data.count > 0 ? (data.acceptances / data.count) * 100 : 0
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10);

    // Analyze emotional arc preferences
    const emotionalArcStats = {};
    learningData.forEach(entry => {
      if (entry.emotional_arc) {
        if (!emotionalArcStats[entry.emotional_arc]) {
          emotionalArcStats[entry.emotional_arc] = {
            count: 0,
            avgEffectiveness: 0,
            totalScore: 0
          };
        }
        emotionalArcStats[entry.emotional_arc].count++;
        emotionalArcStats[entry.emotional_arc].totalScore += entry.effectiveness_score || 0;
      }
    });

    Object.keys(emotionalArcStats).forEach(arc => {
      const stat = emotionalArcStats[arc];
      stat.avgEffectiveness = stat.count > 0 ? stat.totalScore / stat.count : 0;
    });

    // Analyze parameter trends
    const parameterTrends = {
      effects: { blur: [], glow: [], glitch: [], distortion: [] },
      color: { saturation: [], hue: [], brightness: [] }
    };

    learningData.forEach(entry => {
      if (entry.parameters) {
        if (entry.parameters.effects) {
          Object.keys(parameterTrends.effects).forEach(effect => {
            if (entry.parameters.effects[effect] !== undefined) {
              parameterTrends.effects[effect].push(entry.parameters.effects[effect]);
            }
          });
        }
        if (entry.parameters.color_grading) {
          Object.keys(parameterTrends.color).forEach(param => {
            if (entry.parameters.color_grading[param] !== undefined) {
              parameterTrends.color[param].push(entry.parameters.color_grading[param]);
            }
          });
        }
      }
    });

    // Calculate averages
    const avgParameters = {
      effects: {},
      color: {}
    };

    Object.keys(parameterTrends.effects).forEach(effect => {
      const values = parameterTrends.effects[effect];
      avgParameters.effects[effect] = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;
    });

    Object.keys(parameterTrends.color).forEach(param => {
      const values = parameterTrends.color[param];
      avgParameters.color[param] = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;
    });

    // Top-rated generated art
    const topRatedArt = generatedArt
      .filter(art => art.user_rating && art.user_rating >= 4)
      .sort((a, b) => (b.user_rating || 0) - (a.user_rating || 0))
      .slice(0, 10)
      .map(art => ({
        prompt: art.prompt,
        style: art.style,
        rating: art.user_rating,
        usedInPerformance: art.used_in_performance,
        imageUrl: art.generated_image_url
      }));

    return Response.json({
      success: true,
      analytics: {
        topStyles,
        emotionalArcStats,
        avgParameters,
        topRatedArt,
        totalDataPoints: learningData.length,
        totalGenerations: generatedArt.length,
        avgArtRating: generatedArt.length > 0
          ? generatedArt.reduce((sum, art) => sum + (art.user_rating || 0), 0) / generatedArt.length
          : 0
      }
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
