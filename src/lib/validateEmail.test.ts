import { describe, it, expect } from 'vitest';
import { validateEmail } from './validateEmail';

describe('validateEmail', () => {
  it('accepts a well-formed email', () => {
    expect(validateEmail('ana@finanze.com')).toBe(true);
  });

  it('rejects a missing @', () => {
    expect(validateEmail('ana-finanze.com')).toBe(false);
  });

  it('rejects a missing domain', () => {
    expect(validateEmail('ana@')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});
