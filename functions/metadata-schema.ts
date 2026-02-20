type MetadataInput = Record<string, any>;

export type VJAssetMetadata = {
  fps: number;
  resolution: { width: number; height: number };
  duration_seconds: number;
  codec: string;
  bitrate_mbps: number;
  seamless: boolean;
  sha256: string;
  phash?: string;
  license: string; // SPDX ID or custom string
  c2pa_manifest_url?: string;
  digitalSourceType?: string; // per C2PA guidance, e.g., "http://cvp.c2pa.org/digitalSourceType/generative"
  beat_bpm?: number;
  timecode_start?: string; // e.g., "00:00:00:00"
  timecode_format?: string; // e.g., "SMPTE-30", "SMPTE-29.97"
  beat_grid?: number[]; // beat onset times (seconds)
  notes?: string;
  [key: string]: unknown;
};

function requiredNumber(value: any, name: string): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`metadata.${name} must be a positive number`);
  }
  return n;
}

function requiredString(value: any, name: string): string {
  if (!value || typeof value !== 'string') {
    throw new Error(`metadata.${name} is required`);
  }
  return value;
}

export function validateMetadata(input: MetadataInput): VJAssetMetadata {
  if (!input || typeof input !== 'object') {
    throw new Error('metadata is required');
  }

  const width = requiredNumber(input.resolution?.width, 'resolution.width');
  const height = requiredNumber(input.resolution?.height, 'resolution.height');

  const metadata: VJAssetMetadata = {
    fps: requiredNumber(input.fps, 'fps'),
    resolution: { width, height },
    duration_seconds: requiredNumber(input.duration_seconds, 'duration_seconds'),
    codec: requiredString(input.codec, 'codec'),
    bitrate_mbps: requiredNumber(input.bitrate_mbps, 'bitrate_mbps'),
    seamless: Boolean(input.seamless),
    sha256: requiredString(input.sha256, 'sha256'),
    license: requiredString(input.license, 'license'),
    phash: typeof input.phash === 'string' ? input.phash : undefined,
    c2pa_manifest_url:
      typeof input.c2pa_manifest_url === 'string' ? input.c2pa_manifest_url : undefined,
    digitalSourceType:
      typeof input.digitalSourceType === 'string' ? input.digitalSourceType : undefined,
    beat_bpm: input.beat_bpm ? requiredNumber(input.beat_bpm, 'beat_bpm') : undefined,
    timecode_start: typeof input.timecode_start === 'string' ? input.timecode_start : undefined,
    timecode_format: typeof input.timecode_format === 'string' ? input.timecode_format : undefined,
    beat_grid: Array.isArray(input.beat_grid) ? input.beat_grid.map((v: any) => Number(v)) : undefined,
    notes: typeof input.notes === 'string' ? input.notes : undefined
  };

  return metadata;
}
