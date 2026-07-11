import { describe, it, expect } from 'vitest';
import { validatePhone } from './validatePhone';

describe('validatePhone', () => {
  it('accepts digits with a leading +', () => {
    expect(validatePhone('+51987654321')).toBe(true);
  });

  it('accepts digits with spaces and dashes', () => {
    expect(validatePhone('987-654-321')).toBe(true);
  });

  it('rejects letters', () => {
    expect(validatePhone('abc123')).toBe(false);
  });

  it('rejects strings shorter than 7 digits', () => {
    expect(validatePhone('12345')).toBe(false);
  });
});
