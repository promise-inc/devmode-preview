import { useEffect, useState } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

interface VitalsState {
  LCP?: number;
  INP?: number;
  CLS?: number;
  FCP?: number;
  TTFB?: number;
}

const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  INP: { good: 200, poor: 500 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

type MetricKey = keyof typeof THRESHOLDS;

function statusFor(name: MetricKey, value: number): 'pass' | 'warn' | 'fail' {
  const t = THRESHOLDS[name];
  if (value <= t.good) return 'pass';
  if (value <= t.poor) return 'warn';
  return 'fail';
}

function format(name: MetricKey, value: number | undefined): string {
  if (value === undefined) return '—';
  if (name === 'CLS') return value.toFixed(3);
  return `${Math.round(value)} ms`;
}

interface ResourceStat {
  type: string;
  count: number;
  bytes: number;
}

function collectResources(): ResourceStat[] {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const map = new Map<string, ResourceStat>();
  for (const e of entries) {
    const key = e.initiatorType || 'other';
    const cur = map.get(key) ?? { type: key, count: 0, bytes: 0 };
    cur.count += 1;
    cur.bytes += e.transferSize ?? 0;
    map.set(key, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.bytes - a.bytes);
}

function countLazyImageIssues(): number {
  const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('img'));
  return imgs.filter((img) => img.loading !== 'lazy' && img.loading !== 'eager').length;
}

function countBlockingScripts(): number {
  const scripts = Array.from(document.head.querySelectorAll<HTMLScriptElement>('script[src]'));
  return scripts.filter((s) => !s.async && !s.defer && s.type !== 'module').length;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function PerformanceFeature() {
  const [vitals, setVitals] = useState<VitalsState>({});
  const [resources, setResources] = useState<ResourceStat[]>([]);
  const [lazyIssues, setLazyIssues] = useState(0);
  const [blocking, setBlocking] = useState(0);

  useEffect(() => {
    const update = (m: Metric) =>
      setVitals((prev) => ({ ...prev, [m.name as keyof VitalsState]: m.value }));
    onLCP(update);
    onINP(update);
    onCLS(update);
    onFCP(update);
    onTTFB(update);

    const refresh = () => {
      setResources(collectResources());
      setLazyIssues(countLazyImageIssues());
      setBlocking(countBlockingScripts());
    };
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalBytes = resources.reduce((acc, r) => acc + r.bytes, 0);
  const totalCount = resources.reduce((acc, r) => acc + r.count, 0);

  return (
    <div className="dmp-panel">
      <p className="dmp-panel__intro">
        Real-time Web Vitals and runtime resource metrics. Thresholds from Google&apos;s
        <code> web.dev/vitals</code>.
      </p>

      <div className="dmp-section">
        <p className="dmp-section__title">Core Web Vitals</p>
        <div className="dmp-grid">
          {(['LCP', 'INP', 'CLS', 'FCP', 'TTFB'] as const).map((name) => {
            const value = vitals[name];
            const status = value !== undefined ? statusFor(name, value) : undefined;
            return (
              <div key={name} className="dmp-metric">
                <p className="dmp-metric__label">{name}</p>
                <p className="dmp-metric__value" data-status={status}>
                  {format(name, value)}
                </p>
                <p className="dmp-metric__hint">
                  good ≤ {THRESHOLDS[name].good}
                  {name === 'CLS' ? '' : 'ms'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dmp-section">
        <p className="dmp-section__title">Page audit</p>
        <div className="dmp-stack">
          <div className="dmp-row">
            <span className="dmp-row__label">Images without lazy loading</span>
            <span className="dmp-pill" data-tone={lazyIssues > 3 ? 'warn' : 'ok'}>
              {lazyIssues}
            </span>
          </div>
          <div className="dmp-row">
            <span className="dmp-row__label">Blocking scripts in &lt;head&gt;</span>
            <span className="dmp-pill" data-tone={blocking > 0 ? 'warn' : 'ok'}>
              {blocking}
            </span>
          </div>
        </div>
      </div>

      <div className="dmp-section">
        <p className="dmp-section__title">
          Resources · {totalCount} requests · {formatBytes(totalBytes)}
        </p>
        <div className="dmp-stack">
          {resources.map((r) => (
            <div key={r.type} className="dmp-row">
              <span className="dmp-row__label">{r.type}</span>
              <span className="dmp-row__value">
                {r.count} · {formatBytes(r.bytes)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
