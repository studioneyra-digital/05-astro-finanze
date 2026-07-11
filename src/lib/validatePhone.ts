const PHONE_PATTERN = /^\+?[\d\s-]{7,}$/;

export function validatePhone(phone: string): boolean {
  const digitCount = phone.replace(/\D/g, '').length;
  return PHONE_PATTERN.test(phone) && digitCount >= 7;
}
