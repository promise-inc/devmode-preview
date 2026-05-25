import type { ViewportPreset } from '../types';
import { IconDesktop, IconFull, IconMobile, IconTablet } from './icons';

interface FabProps {
  position?: 'bottom-right' | 'bottom-left';
  onOpen: () => void;
  activeViewport: ViewportPreset['id'];
  onViewportChange: (id: ViewportPreset['id']) => void;
}

const SHORTCUTS: Array<{ id: ViewportPreset['id']; label: string; Icon: typeof IconMobile }> = [
  { id: 'mobile', label: 'Mobile · 375', Icon: IconMobile },
  { id: 'tablet', label: 'Tablet · 768', Icon: IconTablet },
  { id: 'desktop', label: 'Desktop · 1280', Icon: IconDesktop },
  { id: 'full', label: 'Full width', Icon: IconFull },
];

export function Fab({ position = 'bottom-right', onOpen, activeViewport, onViewportChange }: FabProps) {
  return (
    <div className="dmp-fab" data-position={position} role="group" aria-label="DevMode Preview">
      <button
        type="button"
        className="dmp-fab__label"
        onClick={onOpen}
        aria-label="Open DevMode Preview"
      >
        <span className="dmp-fab__dot" aria-hidden />
        <span>DEVMODE</span>
      </button>
      <div className="dmp-fab__shortcuts" aria-label="Viewport shortcuts">
        {SHORTCUTS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className="dmp-fab__shortcut"
            data-active={activeViewport === id ? 'true' : 'false'}
            onClick={() => onViewportChange(id)}
            aria-label={label}
            title={label}
            aria-pressed={activeViewport === id}
          >
            <Icon />
          </button>
        ))}
      </div>
    </div>
  );
}
