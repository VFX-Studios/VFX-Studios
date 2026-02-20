import { withSecurity } from './_security.ts';
const DEFAULT_FEE_BY_TIER: Record<string, number> = {
  free: 12,
  weekly: 10,
  monthly: 9,
  annual: 8,
  creator_pro: 8,
  enterprise: 6
};

function clampPercent(value: number) {
  if (Number.isNaN(value)) return 10;
  return Math.min(20, Math.max(1, value));
}

export function getMarketplaceFeePercentForTier(tier?: string | null) {
  const normalized = String(tier || 'free').toLowerCase();
  const envKey = `MARKETPLACE_FEE_${normalized.toUpperCase()}`;
  const envValue = Deno.env.get(envKey);
  if (envValue) {
    return clampPercent(Number(envValue));
  }
  return clampPercent(DEFAULT_FEE_BY_TIER[normalized] ?? DEFAULT_FEE_BY_TIER.free);
}


