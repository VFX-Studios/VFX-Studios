import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      suggestion_id, 
      feedback, 
      song_id, 
      suggestion_data, 
      context 
    } = await req.json();

    if (!suggestion_id || !feedback || !song_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isAccepted = feedback === 'accepted';
    const effectivenessScore = isAccepted ? 8 : 3; // Estimate effectiveness

    // Store learning data
    const learningEntry = await base44.entities.AILearningData.create({
      user_id: user.id,
      learning_type: isAccepted ? 'accepted_suggestion' : 'rejected_suggestion',
      song_id: song_id,
      music_context: context,
      parameters: suggestion_data?.primary_suggestion?.parameters || {},
      emotional_arc: suggestion_data?.context?.song_section,
      style_tags: [
        feedback,
        suggestion_data?.urgency || 'medium',
        suggestion_data?.primary_suggestion?.action_type || 'vfx_adjustment'
      ],
      effectiveness_score: effectivenessScore,
    });

    // Log to Notion for training analysis
    try {
      await base44.functions.invoke('log-to-notion', {
        entry_type: 'ai_feedback',
        data: {
          suggestion_id,
          feedback,
          user_id: user.id,
          song_title: suggestion_data?.song_title || 'Unknown',
          urgency: suggestion_data?.urgency,
          description: suggestion_data?.primary_suggestion?.description,
          context: {
            elapsed_time: context?.elapsed_time,
            energy: context?.energy,
            viewer_reactions: context?.viewer_reactions,
          },
          timestamp: new Date().toISOString(),
        }
      });
    } catch (notionError) {
      console.error('Notion logging failed (non-critical):', notionError);
      // Don't fail the request if Notion logging fails
    }

    // Track analytics
    await base44.entities.AnalyticsEvent.create({
      event_type: 'ai_suggestion_feedback',
      user_id: user.id,
      metadata: {
        suggestion_id,
        feedback,
        song_id,
        urgency: suggestion_data?.urgency,
        action_type: suggestion_data?.primary_suggestion?.action_type,
        effectiveness_score: effectivenessScore,
      }
    });

    return Response.json({
      success: true,
      learning_entry_id: learningEntry.id,
      message: `Feedback recorded and logged to Notion for AI training`,
      effectiveness_score: effectivenessScore,
    });

  } catch (error) {
    console.error('AI Feedback Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
