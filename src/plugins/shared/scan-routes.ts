import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { DevModeRoute } from '../../types';

const PAGE_FILES = new Set(['page.tsx', 'page.jsx', 'page.ts', 'page.js']);

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
        walk(full);
      } else if (PAGE_FILES.has(entry)) {
        const route = buildAppPath(rootDir, dir);
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
      if (entry === 'api' || entry === '_app' || entry.startsWith('_')) continue;
      const full = join(dir, entry);
      let stat;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        walk(full);
      } else if (PAGE_EXT.test(entry)) {
        const rel = relative(rootDir, full)
          .replace(PAGE_EXT, '')
          .replace(new RegExp(`\\${sep}`, 'g'), '/');
        const path = rel === 'index' ? '/' : `/${rel.replace(/\/index$/, '')}`;
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

function buildAppPath(rootDir: string, dir: string): string {
  const rel = relative(rootDir, dir);
  if (rel === '') return '/';
  const segments = rel.split(sep).filter((s) => !s.startsWith('(') || !s.endsWith(')'));
  if (segments.length === 0) return '/';
  return `/${segments.join('/')}`;
}

function inferCategory(rootDir: string, dir: string): string {
  const rel = relative(rootDir, dir);
  const groups = rel.split(sep).filter((s) => s.startsWith('(') && s.endsWith(')'));
  if (groups.length > 0) {
    const name = groups[0]!.slice(1, -1);
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return 'Pages';
}

function inferAccess(dir: string): 'public' | 'private' {
  const lower = dir.toLowerCase();
  if (
    lower.includes('/(auth)') ||
    lower.includes('/(private)') ||
    lower.includes('/(protected)') ||
    lower.includes('/(app)') ||
    lower.includes('/(dashboard)') ||
    lower.includes('/(admin)')
  ) {
    return 'private';
  }
  return 'public';
}

function inferLabel(path: string): string {
  if (path === '/') return 'Home';
  const last = path.split('/').filter(Boolean).pop() ?? '';
  return last
    .replace(/\[\.\.\.(.+?)\]/g, '$1')
    .replace(/\[(.+?)\]/g, '$1')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
