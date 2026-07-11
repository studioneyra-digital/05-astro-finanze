import { describe, it, expect } from 'vitest';
import { getActiveTab } from './pricingTabs';

describe('getActiveTab', () => {
  const tabIds = ['basic', 'pro', 'enterprise'];

  it('returns the requested tab when it exists', () => {
    expect(getActiveTab(tabIds, 'pro', 'basic')).toBe('pro');
  });

  it('falls back when the requested tab id is unknown', () => {
    expect(getActiveTab(tabIds, 'nonexistent', 'basic')).toBe('basic');
  });
});
