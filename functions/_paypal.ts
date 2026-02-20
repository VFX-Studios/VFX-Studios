import { withSecurity } from './_security.ts';
const PAYPAL_MODE = Deno.env.get('PAYPAL_MODE') || 'sandbox';
const PAYPAL_BASE_URL =
  PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID') || '';
const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET') || '';

function requireConfig() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET');
  }
}

function toBasicAuth() {
  const raw = `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`;
  return btoa(raw);
}

export async function getPayPalAccessToken() {
  requireConfig();
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${toBasicAuth()}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`PayPal token request failed (${response.status}): ${details}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

export async function paypalRequest(path: string, method = 'GET', body?: unknown) {
  const token = await getPayPalAccessToken();
  const response = await fetch(`${PAYPAL_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(`PayPal API error (${response.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

export function getApprovalLink(resource: any) {
  const links = Array.isArray(resource?.links) ? resource.links : [];
  const approve = links.find((link) => link.rel === 'approve');
  return approve?.href || null;
}

export function encodeCustomMetadata(payload: Record<string, unknown>) {
  const pairs: string[] = [];
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  });
  return pairs.join('&').slice(0, 255);
}

export function decodeCustomMetadata(input?: string | null) {
  const metadata: Record<string, string> = {};
  if (!input) return metadata;
  input.split('&').forEach((segment) => {
    const [key, value] = segment.split('=');
    if (!key) return;
    metadata[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });
  return metadata;
}

export function getPayPalManageSubscriptionsUrl() {
  return PAYPAL_MODE === 'live'
    ? 'https://www.paypal.com/myaccount/autopay'
    : 'https://www.sandbox.paypal.com/myaccount/autopay';
}

export async function verifyWebhookSignature(req: Request, rawBody: string) {
  const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID');
  if (!webhookId) {
    // Allow fallback in dev while still supporting signature verification in prod.
    return true;
  }

  const authAlgo = req.headers.get('paypal-auth-algo');
  const certUrl = req.headers.get('paypal-cert-url');
  const transmissionId = req.headers.get('paypal-transmission-id');
  const transmissionSig = req.headers.get('paypal-transmission-sig');
  const transmissionTime = req.headers.get('paypal-transmission-time');

  if (!authAlgo || !certUrl || !transmissionId || !transmissionSig || !transmissionTime) {
    return false;
  }

  const payload = {
    auth_algo: authAlgo,
    cert_url: certUrl,
    transmission_id: transmissionId,
    transmission_sig: transmissionSig,
    transmission_time: transmissionTime,
    webhook_id: webhookId,
    webhook_event: JSON.parse(rawBody)
  };

  const verification = await paypalRequest(
    '/v1/notifications/verify-webhook-signature',
    'POST',
    payload
  );

  return verification?.verification_status === 'SUCCESS';
}


