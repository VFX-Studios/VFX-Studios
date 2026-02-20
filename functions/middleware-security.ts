import { withSecurity } from './_security.ts';
/**
 * Security Middleware for Backend Functions
 * Implements OWASP best practices
 */

/**
 * Input sanitization - prevents XSS and injection attacks
 */
export function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 10000); // Max 10KB input
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === 'object') {
        sanitized[key] = sanitizeInput(value);
      } else {
        sanitized[key] = sanitizeInput(value);
      }
    }
    return sanitized;
  }
  
  return input;
}

/**
 * Validate request origin - CSRF protection
 */
export function validateOrigin(req, allowedOrigins = []) {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  // Allow same-origin
  const host = req.headers.get('host');
  if (origin?.includes(host) || referer?.includes(host)) {
    return true;
  }
  
  // Check allowed origins
  if (allowedOrigins.length > 0) {
    return allowedOrigins.some(allowed => 
      origin?.includes(allowed) || referer?.includes(allowed)
    );
  }
  
  return true; // Default allow for public APIs
}

/**
 * Validate JSON payload size
 */
export async function validatePayloadSize(req, maxSizeKB = 500) {
  const contentLength = req.headers.get('content-length');
  
  if (contentLength && parseInt(contentLength) > maxSizeKB * 1024) {
    throw new Error(`Payload too large. Max ${maxSizeKB}KB allowed.`);
  }
  
  return true;
}

/**
 * Generate CORS headers
 */
export function getCORSHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * Security headers for all responses
 */
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), fullscreen=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'X-Permitted-Cross-Domain-Policies': 'none'
  };
}

/**
 * Validate API key format
 */
export function validateAPIKey(key) {
  if (!key) return false;
  
  // Must be at least 32 chars, alphanumeric + special chars
  const regex = /^[A-Za-z0-9_\-]{32,}$/;
  return regex.test(key);
}

/**
 * SQL injection prevention (for raw queries)
 */
export function escapeSQL(value) {
  if (typeof value === 'string') {
    return value.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, (char) => {
      switch (char) {
        case '\0': return '\\0';
        case '\x08': return '\\b';
        case '\x09': return '\\t';
        case '\x1a': return '\\z';
        case '\n': return '\\n';
        case '\r': return '\\r';
        case '"':
        case "'":
        case '\\':
        case '%':
          return '\\' + char;
        default:
          return char;
      }
    });
  }
  return value;
}

/**
 * Timing attack safe string comparison
 */
export function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

