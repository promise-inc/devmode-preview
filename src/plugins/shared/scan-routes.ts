import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { DevModeRoute } from '../../types';

const PAGE_FILES = new Set(['page.tsx', 'page.jsx', 'page.ts', 'page.js']);
const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  '.turbo',
  '.cache',
  'dist',
  'build',
  'out',
  'coverage',
  '__tests__',
  '__mocks__',
]);

function shouldSkipDir(entry: string): boolean {
  if (IGNORED_DIRS.has(entry)) return true;
  if (entry.startsWith('.')) return true;
  if (entry.startsWith('_')) return true;
  if (entry === 'api') return true;
  return false;
}

function isDynamicSegment(seg: string): boolean {
  return seg.startsWith('[') && seg.endsWith(']');
}

function isRouteGroup(seg: string): boolean {
  return seg.startsWith('(') && seg.endsWith(')');
}

export function scanAppRouter(rootDir: string): DevModeRoute[] {
  const routes: DevModeRoute[] = [];

  const walk = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = join(dir, entry);
      let stat;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        if (shouldSkipDir(entry)) continue;
        walk(full);
      } else if (PAGE_FILES.has(entry)) {
        const route = buildAppPath(rootDir, dir);
        if (!route) continue;
        const category = inferCategory(rootDir, dir);
        const access = inferAccess(dir);
        routes.push({
          path: route,
          label: inferLabel(route),
          category,
          access,
        });
      }
    }
  };

  walk(rootDir);
  return dedupe(routes);
}

export function scanPagesRouter(rootDir: string): DevModeRoute[] {
  const routes: DevModeRoute[] = [];
  const PAGE_EXT = /\.(tsx|jsx|ts|js|mdx)$/;

  const walk = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }

    for (const entry of entries) {
      if (shouldSkipDir(entry)) continue;
      const full = join(dir, entry);
      let stat;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        walk(full);
      } else if (PAGE_EXT.test(entry) && !entry.startsWith('_')) {
        const rel = relative(rootDir, full)
          .replace(PAGE_EXT, '')
          .replace(new RegExp(`\\${sep}`, 'g'), '/');
        const path = rel === 'index' ? '/' : `/${rel.replace(/\/index$/, '')}`;
        if (path.includes('[') || path.includes(']')) continue;
        routes.push({
          path,
          label: inferLabel(path),
          category: 'Pages',
          access: 'public',
        });
      }
    }
  };

  walk(rootDir);
  return dedupe(routes);
}

function buildAppPath(rootDir: string, dir: string): string | null {
  const rel = relative(rootDir, dir);
  if (rel === '') return '/';
  const rawSegments = rel.split(sep);

  for (const seg of rawSegments) {
    if (isDynamicSegment(seg)) return null;
    if (seg.startsWith('@')) return null;
  }

  const segments = rawSegments.filter((s) => !isRouteGroup(s));
  if (segments.length === 0) return '/';
  return `/${segments.join('/')}`;
}

function inferCategory(rootDir: string, dir: string): string {
  const rel = relative(rootDir, dir);
  const groups = rel.split(sep).filter((s) => isRouteGroup(s));
  if (groups.length > 0) {
    const name = groups[0]!.slice(1, -1);
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return 'Pages';
}

function inferAccess(dir: string): 'public' | 'private' {
  const lower = dir.toLowerCase();
  if (
    lower.includes(`${sep}(auth)`) ||
    lower.includes(`${sep}(authed)`) ||
    lower.includes(`${sep}(private)`) ||
    lower.includes(`${sep}(protected)`) ||
    lower.includes(`${sep}(app)`) ||
    lower.includes(`${sep}(dashboard)`) ||
    lower.includes(`${sep}(admin)`) ||
    lower.includes(`${sep}(internal)`)
  ) {
    return 'private';
  }
  return 'public';
}

function inferLabel(path: string): string {
  if (path === '/') return 'Home';
  const last = path.split('/').filter(Boolean).pop() ?? '';
  return last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function dedupe(routes: DevModeRoute[]): DevModeRoute[] {
  const seen = new Set<string>();
  const out: DevModeRoute[] = [];
  for (const r of routes) {
    if (seen.has(r.path)) continue;
    seen.add(r.path);
    out.push(r);
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}
