import { useEffect, useState } from 'react';
import type { TrackerInfo, UtmParams } from '../../types';
import { detectTrackers } from './trackers';

function readUtms(): UtmParams {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') ?? undefined,
    medium: params.get('utm_medium') ?? undefined,
    campaign: params.get('utm_campaign') ?? undefined,
    term: params.get('utm_term') ?? undefined,
    content: params.get('utm_content') ?? undefined,
  };
}

function ogPreview(): { title?: string; description?: string; image?: string; url?: string } {
  const get = (key: string) =>
    document.querySelector<HTMLMetaElement>(`meta[property="${key}"]`)?.content;
  return {
    title: get('og:title'),
    description: get('og:description'),
    image: get('og:image'),
    url: get('og:url'),
  };
}

export function MarketingFeature() {
  const [trackers, setTrackers] = useState<TrackerInfo[]>([]);
  const [utms, setUtms] = useState<UtmParams>({});
  const [og, setOg] = useState<ReturnType<typeof ogPreview>>({});

  useEffect(() => {
    const refresh = () => {
      setTrackers(detectTrackers());
      setUtms(readUtms());
      setOg(ogPreview());
    };
    refresh();
    const t = setInterval(refresh, 2000);
    return () => clearInterval(t);
  }, []);

  const installedCount = trackers.filter((t) => t.installed).length;
  const utmEntries = Object.entries(utms).filter(([, v]) => v);

  return (
    <div className="dmp-panel">
      <p className="dmp-panel__intro">
        Detects marketing trackers, parses UTM campaign tags and previews Open Graph metadata
        without leaving the app.
      </p>

      <div className="dmp-section">
        <p className="dmp-section__title">
          Trackers · {installedCount}/{trackers.length} installed
        </p>
        <div className="dmp-stack">
          {trackers.map((t) => (
            <div key={t.id} className="dmp-row">
              <div>
                <p className="dmp-row__label" style={{ margin: 0 }}>
                  {t.name}
                </p>
                {t.ids && t.ids.length > 0 && (
                  <p className="dmp-row__value" style={{ margin: '2px 0 0' }}>
                    {t.ids.join(', ')}
                  </p>
                )}
              </div>
              <span className="dmp-pill" data-tone={t.installed ? 'ok' : 'info'}>
                {t.installed ? 'Active' : 'Not found'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="dmp-section">
        <p className="dmp-section__title">UTM Parameters</p>
        {utmEntries.length === 0 ? (
          <div className="dmp-empty">
            <p style={{ margin: 0 }}>No UTM parameters in current URL.</p>
          </div>
        ) : (
          <div className="dmp-stack">
            {utmEntries.map(([k, v]) => (
              <div key={k} className="dmp-row">
                <span className="dmp-row__label">utm_{k}</span>
                <span className="dmp-row__value">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dmp-section">
        <p className="dmp-section__title">Open Graph preview</p>
        {!og.title && !og.image ? (
          <div className="dmp-empty">
            <p style={{ margin: 0 }}>No Open Graph tags detected.</p>
          </div>
        ) : (
          <div
            style={{
              border: '1px solid var(--dmp-border-soft)',
              borderRadius: 'var(--dmp-radius-sm)',
              overflow: 'hidden',
              background: 'var(--dmp-bg-elev)',
            }}
          >
            {og.image && (
              <img
                src={og.image}
                alt=""
                style={{
                  width: '100%',
                  aspectRatio: '1.91/1',
                  objectFit: 'cover',
                  display: 'block',
                  background: 'var(--dmp-bg-soft)',
                }}
              />
            )}
            <div style={{ padding: 12 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
                {og.title ?? '(missing og:title)'}
              </p>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 12,
                  color: 'var(--dmp-text-soft)',
                  lineHeight: 1.4,
                }}
              >
                {og.description ?? '(missing og:description)'}
              </p>
              {og.url && (
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: 11,
                    color: 'var(--dmp-text-mute)',
                    fontFamily: 'var(--dmp-mono)',
                  }}
                >
                  {og.url}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
