import { VIEWPORT_IFRAME_FLAG } from '../../core/env';

const HOST_ID = 'dmp-viewport-host';

type DeviceKind = 'mobile' | 'tablet' | 'desktop';

interface DeviceSpec {
  kind: DeviceKind;
  name: string;
  height: number;
}

function classify(width: number): DeviceSpec {
  if (width <= 480) return { kind: 'mobile', name: 'iPhone', height: 812 };
  if (width <= 900) return { kind: 'tablet', name: 'iPad', height: 1024 };
  return { kind: 'desktop', name: 'Desktop', height: 800 };
}

function buildIframeUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.set(VIEWPORT_IFRAME_FLAG, '1');
  return url.toString();
}

export interface IframeMount {
  iframe: HTMLIFrameElement;
  destroy: () => void;
}

const SCROLLBAR_CSS = `
  ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
  html, body { scrollbar-width: none !important; -ms-overflow-style: none !important; }
`;

function injectScrollbarHider(iframe: HTMLIFrameElement): void {
  try {
    const doc = iframe.contentDocument;
    if (!doc) return;
    if (doc.querySelector('style[data-dmp-injected]')) return;
    const style = doc.createElement('style');
    style.setAttribute('data-dmp-injected', '');
    style.textContent = SCROLLBAR_CSS;
    doc.head.appendChild(style);
  } catch {
    // cross-origin
  }
}

function buildDevice(width: number, spec: DeviceSpec): {
  device: HTMLDivElement;
  frameSlot: HTMLDivElement;
  bezelPadding: { x: number; y: number };
  outerRadius: number;
  innerRadius: number;
} {
  const device = document.createElement('div');
  device.setAttribute('data-dmp-device', spec.kind);

  let bezelX = 14;
  let bezelY = 16;
  let outerRadius = 52;
  let innerRadius = 40;

  if (spec.kind === 'tablet') {
    bezelX = 20;
    bezelY = 24;
    outerRadius = 30;
    innerRadius = 14;
  } else if (spec.kind === 'desktop') {
    bezelX = 0;
    bezelY = 0;
    outerRadius = 12;
    innerRadius = 10;
  }

  device.style.cssText = [
    'position:relative',
    'display:flex',
    'align-items:stretch',
    'justify-content:center',
    `padding:${bezelY}px ${bezelX}px`,
    `border-radius:${outerRadius}px`,
    spec.kind === 'desktop'
      ? 'background:transparent'
      : 'background:#0a0a0a',
    spec.kind === 'desktop'
      ? 'box-shadow:0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px -10px rgba(0,0,0,0.6)'
      : 'box-shadow:inset 0 0 0 1px rgba(255,255,255,0.08), 0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,0,0,0.6)',
  ].join(';');

  const frameSlot = document.createElement('div');
  frameSlot.style.cssText = [
    'position:relative',
    `width:${width}px`,
    'max-width:100%',
    `border-radius:${innerRadius}px`,
    'overflow:hidden',
    'background:#ffffff',
    'display:flex',
  ].join(';');
  device.appendChild(frameSlot);

  if (spec.kind === 'mobile') {
    const island = document.createElement('div');
    island.style.cssText = [
      'position:absolute',
      'top:10px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:108px',
      'height:28px',
      'background:#000',
      'border-radius:14px',
      'z-index:3',
      'pointer-events:none',
    ].join(';');
    frameSlot.appendChild(island);

    const indicator = document.createElement('div');
    indicator.style.cssText = [
      'position:absolute',
      'bottom:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:134px',
      'height:5px',
      'background:rgba(255,255,255,0.85)',
      'border-radius:3px',
      'z-index:3',
      'pointer-events:none',
      'mix-blend-mode:difference',
    ].join(';');
    frameSlot.appendChild(indicator);
  } else if (spec.kind === 'tablet') {
    const camera = document.createElement('div');
    camera.style.cssText = [
      'position:absolute',
      'top:8px',
      'left:50%',
      'transform:translateX(-50%)',
      'width:8px',
      'height:8px',
      'background:#1a1a1a',
      'border-radius:50%',
      'z-index:3',
      'pointer-events:none',
      'box-shadow:inset 0 0 0 1px rgba(255,255,255,0.1)',
    ].join(';');
    frameSlot.appendChild(camera);
  }

  return {
    device,
    frameSlot,
    bezelPadding: { x: bezelX, y: bezelY },
    outerRadius,
    innerRadius,
  };
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

  const spec = classify(width);

  const host = document.createElement('div');
  host.id = HOST_ID;
  host.setAttribute('aria-label', 'DevMode Preview viewport simulation');
  host.style.cssText = [
    'position:fixed',
    'inset:0',
    'background:radial-gradient(ellipse at center, #16181a 0%, #050607 100%)',
    'z-index:2147483640',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'justify-content:center',
    'padding:24px',
    'gap:14px',
    'overflow:hidden',
  ].join(';');

  const { device, frameSlot } = buildDevice(width, spec);

  const availH = Math.max(320, window.innerHeight - 120);
  const desiredH = Math.min(spec.height + (spec.kind === 'desktop' ? 0 : 32), availH);
  device.style.height = `${desiredH}px`;

  const frame = document.createElement('iframe');
  frame.name = VIEWPORT_IFRAME_FLAG;
  frame.src = buildIframeUrl();
  frame.title = 'DevMode Preview viewport';
  frame.setAttribute('data-dmp-viewport-iframe', '');
  frame.setAttribute('data-dmp-width', String(width));
  frame.style.cssText = [
    'width:100%',
    'height:100%',
    'border:0',
    'background:#ffffff',
    'display:block',
  ].join(';');

  frame.addEventListener('load', () => injectScrollbarHider(frame));
  frameSlot.appendChild(frame);

  const label = document.createElement('div');
  label.style.cssText = [
    'font-family:ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace',
    'font-size:11px',
    'color:rgba(255,255,255,0.42)',
    'letter-spacing:0.04em',
    'margin-top:4px',
    'user-select:none',
  ].join(';');
  label.textContent = `${spec.name} · ${width} × ${spec.height} · real iframe`;

  host.appendChild(device);
  host.appendChild(label);
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
