import { pollinationsProvider } from './providers/pollinations.js';
import { huggingFaceProvider } from './providers/huggingface.js';
import { stabilityProvider } from './providers/stability.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const providerState = new Map();
const ENV = import.meta?.env || {};

const DAILY_LIMITS = {
  pollinations: Number.POSITIVE_INFINITY,
  huggingface: Number(ENV.VITE_HF_DAILY_LIMIT || 1000),
  stability: Number(ENV.VITE_STABILITY_DAILY_LIMIT || 25)
};

const ALL_PROVIDERS = [pollinationsProvider, huggingFaceProvider, stabilityProvider];

function getState(name) {
  const existing = providerState.get(name);
  if (existing && Date.now() - existing.windowStart < DAY_MS) {
    return existing;
  }

  const fresh = {
    failures: 0,
    usedToday: 0,
    windowStart: Date.now()
  };
  providerState.set(name, fresh);
  return fresh;
}

function isHealthy(name) {
  return getState(name).failures < 3;
}

function hasQuota(name) {
  return getState(name).usedToday < (DAILY_LIMITS[name] ?? Number.POSITIVE_INFINITY);
}

function markSuccess(name) {
  const state = getState(name);
  state.failures = 0;
  state.usedToday += 1;
}

function markFailure(name) {
  const state = getState(name);
  state.failures += 1;
}

function providerPriority(task) {
  if (task === 'llm') {
    return ['pollinations', 'huggingface'];
  }

  if (task === 'asset3d') {
    return ['huggingface', 'pollinations'];
  }

  return ['pollinations', 'huggingface', 'stability'];
}

function resolveTaskHandler(provider, task) {
  if (task === 'llm') {
    return provider.invokeLLM?.bind(provider);
  }

  if (task === 'video') {
    return (provider.generateVideo || provider.generateImage)?.bind(provider);
  }

  if (task === 'asset3d') {
    return (provider.generate3DAsset || provider.generateImage)?.bind(provider);
  }

  return provider.generateImage?.bind(provider);
}

function orderedProviders(task) {
  const byName = new Map(ALL_PROVIDERS.map((provider) => [provider.name, provider]));
  return providerPriority(task)
    .map((name) => byName.get(name))
    .filter(Boolean)
    .filter((provider) => provider.supports(task) || Boolean(resolveTaskHandler(provider, task)));
}

export async function routeWithFailover(task, params = {}) {
  const providers = orderedProviders(task);
  const failures = [];

  for (const provider of providers) {
    if (!isHealthy(provider.name) || !hasQuota(provider.name)) {
      continue;
    }

    try {
      const runTask = resolveTaskHandler(provider, task);
      if (!runTask) {
        failures.push(`${provider.name}: unsupported task "${task}"`);
        continue;
      }

      const result = await runTask(params);
      markSuccess(provider.name);
      return result;
    } catch (error) {
      markFailure(provider.name);
      failures.push(`${provider.name}: ${error.message}`);
    }
  }

  throw new Error(`All providers failed for task "${task}". ${failures.join(' | ')}`);
}

export function getProviderHealthSnapshot() {
  const snapshot = {};
  for (const provider of ALL_PROVIDERS) {
    const state = getState(provider.name);
    snapshot[provider.name] = {
      healthy: isHealthy(provider.name),
      failures: state.failures,
      usedToday: state.usedToday,
      dailyLimit: DAILY_LIMITS[provider.name]
    };
  }
  return snapshot;
}
