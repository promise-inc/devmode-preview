import type { ThemeMode } from '../types';
import { readStorage, writeStorage } from './storage';

const THEME_KEY = 'theme';

export function getInitialTheme(initial: ThemeMode = 'auto'): ThemeMode {
  return readStorage<ThemeMode>(THEME_KEY, initial);
}

export function persistTheme(theme: ThemeMode): void {
  writeStorage(THEME_KEY, theme);
}

export function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode !== 'auto') return mode;
  if (typeof window === 'undefined') return 'dark';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export function watchSystemTheme(onChange: (t: 'dark' | 'light') => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => onChange(e.matches ? 'dark' : 'light');
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}
