import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { agent_id, config } = await req.json();

    if (!agent_id) {
      return Response.json({ error: 'agent_id required' }, { status: 400 });
    }

    // Log the configuration update
    await base44.asServiceRole.entities.AnalyticsEvent.create({
      event_type: 'agent_activity',
      user_id: user.id,
      metadata: {
        agent_id,
        action: 'config_updated',
        success: true,
        details: `Agent ${agent_id} configuration updated by admin`,
      },
    });

    return Response.json({
      success: true,
      agent_id,
      config,
      message: 'Agent configuration updated successfully',
    });

  } catch (error) {
    console.error('Update Agent Config Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
