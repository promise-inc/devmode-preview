const NAMESPACE = 'dmp';

export function nsKey(key: string): string {
  return `${NAMESPACE}:${key}`;
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(nsKey(key));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(nsKey(key), JSON.stringify(value));
  } catch {
    // ignore quota / privacy mode
  }
}

export function readSession<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(nsKey(key));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeSession<T>(key: string, value: T): void {
  try {
    sessionStorage.setItem(nsKey(key), JSON.stringify(value));
  } catch {
    // ignore
  }
}
