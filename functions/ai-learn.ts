import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { learningData } = await req.json();

    // Store learning data
    await base44.entities.AILearningData.create({
      user_id: user.id,
      ...learningData
    });

    // Analyze user preferences
    const recentLearning = await base44.entities.AILearningData.filter(
      { user_id: user.id },
      '-created_date',
      100
    );

    // Calculate preference patterns
    const stylePreferences = {};
    const colorPreferences = {};
    const emotionalArcPatterns = {};

    recentLearning.forEach(entry => {
      // Aggregate style preferences
      if (entry.style_tags) {
        entry.style_tags.forEach(tag => {
          stylePreferences[tag] = (stylePreferences[tag] || 0) + 1;
        });
      }

      // Track emotional arc patterns
      if (entry.emotional_arc) {
        if (!emotionalArcPatterns[entry.emotional_arc]) {
          emotionalArcPatterns[entry.emotional_arc] = [];
        }
        emotionalArcPatterns[entry.emotional_arc].push(entry.parameters);
      }

      // Track color preferences
      if (entry.parameters?.color_grading) {
        const hue = entry.parameters.color_grading.hue;
        colorPreferences[Math.floor(hue / 30)] = (colorPreferences[Math.floor(hue / 30)] || 0) + 1;
      }
    });

    // Generate personalized recommendations
    const topStyles = Object.entries(stylePreferences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([style]) => style);

    const preferredColorRange = Object.entries(colorPreferences)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    return Response.json({
      success: true,
      insights: {
        topStyles,
        preferredColorRange: preferredColorRange ? parseInt(preferredColorRange) * 30 : null,
        emotionalArcPatterns,
        totalDataPoints: recentLearning.length
      }
    });
  } catch (error) {
    console.error('AI Learning error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
