import { getSecurityHeaders } from './middleware-security.ts';

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function randomNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/=+$/, '');
}

function isAllowedOrigin(origin: string | null, host: string | null) {
  if (!origin && !host) return false;
  const originHost = origin ? new URL(origin).host : null;
  if (host && originHost && host === originHost) return true;
  if (ALLOWED_ORIGINS.length === 0) return true;
  return ALLOWED_ORIGINS.some((allowed) => (origin || '').includes(allowed));
}

export function withSecurity(
  handler: (req: Request, ctx: { nonce: string }) => Promise<Response> | Response
) {
  return async (req: Request): Promise<Response> => {
    const nonce = randomNonce();
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');
    const host = req.headers.get('host');

    if (!isAllowedOrigin(origin || referer, host)) {
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    const res = await handler(req, { nonce });
    const securityHeaders = getSecurityHeaders();
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "media-src 'self' data: blob:",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      'upgrade-insecure-requests'
    ].join('; ');

    const merged = new Headers(res.headers);
    merged.set('Content-Security-Policy', csp);
    merged.set('Access-Control-Allow-Origin', origin || '*');
    merged.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    merged.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    merged.set('Access-Control-Max-Age', '86400');

    Object.entries(securityHeaders).forEach(([k, v]) => merged.set(k, v));

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: merged
    });
  };
}
