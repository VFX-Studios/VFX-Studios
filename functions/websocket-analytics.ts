import { getClient } from './_client.ts';

/**
 * WebSocket-based real-time analytics streaming
 * Implements server-sent events for live dashboard updates
 */

const connections = new Map();

Deno.serve(withSecurity(async (req) => {
  const base44 = getClient(req);
  
  try {
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle WebSocket upgrade
    if (req.headers.get('upgrade') === 'websocket') {
      const { socket, response } = Deno.upgradeWebSocket(req);
      
      socket.onopen = () => {
        connections.set(user.id, socket);
        console.log(`[WebSocket] Connected: ${user.id}`);
        
        // Send initial state
        socket.send(JSON.stringify({
          type: 'connected',
          timestamp: new Date().toISOString()
        }));
        
        // Start streaming analytics
        startAnalyticsStream(user.id, socket, base44);
      };

      socket.onclose = () => {
        connections.delete(user.id);
        console.log(`[WebSocket] Disconnected: ${user.id}`);
      };

      socket.onerror = (error) => {
        console.error(`[WebSocket] Error for ${user.id}:`, error);
        connections.delete(user.id);
      };

      return response;
    }

    // REST endpoint for broadcasting updates
    if (req.method === 'POST') {
      const { user_id, event_data } = await req.json();
      
      const socket = connections.get(user_id);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
          type: 'analytics_update',
          data: event_data,
          timestamp: new Date().toISOString()
        }));
      }

      return Response.json({ success: true });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });

  } catch (error) {
    console.error('[WebSocket] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Stream real-time analytics data to connected client
 */
async function startAnalyticsStream(userId, socket, base44) {
  const interval = setInterval(async () => {
    if (socket.readyState !== WebSocket.OPEN) {
      clearInterval(interval);
      return;
    }

    try {
      // Fetch latest analytics in real-time
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      const recentEvents = await base44.entities.AnalyticsEvent.filter({
        user_id: userId,
        created_date: { $gte: fiveMinutesAgo.toISOString() }
      }, '-created_date', 100);

      const metrics = {
        views: recentEvents.filter(e => e.event_type === 'video_view').length,
        watchTime: recentEvents
          .filter(e => e.event_type === 'video_watch_time')
          .reduce((sum, e) => sum + (e.value || 0), 0),
        clicks: recentEvents.filter(e => e.event_type === 'thumbnail_click').length,
        activeUsers: new Set(recentEvents.map(e => e.session_id)).size,
        timestamp: now.toISOString()
      };

      socket.send(JSON.stringify({
        type: 'metrics_update',
        data: metrics
      }));
    } catch (error) {
      console.error('[Analytics Stream] Error:', error);
    }
  }, 5000); // Update every 5 seconds
}

