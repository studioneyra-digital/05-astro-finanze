import { describe, it, expect } from 'vitest';
import { validateContactForm, type ContactFormValues } from './contactFormValidation';

const validValues: ContactFormValues = {
  firstName: 'Ana',
  lastName: 'Torres',
  phone: '+51987654321',
  email: 'ana@finanze.com',
  message: 'Quisiera más información sobre sus servicios.',
};

describe('validateContactForm', () => {
  it('accepts fully valid values', () => {
    const result = validateContactForm(validValues);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('flags a missing first name', () => {
    const result = validateContactForm({ ...validValues, firstName: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.firstName).toBeDefined();
  });

  it('flags an invalid email', () => {
    const result = validateContactForm({ ...validValues, email: 'not-an-email' });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it('flags an invalid phone', () => {
    const result = validateContactForm({ ...validValues, phone: 'abc' });
    expect(result.valid).toBe(false);
    expect(result.errors.phone).toBeDefined();
  });

  it('flags an empty message', () => {
    const result = validateContactForm({ ...validValues, message: '   ' });
    expect(result.valid).toBe(false);
    expect(result.errors.message).toBeDefined();
  });
});
