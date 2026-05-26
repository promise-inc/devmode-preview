import { useEffect, useRef, type ReactNode } from 'react';
import type { ThemeMode } from '../types';
import { IconAuto, IconClose, IconMoon, IconSun } from './icons';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onCycleTheme: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({ open, onClose, theme, onCycleTheme, children, footer }: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open && drawerRef.current) {
      const firstFocusable = drawerRef.current.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    }
  }, [open]);

  return (
    <>
      <div
        className="dmp-overlay"
        data-open={open ? 'true' : 'false'}
        onClick={onClose}
        aria-hidden
        style={{ visibility: open ? 'visible' : 'hidden' }}
      />
      <div
        ref={drawerRef}
        className="dmp-drawer"
        data-open={open ? 'true' : 'false'}
        role="dialog"
        aria-modal="true"
        aria-label="DevMode Preview"
        style={{ visibility: open ? 'visible' : 'hidden' }}
      >
        <div className="dmp-drawer__header">
          <div className="dmp-drawer__title">
            <span className="dmp-fab__dot" aria-hidden />
            <span>DevMode · Preview</span>
          </div>
          <div className="dmp-drawer__actions">
            <button
              type="button"
              className="dmp-iconbtn"
              onClick={onCycleTheme}
              aria-label={`Theme: ${theme}`}
              title={`Theme: ${theme}`}
            >
              {theme === 'dark' && <IconMoon />}
              {theme === 'light' && <IconSun />}
              {theme === 'auto' && <IconAuto />}
            </button>
            <button
              type="button"
              className="dmp-iconbtn"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <IconClose />
            </button>
          </div>
        </div>
        {children}
        {footer ? <div className="dmp-panel__footer">{footer}</div> : null}
      </div>
    </>
  );
}
