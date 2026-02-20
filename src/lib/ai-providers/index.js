import { buildCacheKey, getCachedValue, setCachedValue } from './cache.js';
import { routeWithFailover, getProviderHealthSnapshot } from './provider-router.js';
import { estimateGenerationTokenCost, resolveGenerationQuality, resolveGenerationType } from './token-pricing.js';

const GENERATION_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const LLM_CACHE_TTL_MS = 30 * 60 * 1000;

function inferDimensions(params = {}) {
  const width = Number(params.width) || 1024;
  const height = Number(params.height) || 1024;
  return { width, height };
}

function resolveTaskFromGenerationType(generationType) {
  if (generationType === 'video') {
    return 'video';
  }
  if (generationType === 'asset3d') {
    return 'asset3d';
  }
  return 'image';
}

export function parseJsonFromText(text) {
  if (typeof text !== 'string') {
    throw new Error('Cannot parse JSON: input is not a string.');
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Cannot parse JSON: empty response.');
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    // Continue to relaxed extraction.
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch {
      // Continue to bracket extraction.
    }
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const candidate = trimmed.slice(start, end + 1);
    return JSON.parse(candidate);
  }

  throw new Error('Unable to extract JSON object from model response.');
}

export async function generateWithProviders(params = {}) {
  const { width, height } = inferDimensions(params);
  const generationType = resolveGenerationType(params);
  const quality = resolveGenerationQuality({ ...params, width, height });
  const tokenCost = estimateGenerationTokenCost({ ...params, width, height, quality });
  const task = resolveTaskFromGenerationType(generationType);

  const cacheKey = buildCacheKey({
    task,
    generation_type: generationType,
    prompt: params.prompt,
    existing_image_urls: params.existing_image_urls || [],
    width,
    height,
    quality,
    duration_seconds: Number(params.duration_seconds) || null
  });

  const cached = getCachedValue(cacheKey);
  if (cached) {
    return {
      ...cached,
      cached: true,
      token_cost: tokenCost,
      quality,
      generation_type: generationType
    };
  }

  const result = await routeWithFailover(task, { ...params, width, height });
  const payload = {
    url: result.url,
    provider: result.provider,
    media_type: result.media_type || (task === 'video' ? 'video' : task === 'asset3d' ? 'asset3d' : 'image'),
    generation_type: generationType
  };

  setCachedValue(cacheKey, payload, GENERATION_CACHE_TTL_MS);
  return {
    ...payload,
    cached: false,
    token_cost: tokenCost,
    quality,
    generation_type: generationType
  };
}

export async function generateImageWithProviders(params = {}) {
  return generateWithProviders({
    ...params,
    generation_type: params.generation_type || 'image'
  });
}

export async function generateVideoWithProviders(params = {}) {
  return generateWithProviders({
    ...params,
    generation_type: 'video'
  });
}

export async function generate3DAssetWithProviders(params = {}) {
  return generateWithProviders({
    ...params,
    generation_type: 'asset3d'
  });
}

export async function invokeLLMWithProviders(params = {}) {
  const cacheKey = buildCacheKey({
    task: 'llm',
    prompt: params.prompt,
    response_json_schema: params.response_json_schema || null
  });

  const cached = getCachedValue(cacheKey);
  if (cached) {
    return {
      ...cached,
      cached: true
    };
  }

  const result = await routeWithFailover('llm', params);
  setCachedValue(cacheKey, result, LLM_CACHE_TTL_MS);
  return {
    ...result,
    cached: false
  };
}

export function getAIProviderHealth() {
  return getProviderHealthSnapshot();
}
