export type BillingPeriod = 'monthly' | 'yearly';

export function togglePeriod(current: BillingPeriod): BillingPeriod {
  return current === 'monthly' ? 'yearly' : 'monthly';
}
