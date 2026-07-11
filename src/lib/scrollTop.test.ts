import { describe, it, expect } from 'vitest';
import { shouldShowScrollTop } from './scrollTop';

describe('shouldShowScrollTop', () => {
  it('is false near the top', () => {
    expect(shouldShowScrollTop(0)).toBe(false);
    expect(shouldShowScrollTop(399)).toBe(false);
  });

  it('is true past the default 400px threshold', () => {
    expect(shouldShowScrollTop(400)).toBe(true);
    expect(shouldShowScrollTop(2000)).toBe(true);
  });

  it('respects a custom threshold', () => {
    expect(shouldShowScrollTop(100, 50)).toBe(true);
  });
});
