import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const { stream_id, time_window_seconds } = await req.json();

    // Fetch recent reactions (last 30 seconds by default)
    const windowStart = Date.now() - (time_window_seconds || 30) * 1000;
    const reactions = await base44.asServiceRole.entities.AudienceSentiment.filter({
      live_stream_session_id: stream_id
    });

    // Filter by time window
    const recentReactions = reactions.filter(r => {
      const reactionTime = new Date(r.created_date).getTime();
      return reactionTime >= windowStart;
    });

    // Aggregate sentiment
    const sentimentCounts = {
      fire: recentReactions.filter(r => r.reaction_type === 'fire').length,
      heart: recentReactions.filter(r => r.reaction_type === 'heart').length,
      laugh: recentReactions.filter(r => r.reaction_type === 'laugh').length,
      surprised: recentReactions.filter(r => r.reaction_type === 'surprised').length,
      sad: recentReactions.filter(r => r.reaction_type === 'sad').length
    };

    const totalReactions = Object.values(sentimentCounts).reduce((a, b) => a + b, 0);

    // Calculate overall sentiment
    const positiveReactions = sentimentCounts.fire + sentimentCounts.heart + sentimentCounts.laugh;
    const negativeReactions = sentimentCounts.sad;
    
    let overallSentiment = 'neutral';
    if (positiveReactions > totalReactions * 0.6) {
      overallSentiment = sentimentCounts.fire > totalReactions * 0.3 ? 'excited' : 'positive';
    } else if (negativeReactions > totalReactions * 0.3) {
      overallSentiment = 'negative';
    }

    // AI Co-Pilot Suggestions based on sentiment
    let suggestions = [];
    
    if (overallSentiment === 'excited') {
      suggestions = [
        'Audience is hyped! Increase visual intensity +20%',
        'Add more particle effects',
        'Transition to high-energy preset'
      ];
    } else if (overallSentiment === 'negative') {
      suggestions = [
        'Energy dropping. Consider changing visual style',
        'Switch to next song or increase tempo',
        'Add color variation to re-engage audience'
      ];
    } else if (overallSentiment === 'positive') {
      suggestions = [
        'Maintain current style',
        'Subtle color palette shift',
        'Prepare for energy buildup'
      ];
    }

    return Response.json({
      sentiment: overallSentiment,
      reaction_breakdown: sentimentCounts,
      total_reactions: totalReactions,
      engagement_score: totalReactions > 0 ? (positiveReactions / totalReactions) * 10 : 5,
      ai_suggestions: suggestions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('analyze-stream-sentiment error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
