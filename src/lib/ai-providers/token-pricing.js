const PRICING_TABLE = {
  image: {
    standard: 2,
    hd: 5,
    cinematic: 12
  },
  video: {
    preview: 8,
    hd: 15,
    cinematic: 25
  },
  asset3d: {
    standard: 20
  }
};

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

export function resolveGenerationType({ generation_type, type, task } = {}) {
  const raw = normalizeText(generation_type || type || task || 'image');

  if (raw.includes('3d') || raw.includes('mesh') || raw.includes('asset3d')) {
    return 'asset3d';
  }

  if (raw.includes('video') || raw.includes('animation')) {
    return 'video';
  }

  return 'image';
}

export function resolveImageQuality({ quality, width, height, prompt } = {}) {
  const q = normalizeText(quality);
  const p = normalizeText(prompt);

  if (q.includes('4k') || q.includes('cinematic') || width >= 3840 || height >= 2160 || p.includes('4k') || p.includes('cinematic')) {
    return 'cinematic';
  }

  if (q.includes('hd') || width >= 1920 || height >= 1080 || p.includes('hd') || p.includes('1920')) {
    return 'hd';
  }

  return 'standard';
}

export function resolveVideoQuality({ quality, width, height, duration_seconds, prompt } = {}) {
  const q = normalizeText(quality);
  const p = normalizeText(prompt);
  const duration = Number(duration_seconds) || 0;
  const w = Number(width) || 0;
  const h = Number(height) || 0;

  if (q.includes('cinematic') || q.includes('4k') || duration >= 15 || p.includes('cinematic')) {
    return 'cinematic';
  }

  if (q.includes('hd') || q.includes('1080') || duration >= 10 || w >= 1920 || h >= 1080 || p.includes('hd')) {
    return 'hd';
  }

  return 'preview';
}

export function resolveAsset3DQuality() {
  return 'standard';
}

export function calculateTokenCost({ generationType = 'image', quality = 'standard' } = {}) {
  const type = PRICING_TABLE[generationType];
  if (!type) return 0;
  return type[quality] ?? 0;
}

export function estimateImageTokenCost(params = {}) {
  const quality = resolveImageQuality(params);
  return calculateTokenCost({
    generationType: 'image',
    quality
  });
}

export function estimateVideoTokenCost(params = {}) {
  const quality = resolveVideoQuality(params);
  return calculateTokenCost({
    generationType: 'video',
    quality
  });
}

export function estimateAsset3DTokenCost() {
  return calculateTokenCost({
    generationType: 'asset3d',
    quality: resolveAsset3DQuality()
  });
}

export function estimateGenerationTokenCost(params = {}) {
  const generationType = resolveGenerationType(params);

  if (generationType === 'video') {
    return estimateVideoTokenCost(params);
  }

  if (generationType === 'asset3d') {
    return estimateAsset3DTokenCost();
  }

  return estimateImageTokenCost(params);
}

export function resolveGenerationQuality(params = {}) {
  const generationType = resolveGenerationType(params);

  if (generationType === 'video') {
    return resolveVideoQuality(params);
  }

  if (generationType === 'asset3d') {
    return resolveAsset3DQuality();
  }

  return resolveImageQuality(params);
}

export function getPricingTable() {
  return PRICING_TABLE;
}
