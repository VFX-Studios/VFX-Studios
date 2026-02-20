import { withSecurity } from './_security.ts';
/**
 * Rate Limiting Middleware for Backend Functions
 * Prevents API abuse and DDoS attacks
 * 
 * Usage: Import and wrap sensitive endpoints
 */

const rateLimitStore = new Map();
const RATE_LIMITS = {
  default: { requests: 100, window: 60000 }, // 100 req/min
  auth: { requests: 5, window: 60000 }, // 5 req/min for auth
  payment: { requests: 10, window: 60000 }, // 10 req/min for payments
  ai: { requests: 20, window: 60000 } // 20 req/min for AI
};

/**
 * Rate limit check
 * @param {string} identifier - IP or user ID
 * @param {string} category - Rate limit category
 * @returns {object} { allowed: boolean, remaining: number }
 */
export function checkRateLimit(identifier, category = 'default') {
  const limit = RATE_LIMITS[category] || RATE_LIMITS.default;
  const key = `${category}:${identifier}`;
  const now = Date.now();
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limit.window
    });
    return { allowed: true, remaining: limit.requests - 1 };
  }
  
  const record = rateLimitStore.get(key);
  
  // Reset if window expired
  if (now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limit.window
    });
    return { allowed: true, remaining: limit.requests - 1 };
  }
  
  // Check if limit exceeded
  if (record.count >= limit.requests) {
    return { 
      allowed: false, 
      remaining: 0,
      resetIn: Math.ceil((record.resetTime - now) / 1000)
    };
  }
  
  // Increment count
  record.count++;
  return { allowed: true, remaining: limit.requests - record.count };
}

/**
 * Get client identifier (IP + User Agent hash)
 */
export function getClientIdentifier(req) {
  const ip = req.headers.get('cf-connecting-ip') || 
             req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  // Hash for privacy
  return hashString(`${ip}:${userAgent}`);
}

/**
 * Simple hash function
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Cleanup old entries (run periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime + 60000) { // 1 min grace
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimits, 300000);

