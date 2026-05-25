import type { DepVuln } from '../../types';
import { readSession, writeSession } from '../../core/storage';

const OSV_ENDPOINT = 'https://api.osv.dev/v1/querybatch';
const CACHE_KEY = 'osv-cache';
const CACHE_TTL = 60 * 60 * 1000;

interface OsvBatchResponse {
  results: Array<{
    vulns?: Array<{
      id: string;
      summary?: string;
      database_specific?: { severity?: string };
      severity?: Array<{ type: string; score: string }>;
    }>;
  }>;
}

interface QueryItem {
  package: string;
  version: string;
}

interface CacheShape {
  at: number;
  data: Record<string, DepVuln[]>;
}

function cacheKey(pkg: string, version: string): string {
  return `${pkg}@${version}`;
}

function getCache(): CacheShape | null {
  return readSession<CacheShape | null>(CACHE_KEY, null);
}

function setCache(data: CacheShape): void {
  writeSession(CACHE_KEY, data);
}

function severityFrom(vuln: OsvBatchResponse['results'][number]['vulns'] extends Array<infer V> | undefined ? V : never): DepVuln['severity'] {
  if (!vuln) return 'unknown';
  const dbSev = vuln.database_specific?.severity?.toLowerCase();
  if (dbSev === 'critical' || dbSev === 'high' || dbSev === 'medium' || dbSev === 'low') {
    return dbSev;
  }
  if (Array.isArray(vuln.severity)) {
    for (const s of vuln.severity) {
      if (s.type === 'CVSS_V3' || s.type === 'CVSS_V4') {
        const score = parseFloat(s.score.split('/')[0] ?? '0');
        if (Number.isFinite(score)) {
          if (score >= 9) return 'critical';
          if (score >= 7) return 'high';
          if (score >= 4) return 'medium';
          if (score > 0) return 'low';
        }
      }
    }
  }
  return 'unknown';
}

export async function queryOsv(items: QueryItem[]): Promise<Record<string, DepVuln[]>> {
  if (items.length === 0) return {};

  const cache = getCache();
  const now = Date.now();
  const fresh = cache && now - cache.at < CACHE_TTL ? cache.data : {};

  const toFetch = items.filter((i) => !(cacheKey(i.package, i.version) in fresh));

  if (toFetch.length === 0) {
    const out: Record<string, DepVuln[]> = {};
    for (const item of items) {
      out[cacheKey(item.package, item.version)] = fresh[cacheKey(item.package, item.version)] ?? [];
    }
    return out;
  }

  try {
    const response = await fetch(OSV_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queries: toFetch.map((q) => ({
          package: { name: q.package, ecosystem: 'npm' },
          version: q.version,
        })),
      }),
    });

    if (!response.ok) throw new Error(`OSV.dev returned ${response.status}`);

    const body = (await response.json()) as OsvBatchResponse;

    const newData = { ...fresh };
    body.results.forEach((result, index) => {
      const query = toFetch[index];
      if (!query) return;
      const list: DepVuln[] = (result.vulns ?? []).map((v) => ({
        id: v.id,
        summary: v.summary ?? v.id,
        severity: severityFrom(v),
        url: `https://osv.dev/vulnerability/${v.id}`,
      }));
      newData[cacheKey(query.package, query.version)] = list;
    });

    setCache({ at: now, data: newData });

    const out: Record<string, DepVuln[]> = {};
    for (const item of items) {
      out[cacheKey(item.package, item.version)] = newData[cacheKey(item.package, item.version)] ?? [];
    }
    return out;
  } catch {
    const out: Record<string, DepVuln[]> = {};
    for (const item of items) {
      out[cacheKey(item.package, item.version)] = fresh[cacheKey(item.package, item.version)] ?? [];
    }
    return out;
  }
}

function cleanVersion(raw: string): string {
  return raw.replace(/^[\^~>=<\s]+/, '').split(/\s+/)[0] ?? raw;
}

export { cleanVersion };
