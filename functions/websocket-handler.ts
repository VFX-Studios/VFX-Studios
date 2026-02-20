import { getClient } from './_client.ts';

// WebSocket infrastructure for live streaming & collaborative rooms
// Production deployment requires WebSocket server (e.g., Socket.io, ws)

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    
    // Handle WebSocket upgrade
    if (req.headers.get("upgrade") != "websocket") {
      return new Response("Expected websocket upgrade", { status: 400 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);
    
    // Room management
    const rooms = new Map();
    let currentRoom = null;
    let userSession = null;

    socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'auth':
            // Authenticate user
            try {
              userSession = await base44.asServiceRole.entities.User.filter({
                email: message.email
              });
              socket.send(JSON.stringify({ 
                type: 'auth_success', 
                user_id: userSession[0]?.id 
              }));
            } catch (error) {
              socket.send(JSON.stringify({ type: 'auth_failed' }));
            }
            break;

          case 'join_room':
            // Join collaboration/streaming room
            currentRoom = message.room_id;
            
            if (!rooms.has(currentRoom)) {
              rooms.set(currentRoom, new Set());
            }
            
            rooms.get(currentRoom).add(socket);
            
            // Broadcast user joined
            broadcast(currentRoom, {
              type: 'user_joined',
              user_id: userSession[0]?.id,
              room_id: currentRoom
            }, socket);
            
            socket.send(JSON.stringify({ 
              type: 'room_joined', 
              room_id: currentRoom,
              participant_count: rooms.get(currentRoom).size
            }));
            break;

          case 'state_sync':
            // Sync VJ control panel state
            if (currentRoom) {
              broadcast(currentRoom, {
                type: 'state_update',
                user_id: userSession[0]?.id,
                state: message.state,
                timestamp: Date.now()
              }, socket);
            }
            break;

          case 'stream_reaction':
            // Real-time audience reactions
            if (currentRoom) {
              // Store sentiment
              await base44.asServiceRole.entities.AudienceSentiment.create({
                live_stream_session_id: currentRoom,
                timestamp_seconds: message.timestamp,
                reaction_type: message.reaction,
                viewer_user_id: userSession[0]?.id,
                intensity: message.intensity || 5
              });

              // Broadcast to all viewers
              broadcast(currentRoom, {
                type: 'reaction',
                reaction: message.reaction,
                count: 1
              });
            }
            break;

          case 'super_chat':
            // Handle live donation
            if (currentRoom) {
              broadcast(currentRoom, {
                type: 'super_chat',
                user: userSession[0]?.full_name,
                amount: message.amount,
                message: message.message
              });

              // Process payment
              await base44.asServiceRole.entities.LiveStreamSession.update(currentRoom, {
                total_donations: message.total_donations + message.amount
              });
            }
            break;

          case 'cursor_move':
            // Collaborative editing cursor
            if (currentRoom) {
              broadcast(currentRoom, {
                type: 'cursor',
                user_id: userSession[0]?.id,
                x: message.x,
                y: message.y
              }, socket);
            }
            break;

          default:
            console.warn('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        socket.send(JSON.stringify({ type: 'error', message: error.message }));
      }
    };

    socket.onclose = () => {
      console.log('WebSocket closed');
      
      // Remove from room
      if (currentRoom && rooms.has(currentRoom)) {
        rooms.get(currentRoom).delete(socket);
        
        if (rooms.get(currentRoom).size === 0) {
          rooms.delete(currentRoom);
        } else {
          broadcast(currentRoom, {
            type: 'user_left',
            user_id: userSession[0]?.id
          });
        }
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Broadcast helper
    function broadcast(roomId, message, excludeSocket = null) {
      if (!rooms.has(roomId)) return;
      
      const messageStr = JSON.stringify(message);
      for (const client of rooms.get(roomId)) {
        if (client !== excludeSocket && client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      }
    }

    return response;

  } catch (error) {
    console.error('WebSocket handler error:', error.message);
    return new Response(error.message, { status: 500 });
  }
  }));
