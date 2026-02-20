Deployment options for vfx-studio.com

Option A: Static host (upload /dist as zip)
1) Build: `npm run build`
2) Zip the dist: `cd dist && zip -r ../vfx-studio-dist.zip .`
3) Upload vfx-studio-dist.zip to your static host (S3/CloudFront, Netlify, Vercel static, etc.).
4) Set headers (via bucket rules or CDN):
   - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Permissions-Policy: geolocation=(), microphone=(), camera=(), fullscreen=(), payment=()`
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Embedder-Policy: require-corp`
   - `Cross-Origin-Resource-Policy: same-origin`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
5) If your host supports HTML rewriting, optionally inject a nonce into `index.html` (`%CSP_NONCE%` placeholder); if not, use the static CSP above (no inline scripts remain).

Option B: Self-serve with Node (upload folder)
1) Build: `npm run build`
2) Upload the whole project or just `/dist` plus `scripts/serve-with-csp.mjs` to the server.
3) Install minimal runtime deps: `npm i express`
4) Run: `node scripts/serve-with-csp.mjs` (serves `dist` on port 4173 with nonces + strict CSP).
5) Reverse proxy (nginx) to the Node server:
   - `location / { proxy_pass http://127.0.0.1:4173; proxy_set_header Host $host; }`
6) TLS: terminate at nginx/Cloudflare; ensure `ALLOWED_ORIGINS` includes `https://vfx-studio.com`.

Option C: Upload unzipped dist to any HTTP server
1) Build and copy `/dist` contents into your web root.
2) Apply the same security headers via server config (nginx example):
```
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; upgrade-insecure-requests" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), fullscreen=(), payment=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
```

Environment variables (for builds)
- Set in `.env` before `npm run build`:
  - `VITE_APP_ID`, `VITE_APP_TOKEN`, `VITE_FUNCTIONS_VERSION`, `VITE_BASE44_APP_BASE_URL`
  - `VITE_USE_SUPABASE=true`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - `VITE_USE_SUPABASE_SERVICE_ROLE=false` (front-end build)
  - `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_PLAN_*`, `PAYPAL_WEBHOOK_ID`
  - `ALLOWED_ORIGINS=https://vfx-studio.com`
  - AI providers as needed: `VITE_HF_API_KEY`, etc.

Quick zip upload recipe
```
npm ci
npm run build
cd dist
zip -r ../vfx-studio-dist.zip .
```
Upload `vfx-studio-dist.zip` to your host and set the headers above.
