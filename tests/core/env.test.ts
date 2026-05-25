import { describe, expect, it } from 'vitest';
import { isBrowser, isProduction, shouldRender } from '../../src/core/env';

describe('env', () => {
  it('detects browser environment in jsdom', () => {
    expect(isBrowser()).toBe(true);
  });

  it('shouldRender returns true when not production', () => {
    expect(shouldRender(undefined)).toBe(true);
  });

  it('isProduction reflects NODE_ENV', () => {
    expect(isProduction()).toBe(false);
  });
});
