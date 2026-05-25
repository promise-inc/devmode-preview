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

export function shouldRender(enableInProduction: boolean | undefined): boolean {
  if (!isBrowser()) return false;
  if (isProduction() && !enableInProduction) return false;
  return true;
}
