import { useEffect, useState } from 'react';
import type { ViewportPreset } from '../../types';
import { readStorage, writeStorage } from '../../core/storage';
import { mountViewportIframe, unmountViewportIframe } from './iframe';

const PRESETS: ViewportPreset[] = [
  { id: 'mobile', label: 'Mobile', width: 375 },
  { id: 'tablet', label: 'Tablet', width: 768 },
  { id: 'desktop', label: 'Desktop', width: 1280 },
  { id: 'full', label: 'Full', width: null },
];

const STORAGE_KEY = 'viewport';

export function ViewportFeature() {
  const [active, setActive] = useState<ViewportPreset['id']>(() =>
    readStorage<ViewportPreset['id']>(STORAGE_KEY, 'full'),
  );

  useEffect(() => {
    const preset = PRESETS.find((p) => p.id === active) ?? PRESETS[3];
    if (preset?.width !== null && preset?.width !== undefined) {
      mountViewportIframe(preset.width);
    } else {
      unmountViewportIframe();
    }
    writeStorage(STORAGE_KEY, active);
  }, [active]);

  useEffect(() => {
    return () => {
      unmountViewportIframe();
    };
  }, []);

  return (
    <div className="dmp-panel">
      <p className="dmp-panel__intro">
        Renders your app inside a real iframe at the chosen width. Media queries respond as on
        a real device. Page state is reloaded on switch.
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
