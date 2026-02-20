import { getClient } from './_client.ts';

/**
 * Conversion Funnel Step Tracking
 * Monitors user journey through multi-step processes
 */
Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    
    const { 
      session_id, 
      funnel_type, 
      step_name, 
      completed 
    } = await req.json();

    if (!session_id || !funnel_type || !step_name) {
      return Response.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Get or create funnel record
    let funnels = await base44.entities.ConversionFunnel.filter({
      session_id: session_id
    });

    let funnel = funnels[0];
    const timestamp = new Date().toISOString();

    if (!funnel) {
      // Create new funnel tracking
      let user = null;
      try {
        user = await base44.auth.me();
      } catch {
        // Anonymous user
      }

      funnel = await base44.entities.ConversionFunnel.create({
        user_id: user?.id || 'anonymous',
        session_id: session_id,
        funnel_type: funnel_type,
        current_step: step_name,
        steps_completed: [],
        converted: false,
        device_type: detectDeviceType(req)
      });
    }

    // Calculate time spent on this step
    const lastStep = funnel.steps_completed[funnel.steps_completed.length - 1];
    const timeSpent = lastStep 
      ? (new Date(timestamp) - new Date(lastStep.completed_at)) / 1000
      : 0;

    // Update funnel progress
    const updatedSteps = [...(funnel.steps_completed || []), {
      step_name: step_name,
      completed_at: timestamp,
      time_spent_seconds: timeSpent
    }];

    const updateData = {
      steps_completed: updatedSteps,
      current_step: step_name,
      converted: completed || false
    };

    if (completed) {
      // Calculate total funnel time
      const totalTime = updatedSteps.reduce((sum, s) => sum + (s.time_spent_seconds || 0), 0);
      updateData.total_time_seconds = totalTime;
    }

    if (!completed && funnel.current_step !== step_name) {
      // User dropped off
      updateData.drop_off_step = funnel.current_step;
    }

    const updatedFunnel = await base44.entities.ConversionFunnel.update(funnel.id, updateData);

    return Response.json({
      success: true,
      funnel: updatedFunnel,
      progress: {
        steps_completed: updatedSteps.length,
        current_step: step_name,
        time_in_funnel: updateData.total_time_seconds || 0
      }
    });

  } catch (error) {
    console.error('[Funnel Tracking] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function detectDeviceType(req) {
  const userAgent = req.headers.get('user-agent') || '';
  
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

