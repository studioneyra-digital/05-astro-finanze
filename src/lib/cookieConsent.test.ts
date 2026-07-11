import { describe, it, expect } from 'vitest';
import { hasAcceptedCookies, acceptCookies, type ConsentStorage } from './cookieConsent';

function createFakeStorage(initial: Record<string, string> = {}): ConsentStorage {
  const store = { ...initial };
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
  };
}

describe('cookieConsent', () => {
  it('reports no consent by default', () => {
    expect(hasAcceptedCookies(createFakeStorage())).toBe(false);
  });

  it('reports consent after acceptCookies is called', () => {
    const storage = createFakeStorage();
    acceptCookies(storage);
    expect(hasAcceptedCookies(storage)).toBe(true);
  });
});
