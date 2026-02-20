import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { agent_id, enabled } = await req.json();

    if (!agent_id) {
      return Response.json({ error: 'agent_id required' }, { status: 400 });
    }

    // Log the toggle action
    await base44.asServiceRole.entities.AnalyticsEvent.create({
      event_type: 'agent_activity',
      user_id: user.id,
      metadata: {
        agent_id,
        action: enabled ? 'enabled' : 'disabled',
        success: true,
        details: `Agent ${agent_id} ${enabled ? 'enabled' : 'disabled'} by admin`,
      },
    });

    return Response.json({
      success: true,
      agent_id,
      enabled,
      message: `Agent ${enabled ? 'enabled' : 'disabled'} successfully`,
    });

  } catch (error) {
    console.error('Toggle Agent Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
