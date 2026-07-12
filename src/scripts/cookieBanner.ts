import { hasAcceptedCookies, acceptCookies } from '../lib/cookieConsent';

export function initCookieBanner(wrap: HTMLElement): void {
  if (hasAcceptedCookies(window.localStorage)) {
    wrap.remove();
    return;
  }
  const acceptBtn = wrap.querySelector<HTMLButtonElement>('[data-cookie-accept]');
  const rejectBtn = wrap.querySelector<HTMLButtonElement>('[data-cookie-reject]');
  acceptBtn?.addEventListener('click', () => {
    acceptCookies(window.localStorage);
    wrap.remove();
  });
  rejectBtn?.addEventListener('click', () => {
    wrap.remove();
  });
}
