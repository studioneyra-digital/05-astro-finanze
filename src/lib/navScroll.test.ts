import { describe, it, expect } from 'vitest';
import { isNavScrolled } from './navScroll';

describe('isNavScrolled', () => {
  it('is false at scrollY 0', () => {
    expect(isNavScrolled(0)).toBe(false);
  });

  it('is false just below the default 60px threshold', () => {
    expect(isNavScrolled(59)).toBe(false);
  });

  it('is true at exactly the default threshold', () => {
    expect(isNavScrolled(60)).toBe(true);
  });

  it('respects a custom threshold', () => {
    expect(isNavScrolled(100, 120)).toBe(false);
    expect(isNavScrolled(120, 120)).toBe(true);
  });
});
