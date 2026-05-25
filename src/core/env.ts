declare const process: { env: { NODE_ENV?: string } } | undefined;

export function isProduction(): boolean {
  try {
    return typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
  } catch {
    return false;
  }
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

export const VIEWPORT_IFRAME_FLAG = '__dmp_viewport';

export function isInsideOwnIframe(): boolean {
  if (!isBrowser()) return false;
  try {
    if (window.self === window.top) return false;
    if (window.name === VIEWPORT_IFRAME_FLAG) return true;
    const params = new URLSearchParams(window.location.search);
    return params.has(VIEWPORT_IFRAME_FLAG);
  } catch {
    return false;
  }
}

export function shouldRender(enableInProduction: boolean | undefined): boolean {
  if (!isBrowser()) return false;
  if (isProduction() && !enableInProduction) return false;
  if (isInsideOwnIframe()) return false;
  return true;
}
