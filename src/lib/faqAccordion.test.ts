import { describe, it, expect } from 'vitest';
import { toggleFaqItem } from './faqAccordion';

describe('toggleFaqItem', () => {
  it('opens a closed item when none is open', () => {
    expect(toggleFaqItem(null, 2)).toBe(2);
  });

  it('closes the currently open item when clicked again', () => {
    expect(toggleFaqItem(2, 2)).toBe(null);
  });

  it('switches to a different item, closing the previous one (one-open-at-a-time)', () => {
    expect(toggleFaqItem(0, 3)).toBe(3);
  });
});
