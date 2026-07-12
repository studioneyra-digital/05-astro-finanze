import { validateEmail } from '../lib/validateEmail';

export function initNewsletter(form: HTMLFormElement): void {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.querySelector<HTMLInputElement>('.newsletter__input');
    const email = input?.value ?? '';
    const successAlert = form.querySelector<HTMLElement>('[data-newsletter-success]');
    const errorAlert = form.querySelector<HTMLElement>('[data-newsletter-error]');
    if (!successAlert || !errorAlert) return;

    if (validateEmail(email)) {
      successAlert.hidden = false;
      errorAlert.hidden = true;
      // TODO: send `email` to a real newsletter provider once one is chosen.
      form.reset();
    } else {
      errorAlert.hidden = false;
      successAlert.hidden = true;
    }
  });
}
