import { getClient } from './_client.ts';

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, performanceId, state, songId, currentTime, title } = await req.json();

    if (action === 'start') {
      // Start new broadcast
      const streamKey = crypto.randomUUID();
      const performance = await base44.entities.LivePerformance.create({
        host_user_id: user.id,
        title: title || 'Live VJ Performance',
        stream_key: streamKey,
        is_live: true,
        current_state: state,
        current_song_id: songId,
        current_time: currentTime || 0,
        started_at: new Date().toISOString()
      });

      return Response.json({ 
        success: true, 
        performanceId: performance.id,
        streamKey 
      });
    }

    if (action === 'update') {
      // Update broadcast state
      await base44.entities.LivePerformance.update(performanceId, {
        current_state: state,
        current_song_id: songId,
        current_time: currentTime
      });

      return Response.json({ success: true });
    }

    if (action === 'end') {
      // End broadcast and create recording
      const performance = await base44.asServiceRole.entities.LivePerformance.filter({ 
        id: performanceId 
      });

      if (performance.length === 0) {
        return Response.json({ error: 'Performance not found' }, { status: 404 });
      }

      const perf = performance[0];
      await base44.entities.LivePerformance.update(performanceId, {
        is_live: false,
        ended_at: new Date().toISOString()
      });

      // Create recording entry
      const startTime = new Date(perf.started_at).getTime();
      const endTime = Date.now();
      const duration = Math.floor((endTime - startTime) / 1000);

      await base44.entities.PerformanceRecording.create({
        performance_id: performanceId,
        user_id: user.id,
        title: perf.title,
        duration_seconds: duration,
        state_snapshots: [], // Would be populated with recorded states
        is_public: perf.is_public
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Broadcast error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
