import assert from 'node:assert/strict';
import { buildCacheKey, getCachedValue, setCachedValue } from '../src/lib/ai-providers/cache.js';
import {
  estimateAsset3DTokenCost,
  estimateGenerationTokenCost,
  estimateImageTokenCost,
  estimateVideoTokenCost,
  resolveGenerationType,
  resolveImageQuality,
  resolveVideoQuality
} from '../src/lib/ai-providers/token-pricing.js';
import { invokeLLMWithProviders, parseJsonFromText } from '../src/lib/ai-providers/index.js';

function run() {
  const standardQuality = resolveImageQuality({ width: 1024, height: 1024 });
  const hdQuality = resolveImageQuality({ width: 1920, height: 1080 });
  const cinematicQuality = resolveImageQuality({ width: 3840, height: 2160 });
  assert.equal(standardQuality, 'standard');
  assert.equal(hdQuality, 'hd');
  assert.equal(cinematicQuality, 'cinematic');

  assert.equal(estimateImageTokenCost({ width: 1024, height: 1024 }), 2);
  assert.equal(estimateImageTokenCost({ width: 1920, height: 1080 }), 5);
  assert.equal(estimateImageTokenCost({ width: 3840, height: 2160 }), 12);
  assert.equal(resolveVideoQuality({ width: 1280, height: 720, duration_seconds: 4 }), 'preview');
  assert.equal(resolveVideoQuality({ width: 1920, height: 1080, duration_seconds: 10 }), 'hd');
  assert.equal(resolveVideoQuality({ width: 1920, height: 1080, duration_seconds: 15 }), 'cinematic');
  assert.equal(estimateVideoTokenCost({ width: 1280, height: 720, duration_seconds: 4 }), 8);
  assert.equal(estimateVideoTokenCost({ width: 1920, height: 1080, duration_seconds: 10 }), 15);
  assert.equal(estimateVideoTokenCost({ width: 1920, height: 1080, duration_seconds: 15 }), 25);
  assert.equal(estimateAsset3DTokenCost(), 20);

  assert.equal(resolveGenerationType({ generation_type: 'text_to_video' }), 'video');
  assert.equal(resolveGenerationType({ generation_type: '3d_asset' }), 'asset3d');
  assert.equal(resolveGenerationType({ generation_type: 'image' }), 'image');
  assert.equal(estimateGenerationTokenCost({ generation_type: 'image', width: 1920, height: 1080 }), 5);
  assert.equal(estimateGenerationTokenCost({ generation_type: 'video', duration_seconds: 4 }), 8);
  assert.equal(estimateGenerationTokenCost({ generation_type: 'asset3d' }), 20);

  const key = buildCacheKey({ task: 'image', prompt: 'smoke-test' });
  setCachedValue(key, { url: 'https://example.com/a.png' }, 10_000);
  const cached = getCachedValue(key);
  assert.equal(cached.url, 'https://example.com/a.png');

  const parsedDirect = parseJsonFromText('{"ok":true,"n":1}');
  assert.equal(parsedDirect.ok, true);
  assert.equal(parsedDirect.n, 1);

  const parsedFenced = parseJsonFromText('```json\n{"ok":true,"mode":"fenced"}\n```');
  assert.equal(parsedFenced.mode, 'fenced');
}

async function runAsync() {
  let gotExpectedError = false;
  try {
    await invokeLLMWithProviders({});
  } catch (error) {
    gotExpectedError = String(error.message || '').includes('Prompt is required');
  }
  assert.equal(gotExpectedError, true);
}

run();
await runAsync();
console.log('AI provider smoke checks passed.');
