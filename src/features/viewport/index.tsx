import { useEffect, useState } from 'react';
import type { ViewportPreset } from '../../types';
import { readStorage, writeStorage } from '../../core/storage';

const PRESETS: ViewportPreset[] = [
  { id: 'mobile', label: 'Mobile', width: 375 },
  { id: 'tablet', label: 'Tablet', width: 768 },
  { id: 'desktop', label: 'Desktop', width: 1280 },
  { id: 'full', label: 'Full', width: null },
];

const STORAGE_KEY = 'viewport';
const STYLE_ID = 'dmp-viewport-style';

function applyViewport(width: number | null): void {
  if (typeof document === 'undefined') return;

  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }

  if (width === null) {
    style.textContent = '';
    return;
  }

  style.textContent = `
    html { background: #0a0a0a; }
    body {
      max-width: ${width}px !important;
      margin-left: auto !important;
      margin-right: auto !important;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.05), 0 0 60px -10px rgba(0,0,0,0.6) !important;
      min-height: 100vh;
    }
  `;
}

export function ViewportFeature() {
  const [active, setActive] = useState<ViewportPreset['id']>(() =>
    readStorage<ViewportPreset['id']>(STORAGE_KEY, 'full'),
  );

  useEffect(() => {
    const preset = PRESETS.find((p) => p.id === active) ?? PRESETS[3];
    applyViewport(preset?.width ?? null);
    writeStorage(STORAGE_KEY, active);
  }, [active]);

  useEffect(() => {
    return () => {
      const style = document.getElementById(STYLE_ID);
      style?.remove();
    };
  }, []);

  return (
    <div className="dmp-panel">
      <p className="dmp-panel__intro">
        Visually constrains the page width. For accurate breakpoint testing (hover/touch/real
        media queries), use the browser&apos;s Device Mode.
      </p>
      <div className="dmp-grid">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className="dmp-card"
            data-active={active === preset.id ? 'true' : 'false'}
            onClick={() => setActive(preset.id)}
          >
            <p className="dmp-card__title">{preset.label}</p>
            <p className="dmp-card__meta">
              {preset.width === null ? '100%' : `${preset.width}px`}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
