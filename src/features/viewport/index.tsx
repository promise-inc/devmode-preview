import { useEffect, useState } from 'react';
import type { ViewportPreset } from '../../types';
import { PRESETS, getSavedViewport, setViewport, subscribeViewport } from './state';

export function ViewportFeature() {
  const [active, setActive] = useState<ViewportPreset['id']>(() => getSavedViewport());

  useEffect(() => subscribeViewport((id) => setActive(id)), []);

  const handleSelect = (id: ViewportPreset['id']) => {
    setActive(id);
    setViewport(id);
  };

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
            onClick={() => handleSelect(preset.id)}
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
