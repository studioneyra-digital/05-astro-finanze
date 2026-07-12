import { describe, it, expect } from 'vitest';
import { togglePeriod } from './pricingToggle';

describe('togglePeriod', () => {
  it('switches monthly to yearly', () => {
    expect(togglePeriod('monthly')).toBe('yearly');
  });

  it('switches yearly to monthly', () => {
    expect(togglePeriod('yearly')).toBe('monthly');
  });
});
