import { useEffect, useMemo, useState } from 'react';
import type { DepEntry, PackageJsonShape } from '../../types';
import { cleanVersion, queryOsv } from './osv';

interface DepsFeatureProps {
  packageJson?: PackageJsonShape;
}

declare global {
  var __DEVMODE_PREVIEW_PKG__: PackageJsonShape | undefined;
}

function getPackageJson(prop?: PackageJsonShape): PackageJsonShape | undefined {
  if (prop) return prop;
  if (typeof globalThis !== 'undefined' && globalThis.__DEVMODE_PREVIEW_PKG__) {
    return globalThis.__DEVMODE_PREVIEW_PKG__;
  }
  return undefined;
}

function buildEntries(pkg: PackageJsonShape): DepEntry[] {
  const entries: DepEntry[] = [];
  const append = (deps: Record<string, string> | undefined, type: 'prod' | 'dev') => {
    if (!deps) return;
    for (const [name, version] of Object.entries(deps)) {
      entries.push({
        name,
        current: cleanVersion(version),
        type,
        vulns: [],
        outdated: null,
      });
    }
  };
  append(pkg.dependencies, 'prod');
  append(pkg.devDependencies, 'dev');
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

function severityRank(s: DepEntry['vulns'][number]['severity']): number {
  switch (s) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}

function maxSeverity(entry: DepEntry): DepEntry['vulns'][number]['severity'] | null {
  if (entry.vulns.length === 0) return null;
  return entry.vulns.reduce(
    (acc, v) => (severityRank(v.severity) > severityRank(acc) ? v.severity : acc),
    entry.vulns[0]!.severity,
  );
}

function pillToneFor(sev: DepEntry['vulns'][number]['severity'] | null): 'ok' | 'warn' | 'bad' | 'info' {
  if (!sev) return 'ok';
  if (sev === 'critical' || sev === 'high') return 'bad';
  if (sev === 'medium') return 'warn';
  if (sev === 'low') return 'info';
  return 'info';
}

export function DepsFeature({ packageJson }: DepsFeatureProps) {
  const pkg = useMemo(() => getPackageJson(packageJson), [packageJson]);
  const [entries, setEntries] = useState<DepEntry[]>(() => (pkg ? buildEntries(pkg) : []));
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'vulnerable'>('all');

  useEffect(() => {
    if (!pkg) return;
    const list = buildEntries(pkg);
    if (list.length === 0) return;
    let cancelled = false;
    setLoading(true);
    queryOsv(list.map((e) => ({ package: e.name, version: e.current })))
      .then((map) => {
        if (cancelled) return;
        setEntries(
          list.map((e) => ({ ...e, vulns: map[`${e.name}@${e.current}`] ?? [] })),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pkg]);

  if (!pkg) {
    return (
      <div className="dmp-panel">
        <div className="dmp-empty">
          <p style={{ margin: 0, marginBottom: 8 }}>No package.json detected.</p>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontFamily: 'var(--dmp-mono)',
              color: 'var(--dmp-text-mute)',
            }}
          >
            Install{' '}
            <code>@promise-inc/devmode-preview/vite</code> or{' '}
            <code>@promise-inc/devmode-preview/next</code> plugin, or pass{' '}
            <code>packageJson</code> prop.
          </p>
        </div>
      </div>
    );
  }

  const visible = filter === 'vulnerable' ? entries.filter((e) => e.vulns.length > 0) : entries;
  const totalVuln = entries.filter((e) => e.vulns.length > 0).length;

  return (
    <div className="dmp-panel">
      <p className="dmp-panel__intro">
        Dependencies scanned via{' '}
        <a
          href="https://osv.dev"
          target="_blank"
          rel="noreferrer noopener"
          style={{ color: 'var(--dmp-accent)' }}
        >
          OSV.dev
        </a>
        . {loading ? 'Scanning…' : `${entries.length} packages · ${totalVuln} with vulnerabilities.`}
      </p>

      <div className="dmp-tabs" style={{ marginBottom: 12, padding: 0, border: 0 }}>
        <button
          type="button"
          className="dmp-tab"
          data-active={filter === 'all' ? 'true' : 'false'}
          onClick={() => setFilter('all')}
        >
          All ({entries.length})
        </button>
        <button
          type="button"
          className="dmp-tab"
          data-active={filter === 'vulnerable' ? 'true' : 'false'}
          onClick={() => setFilter('vulnerable')}
        >
          Vulnerable ({totalVuln})
        </button>
      </div>

      <div className="dmp-stack">
        {visible.map((dep) => {
          const sev = maxSeverity(dep);
          return (
            <div key={`${dep.type}:${dep.name}`} className="dmp-check">
              <div className="dmp-check__row">
                <span
                  className="dmp-check__dot"
                  data-status={
                    sev === 'critical' || sev === 'high'
                      ? 'fail'
                      : sev === 'medium'
                        ? 'warn'
                        : sev
                          ? 'info'
                          : 'pass'
                  }
                />
                <div className="dmp-check__body">
                  <p className="dmp-check__label">
                    {dep.name}{' '}
                    <span
                      style={{
                        fontWeight: 400,
                        fontSize: 11,
                        color: 'var(--dmp-text-mute)',
                        marginLeft: 4,
                      }}
                    >
                      {dep.type}
                    </span>
                  </p>
                  <p className="dmp-check__value">{dep.current}</p>
                  {dep.vulns.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {dep.vulns.map((v) => (
                        <a
                          key={v.id}
                          href={v.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="dmp-pill"
                          data-tone={pillToneFor(v.severity)}
                          style={{ textDecoration: 'none' }}
                          title={v.summary}
                        >
                          {v.severity} · {v.id}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div className="dmp-empty">
            <p style={{ margin: 0 }}>No vulnerabilities found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
