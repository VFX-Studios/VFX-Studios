import { readFileSync, createReadStream } from 'fs';
import { randomBytes } from 'crypto';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const indexTemplate = readFileSync(path.join(distDir, 'index.html'), 'utf8');

function nonce() {
  return randomBytes(16).toString('base64').replace(/=+$/, '');
}

const app = express();

app.use((req, res, next) => {
  const n = nonce();
  res.locals.cspNonce = n;
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${n}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "media-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    'upgrade-insecure-requests'
  ].join('; ');

  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), fullscreen=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  next();
});

app.get('/', (req, res) => {
  const html = indexTemplate.replace(/%CSP_NONCE%/g, res.locals.cspNonce);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.use(express.static(distDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
}));

const port = process.env.PORT || 4173;
app.listen(port, () => {
  console.log(`Serving dist with CSP on http://localhost:${port}`);
});
