import { beforeEach, describe, expect, it } from 'vitest';
import { nsKey, readSession, readStorage, writeSession, writeStorage } from '../../src/core/storage';

function safeClear(store: Storage): void {
  try {
    const keys = Object.keys(store);
    for (const k of keys) store.removeItem(k);
  } catch {
    // ignore
  }
}

describe('storage', () => {
  beforeEach(() => {
    safeClear(window.localStorage);
    safeClear(window.sessionStorage);
  });

  it('namespaces keys with dmp prefix', () => {
    expect(nsKey('theme')).toBe('dmp:theme');
  });

  it('reads and writes localStorage', () => {
    writeStorage('foo', { x: 1 });
    expect(readStorage('foo', null)).toEqual({ x: 1 });
  });

  it('returns fallback when key missing', () => {
    expect(readStorage('missing', 'default')).toBe('default');
  });

  it('reads and writes sessionStorage', () => {
    writeSession('foo', 42);
    expect(readSession('foo', 0)).toBe(42);
  });

  it('returns fallback when JSON invalid', () => {
    window.localStorage.setItem('dmp:bad', '{not json}');
    expect(readStorage<string>('bad', 'fallback')).toBe('fallback');
  });
});
