import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      current_page, 
      current_action, 
      user_role,
      completed_steps 
    } = await req.json();

    // Get user's tutorial progress
    const progressList = await base44.entities.TutorialProgress.filter({ user_id: user.id });
    const progress = progressList[0] || { 
      completed_steps: [], 
      skill_level: 'beginner',
      user_role: user_role || 'general'
    };

    // AI determines next step based on context
    const prompt = `You are an interactive tutorial AI for VFX Studios, a VJ visual effects platform.

User context:
- Current page: ${current_page}
- Current action: ${current_action || 'browsing'}
- User role: ${progress.user_role}
- Skill level: ${progress.skill_level}
- Completed steps: ${progress.completed_steps.join(', ') || 'none'}

Based on this context, provide the next tutorial step. Consider:
1. What the user is trying to do right now
2. What they've already learned
3. Their role and skill level
4. Logical progression through platform features

Return a tutorial step with:
- step_id: unique identifier
- title: brief action title
- instruction: clear, conversational guidance
- target_element: CSS selector or page element to highlight
- action_required: what user needs to do
- tips: 2-3 helpful tips
- next_steps: array of possible next steps

Make it conversational and encouraging. For beginners, be more detailed. For advanced users, be concise.`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          step_id: { type: "string" },
          title: { type: "string" },
          instruction: { type: "string" },
          target_element: { type: "string" },
          action_required: { type: "string" },
          tips: {
            type: "array",
            items: { type: "string" }
          },
          next_steps: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({
      success: true,
      tutorial_step: aiResponse,
      progress: {
        completed: progress.completed_steps.length,
        total_available: 30,
        skill_level: progress.skill_level
      }
    });
  } catch (error) {
    console.error('Tutorial guide error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
