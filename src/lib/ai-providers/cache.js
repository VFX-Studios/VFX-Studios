const MEMORY_CACHE = new Map();
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;
const STORAGE_KEY = 'ai_provider_cache_v1';

function hasLocalStorage() {
  return typeof window !== 'undefined' && !!window.localStorage;
}

function simpleHash(value) {
  const input = String(value || '');
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

function loadStorageCache() {
  if (!hasLocalStorage()) return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeStorageCache(cache) {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage failures.
  }
}

function now() {
  return Date.now();
}

export function buildCacheKey(payload = {}) {
  return simpleHash(JSON.stringify(payload));
}

export function getCachedValue(key) {
  const memoryEntry = MEMORY_CACHE.get(key);
  if (memoryEntry && memoryEntry.expiresAt > now()) {
    return memoryEntry.value;
  }
  if (memoryEntry) {
    MEMORY_CACHE.delete(key);
  }

  const storageCache = loadStorageCache();
  const storageEntry = storageCache[key];
  if (!storageEntry) return null;
  if (storageEntry.expiresAt <= now()) {
    delete storageCache[key];
    writeStorageCache(storageCache);
    return null;
  }

  MEMORY_CACHE.set(key, storageEntry);
  return storageEntry.value;
}

export function setCachedValue(key, value, ttlMs = DEFAULT_TTL_MS) {
  const entry = {
    value,
    expiresAt: now() + ttlMs
  };
  MEMORY_CACHE.set(key, entry);

  const storageCache = loadStorageCache();
  storageCache[key] = entry;
  writeStorageCache(storageCache);
}
