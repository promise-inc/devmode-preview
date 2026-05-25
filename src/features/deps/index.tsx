import { useEffect, useMemo, useState } from 'react';
import type { DepEntry, PackageJsonShape } from '../../types';
import { cleanVersion, queryOsv } from './osv';
import { compareSemver, fetchNpmInfoBatch, relativeTime, type OutdatedKind } from './npm-registry';

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

function pillToneFor(
  sev: DepEntry['vulns'][number]['severity'] | null,
): 'ok' | 'warn' | 'bad' | 'info' {
  if (!sev) return 'ok';
  if (sev === 'critical' || sev === 'high') return 'bad';
  if (sev === 'medium') return 'warn';
  if (sev === 'low') return 'info';
  return 'info';
}

function outdatedTone(kind: OutdatedKind): 'ok' | 'warn' | 'bad' | 'info' {
  if (kind === 'up-to-date' || kind === 'ahead') return 'ok';
  if (kind === 'major') return 'bad';
  if (kind === 'minor') return 'warn';
  return 'info';
}

function outdatedLabel(kind: OutdatedKind): string {
  switch (kind) {
    case 'up-to-date':
      return 'up-to-date';
    case 'ahead':
      return 'ahead of latest';
    case 'patch':
      return 'patch behind';
    case 'minor':
      return 'minor behind';
    case 'major':
      return 'major behind';
  }
}

function statusDot(entry: DepEntry): 'pass' | 'warn' | 'fail' | 'info' {
  const sev = maxSeverity(entry);
  if (sev === 'critical' || sev === 'high') return 'fail';
  if (sev === 'medium') return 'warn';
  if (sev) return 'info';
  if (entry.outdated === 'major') return 'fail';
  if (entry.outdated === 'minor') return 'warn';
  if (entry.outdated === 'patch') return 'info';
  return 'pass';
}

type Filter = 'all' | 'outdated' | 'vulnerable';

export function DepsFeature({ packageJson }: DepsFeatureProps) {
  const pkg = useMemo(() => getPackageJson(packageJson), [packageJson]);
  const [entries, setEntries] = useState<DepEntry[]>(() => (pkg ? buildEntries(pkg) : []));
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!pkg) return;
    const list = buildEntries(pkg);
    if (list.length === 0) return;
    let cancelled = false;
    setLoading(true);
    setEntries(list);

    const names = list.map((e) => e.name);

    Promise.all([
      queryOsv(list.map((e) => ({ package: e.name, version: e.current }))),
      fetchNpmInfoBatch(names),
    ])
      .then(([osvMap, npmMap]) => {
        if (cancelled) return;
        setEntries(
          list.map((e) => {
            const npm = npmMap[e.name];
            const vulns = osvMap[`${e.name}@${e.current}`] ?? [];
            const next: DepEntry = { ...e, vulns };
            if (npm) {
              next.latest = npm.latest;
              next.publishedAt = npm.publishedAt;
              const cmp = compareSemver(e.current, npm.latest);
              next.outdated = cmp === 'up-to-date' || cmp === 'ahead' ? null : cmp;
            }
            return next;
          }),
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
            Install <code>@promise-inc/devmode-preview/vite</code> or{' '}
            <code>@promise-inc/devmode-preview/next</code> plugin, or pass <code>packageJson</code>{' '}
            prop.
          </p>
        </div>
      </div>
    );
  }

  const totalOutdated = entries.filter((e) => e.outdated).length;
  const totalVuln = entries.filter((e) => e.vulns.length > 0).length;

  const visible = entries.filter((e) => {
    if (filter === 'outdated') return !!e.outdated;
    if (filter === 'vulnerable') return e.vulns.length > 0;
    return true;
  });

  return (
    <div className="dmp-panel">
      <p className="dmp-panel__intro">
        Scanned via{' '}
        <a
          href="https://osv.dev"
          target="_blank"
          rel="noreferrer noopener"
          style={{ color: 'var(--dmp-accent)' }}
        >
          OSV.dev
        </a>{' '}
        and the npm registry. {loading
          ? 'Loading…'
          : `${entries.length} packages · ${totalOutdated} outdated · ${totalVuln} with vulnerabilities.`}
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
          data-active={filter === 'outdated' ? 'true' : 'false'}
          onClick={() => setFilter('outdated')}
        >
          Outdated ({totalOutdated})
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
          const dot = statusDot(dep);
          const published = dep.publishedAt ? relativeTime(dep.publishedAt) : '';
          return (
            <div key={`${dep.type}:${dep.name}`} className="dmp-check">
              <div className="dmp-check__row">
                <span className="dmp-check__dot" data-status={dot} />
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
                  <p className="dmp-check__value">
                    {dep.current}
                    {dep.latest && dep.latest !== dep.current ? (
                      <>
                        {' '}
                        <span style={{ color: 'var(--dmp-text-mute)' }}>→</span>{' '}
                        <span style={{ color: 'var(--dmp-accent)' }}>{dep.latest}</span>
                      </>
                    ) : null}
                  </p>

                  <div
                    style={{
                      marginTop: 6,
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {dep.outdated ? (
                      <span className="dmp-pill" data-tone={outdatedTone(dep.outdated)}>
                        {outdatedLabel(dep.outdated)}
                      </span>
                    ) : dep.latest ? (
                      <span className="dmp-pill" data-tone="ok">
                        up-to-date
                      </span>
                    ) : null}

                    {published && (
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--dmp-text-mute)',
                          fontFamily: 'var(--dmp-mono)',
                        }}
                        title={dep.publishedAt}
                      >
                        published {published}
                      </span>
                    )}
                  </div>

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

                  {sev === null && !dep.vulns.length && !dep.outdated && dep.latest === undefined && loading && (
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--dmp-text-mute)' }}>
                      checking npm registry…
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {visible.length === 0 && (
          <div className="dmp-empty">
            <p style={{ margin: 0 }}>
              {filter === 'outdated'
                ? 'All dependencies are up-to-date.'
                : filter === 'vulnerable'
                  ? 'No known vulnerabilities.'
                  : 'No dependencies found.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
