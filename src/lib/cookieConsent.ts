export type ConsentStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'finanze:cookie-consent';

export function hasAcceptedCookies(storage: ConsentStorage): boolean {
  return storage.getItem(STORAGE_KEY) === 'accepted';
}

export function acceptCookies(storage: ConsentStorage): void {
  storage.setItem(STORAGE_KEY, 'accepted');
}
