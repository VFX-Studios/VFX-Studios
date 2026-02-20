import { getClient } from './_client.ts';
import { checkRateLimit, getClientIdentifier } from './middleware-rate-limit.js';
import { sanitizeInput, validatePayloadSize, getSecurityHeaders } from './middleware-security.js';

/**
 * Track analytics events from client-side
 * Securely stores event data with proper validation and rate limiting
 */
Deno.serve(withSecurity(async (req) => {
  try {
    // Apply rate limiting
    const clientId = getClientIdentifier(req);
    const rateCheck = checkRateLimit(clientId, 'default');
    
    if (!rateCheck.allowed) {
      return Response.json({
        error: 'Rate limit exceeded',
        retry_after: rateCheck.resetIn
      }, { 
        status: 429,
        headers: getSecurityHeaders()
      });
    }
    
    // Validate payload size
    await validatePayloadSize(req, 100); // 100KB max
    
    const base44 = getClient(req);
    
    // Optional authentication - some events may be public
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      // Public event tracking allowed for certain event types
    }

    let rawData = await req.json();
    const { event_type, entity_id, entity_type, value, metadata } = sanitizeInput(rawData);

    // Validate required fields
    if (!event_type) {
      return Response.json({ error: 'event_type is required' }, { status: 400 });
    }

    // Validate event type
    const validEventTypes = [
      'video_view',
      'video_watch_time',
      'social_impression',
      'social_click',
      'thumbnail_impression',
      'thumbnail_click',
      'asset_view',
      'asset_purchase'
    ];

    if (!validEventTypes.includes(event_type)) {
      return Response.json({ error: 'Invalid event_type' }, { status: 400 });
    }

    // Extract request metadata
    const clientIP = req.headers.get('cf-connecting-ip') || 
                     req.headers.get('x-forwarded-for') || 
                     'unknown';
    
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Create analytics event
    const event = await base44.entities.AnalyticsEvent.create({
      user_id: user?.id || 'anonymous',
      event_type,
      entity_id: entity_id || null,
      entity_type: entity_type || null,
      value: value || null,
      metadata: metadata || {},
      session_id: metadata?.session_id || crypto.randomUUID(),
      ip_address: await hashIP(clientIP), // Hash for privacy
      user_agent: userAgent
    });

    return Response.json({
      success: true,
      event_id: event.id
    }, {
      headers: {
        ...getSecurityHeaders(),
        'X-RateLimit-Remaining': rateCheck.remaining.toString()
      }
    });

  } catch (error) {
    console.error('[Analytics] Tracking error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

/**
 * Hash IP address for privacy compliance (GDPR)
 */
async function hashIP(ip) {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

