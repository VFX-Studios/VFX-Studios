# Testing and Safety Report (2026-02-20)

## Scope
- AI provider abstraction + failover/cache/token pricing.
- Base44/Supabase compatibility layer.
- Stripe-to-PayPal payment migration.
- Marketplace fee model consistency for creator monetization.

## Commands Executed
1. `npm run build`
Result: PASS
Notes: build succeeds; non-blocking baseline-browser-mapping staleness warning.

2. `npm run smoke:ai`
Result: PASS
Notes: validates token pricing tiers, cache path, JSON parsing robustness, and missing-prompt error behavior.

3. `npm run lint`
Result: FAIL
Notes: 117 pre-existing unused-import errors across many files, not introduced in this migration.

4. `npm run typecheck`
Result: FAIL
Notes: large pre-existing project-level typing issues; additional expected typing friction due dynamic compat client surface.

5. `npm audit --omit=dev --json`
Result: FAIL (security advisories present)
Summary: 11 prod vulnerabilities (7 high, 4 moderate).
Top high-risk packages: `react-router-dom` (open redirect/XSS advisory chain), `axios`, `jspdf`, `glob/minimatch`.

## Safety Findings

### Payment Safety
- Implemented PayPal webhook signature verification path (`PAYPAL_WEBHOOK_ID`-based verification).
- Replaced direct Stripe handlers with PayPal equivalents while preserving function names.
- Added structured metadata encoding/decoding for safer event reconciliation.

### AI Safety
- Added multi-provider failover with health checks and daily quota controls.
- Added cache and prompt-keying to reduce repeated external calls.
- Added robust JSON extraction for schema-constrained model responses.
- Added runtime toggle: `VITE_USE_AI_PROVIDER_ROUTER=false` to force provider bypass.

### Marketplace Revenue Safety
- Fixed fee inconsistency: webhook marketplace settlement no longer hardcodes 20%.
- Added tier-aware fee policy (`functions/_marketplace-fees.ts`):
  - free 12%
  - weekly 10%
  - monthly 9%
  - annual 8%
  - creator_pro 8%
  - enterprise 6%
- Fee policy is overrideable via env vars (`MARKETPLACE_FEE_<TIER>`).

## High-Priority Remediation Queue
1. Update vulnerable packages:
- `react-router-dom` (to patched series)
- `axios` (>= fixed release)
- `jspdf` (>= patched release)
- transitive `glob/minimatch`

2. Enforce lint/typecheck gates progressively:
- Stage A: auto-fix unused imports.
- Stage B: API typings for compat client and UI primitives.
- Stage C: re-enable strict CI gating.

3. Harden webhook idempotency:
- Store PayPal event IDs and ignore duplicate deliveries.

4. Add integration tests for critical payment flows:
- create checkout -> webhook -> entitlements update.

## Risk Status
- Build/runtime path: usable.
- Compliance/testing maturity: partial.
- Production-hardening status: medium risk until dependency/security and typing backlog is resolved.
