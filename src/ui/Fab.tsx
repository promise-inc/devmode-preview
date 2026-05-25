import type { ButtonHTMLAttributes } from 'react';

interface FabProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  position?: 'bottom-right' | 'bottom-left';
}

export function Fab({ position = 'bottom-right', ...rest }: FabProps) {
  return (
    <button
      type="button"
      className="dmp-fab"
      data-position={position}
      aria-label="Open DevMode Preview"
      {...rest}
    >
      <span className="dmp-fab__dot" aria-hidden />
      <span>DEVMODE · PREVIEW</span>
    </button>
  );
}
