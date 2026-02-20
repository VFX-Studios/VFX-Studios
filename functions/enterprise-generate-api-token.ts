import { getClient } from './_client.ts';

// Secure token generation using Web Crypto API
async function generateSecureToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Hash token using SHA-256
async function hashToken(token) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(withSecurity(async (req) => {
  try {
    const base44 = getClient(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const {
      enterprise_account_id,
      token_name,
      scopes,
      rate_limit,
      expires_in_days
    } = await req.json();

    // Generate secure token
    const token = `vfx_${await generateSecureToken()}`;
    const tokenHash = await hashToken(token);

    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expires_in_days || 365));

    // Create API token record
    const apiToken = await base44.asServiceRole.entities.APIAccessToken.create({
      enterprise_account_id,
      token_name,
      token_hash: tokenHash,
      scopes: scopes || ['read:assets', 'read:performances'],
      rate_limit: rate_limit || 1000,
      expires_at: expiresAt.toISOString(),
      is_active: true
    });

    // Return plaintext token ONCE (never stored)
    return Response.json({
      success: true,
      token: token,
      token_id: apiToken.id,
      expires_at: expiresAt.toISOString(),
      scopes: apiToken.scopes,
      rate_limit: apiToken.rate_limit,
      warning: '⚠️ SAVE THIS TOKEN NOW! It will not be shown again.',
      api_endpoint: `${req.headers.get('origin')}/api/v1`,
      example_usage: {
        curl: `curl -H "Authorization: Bearer ${token}" ${req.headers.get('origin')}/api/v1/assets`,
        javascript: `fetch('${req.headers.get('origin')}/api/v1/assets', { headers: { 'Authorization': 'Bearer ${token}' } })`
      }
    });

  } catch (error) {
    console.error('enterprise-generate-api-token error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
  }));
