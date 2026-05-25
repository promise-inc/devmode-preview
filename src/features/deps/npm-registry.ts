import { readSession, writeSession } from '../../core/storage';

const CACHE_KEY = 'npm-cache';
const CACHE_TTL = 60 * 60 * 1000;

export interface NpmPackageInfo {
  latest: string;
  publishedAt: string;
}

interface CacheShape {
  at: number;
  data: Record<string, NpmPackageInfo>;
}

interface NpmResponse {
  'dist-tags'?: { latest?: string };
  time?: Record<string, string>;
}

function buildUrl(name: string): string {
  if (name.startsWith('@')) {
    const [scope, rest] = name.split('/');
    return `https://registry.npmjs.org/${scope}%2F${rest}`;
  }
  return `https://registry.npmjs.org/${name}`;
}

async function fetchPkg(name: string): Promise<NpmPackageInfo | null> {
  try {
    const res = await fetch(buildUrl(name));
    if (!res.ok) return null;
    const body = (await res.json()) as NpmResponse;
    const latest = body['dist-tags']?.latest;
    if (!latest) return null;
    const publishedAt = body.time?.[latest] ?? body.time?.modified ?? '';
    return { latest, publishedAt };
  } catch {
    return null;
  }
}

export async function fetchNpmInfoBatch(
  packages: string[],
): Promise<Record<string, NpmPackageInfo>> {
  if (packages.length === 0) return {};

  const cache = readSession<CacheShape | null>(CACHE_KEY, null);
  const now = Date.now();
  const fresh = cache && now - cache.at < CACHE_TTL ? cache.data : {};

  const toFetch = packages.filter((p) => !(p in fresh));

  if (toFetch.length > 0) {
    const results = await Promise.all(
      toFetch.map(async (name) => [name, await fetchPkg(name)] as const),
    );
    const newData = { ...fresh };
    for (const [name, info] of results) {
      if (info) newData[name] = info;
    }
    writeSession(CACHE_KEY, { at: now, data: newData });
    Object.assign(fresh, newData);
  }

  const out: Record<string, NpmPackageInfo> = {};
  for (const p of packages) {
    const info = fresh[p];
    if (info) out[p] = info;
  }
  return out;
}

export type OutdatedKind = 'up-to-date' | 'patch' | 'minor' | 'major' | 'ahead';

function parseSemver(version: string): [number, number, number] {
  const cleaned = version.replace(/^v/, '').split('-')[0] ?? version;
  const parts = cleaned.split('.').map((x) => Number(x));
  const [a = 0, b = 0, c = 0] = parts;
  return [Number.isFinite(a) ? a : 0, Number.isFinite(b) ? b : 0, Number.isFinite(c) ? c : 0];
}

export function compareSemver(current: string, latest: string): OutdatedKind {
  const [c0, c1, c2] = parseSemver(current);
  const [l0, l1, l2] = parseSemver(latest);
  if (c0 < l0) return 'major';
  if (c0 > l0) return 'ahead';
  if (c1 < l1) return 'minor';
  if (c1 > l1) return 'ahead';
  if (c2 < l2) return 'patch';
  if (c2 > l2) return 'ahead';
  return 'up-to-date';
}

export function relativeTime(iso: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const mo = Math.floor(d / 30);
  const y = Math.floor(d / 365);
  if (y >= 1) return `${y} year${y > 1 ? 's' : ''} ago`;
  if (mo >= 1) return `${mo} month${mo > 1 ? 's' : ''} ago`;
  if (d >= 1) return `${d} day${d > 1 ? 's' : ''} ago`;
  if (h >= 1) return `${h} hour${h > 1 ? 's' : ''} ago`;
  if (m >= 1) return `${m} minute${m > 1 ? 's' : ''} ago`;
  return 'just now';
}
