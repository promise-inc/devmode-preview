import { VIEWPORT_IFRAME_FLAG } from '../../core/env';

const HOST_ID = 'dmp-viewport-host';

type DeviceKind = 'mobile' | 'tablet' | 'desktop';

interface DeviceSpec {
  kind: DeviceKind;
  name: string;
  height: number;
  safeTop: number;
  safeBottom: number;
}

function classify(width: number): DeviceSpec {
  if (width <= 480) return { kind: 'mobile', name: 'iPhone', height: 812, safeTop: 50, safeBottom: 28 };
  if (width <= 900) return { kind: 'tablet', name: 'iPad', height: 1024, safeTop: 24, safeBottom: 12 };
  return { kind: 'desktop', name: 'Desktop', height: 800, safeTop: 0, safeBottom: 0 };
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

function makeTopBar(spec: DeviceSpec): HTMLDivElement {
  const bar = document.createElement('div');
  bar.style.cssText = [
    `height:${spec.safeTop}px`,
    'background:#000',
    'flex:0 0 auto',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'position:relative',
  ].join(';');

  if (spec.kind === 'mobile') {
    const island = document.createElement('div');
    island.style.cssText = [
      'width:108px',
      'height:28px',
      'background:#0a0a0a',
      'border-radius:14px',
      'box-shadow:inset 0 0 0 1px rgba(255,255,255,0.05)',
    ].join(';');
    bar.appendChild(island);
  } else if (spec.kind === 'tablet') {
    const camera = document.createElement('div');
    camera.style.cssText = [
      'width:7px',
      'height:7px',
      'background:#1a1a1a',
      'border-radius:50%',
      'box-shadow:inset 0 0 0 1px rgba(255,255,255,0.12)',
    ].join(';');
    bar.appendChild(camera);
  }

  return bar;
}

function makeBottomBar(spec: DeviceSpec): HTMLDivElement {
  const bar = document.createElement('div');
  bar.style.cssText = [
    `height:${spec.safeBottom}px`,
    'background:#000',
    'flex:0 0 auto',
    'display:flex',
    'align-items:center',
    'justify-content:center',
  ].join(';');

  if (spec.kind === 'mobile') {
    const indicator = document.createElement('div');
    indicator.style.cssText = [
      'width:134px',
      'height:5px',
      'background:rgba(255,255,255,0.9)',
      'border-radius:3px',
    ].join(';');
    bar.appendChild(indicator);
  }

  return bar;
}

interface DeviceLayout {
  device: HTMLDivElement;
  iframeSlot: HTMLDivElement;
}

function buildDevice(width: number, spec: DeviceSpec): DeviceLayout {
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

  const screen = document.createElement('div');
  screen.style.cssText = [
    `width:${width}px`,
    'max-width:100%',
    `border-radius:${innerRadius}px`,
    'overflow:hidden',
    'background:#000',
    'display:flex',
    'flex-direction:column',
  ].join(';');
  device.appendChild(screen);

  if (spec.safeTop > 0) screen.appendChild(makeTopBar(spec));

  const iframeSlot = document.createElement('div');
  iframeSlot.style.cssText = ['flex:1 1 auto', 'min-height:0', 'display:flex', 'background:#fff'].join(';');
  screen.appendChild(iframeSlot);

  if (spec.safeBottom > 0) screen.appendChild(makeBottomBar(spec));

  return { device, iframeSlot };
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

  const { device, iframeSlot } = buildDevice(width, spec);

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
  iframeSlot.appendChild(frame);

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
