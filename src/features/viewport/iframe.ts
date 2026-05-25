import { VIEWPORT_IFRAME_FLAG } from '../../core/env';

const HOST_ID = 'dmp-viewport-host';

function buildIframeUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set(VIEWPORT_IFRAME_FLAG, '1');
  return url.toString();
}

export interface IframeMount {
  iframe: HTMLIFrameElement;
  destroy: () => void;
}

export function mountViewportIframe(width: number): IframeMount | null {
  if (typeof document === 'undefined') return null;

  const existing = getViewportIframe();
  if (existing && existing.getAttribute('data-dmp-width') === String(width)) {
    return {
      iframe: existing,
      destroy: () => unmountViewportIframe(),
    };
  }

  unmountViewportIframe();

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.setAttribute('aria-label', 'DevMode Preview viewport simulation');
  host.style.cssText = [
    'position:fixed',
    'inset:0',
    'background:#0a0a0a',
    'z-index:2147483640',
    'display:flex',
    'align-items:stretch',
    'justify-content:center',
    'padding:16px 16px 16px 16px',
  ].join(';');

  const frame = document.createElement('iframe');
  frame.name = VIEWPORT_IFRAME_FLAG;
  frame.src = buildIframeUrl();
  frame.title = 'DevMode Preview viewport';
  frame.setAttribute('data-dmp-viewport-iframe', '');
  frame.setAttribute('data-dmp-width', String(width));
  frame.style.cssText = [
    `width:${width}px`,
    'max-width:100%',
    'height:100%',
    'border:0',
    'background:#ffffff',
    'border-radius:10px',
    'box-shadow:0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px -10px rgba(0,0,0,0.6)',
    'display:block',
  ].join(';');

  host.appendChild(frame);
  document.documentElement.appendChild(host);

  document.documentElement.style.overflow = 'hidden';

  return {
    iframe: frame,
    destroy: () => {
      host.remove();
      document.documentElement.style.overflow = '';
    },
  };
}

export function unmountViewportIframe(): void {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById(HOST_ID);
  if (existing) existing.remove();
  document.documentElement.style.overflow = '';
}

export function getViewportIframe(): HTMLIFrameElement | null {
  if (typeof document === 'undefined') return null;
  const host = document.getElementById(HOST_ID);
  return host?.querySelector<HTMLIFrameElement>('iframe[data-dmp-viewport-iframe]') ?? null;
}
