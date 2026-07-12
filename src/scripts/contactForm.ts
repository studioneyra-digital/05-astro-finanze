import { validateContactForm, type ContactFormValues } from '../lib/contactFormValidation';

export function initContactForm(form: HTMLFormElement): void {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const values: ContactFormValues = {
      firstName: String(data.get('firstName') ?? ''),
      lastName: String(data.get('lastName') ?? ''),
      phone: String(data.get('phone') ?? ''),
      email: String(data.get('email') ?? ''),
      message: String(data.get('message') ?? ''),
    };
    const result = validateContactForm(values);
    const successAlert = form.querySelector<HTMLElement>('[data-form-success]');
    const errorAlert = form.querySelector<HTMLElement>('[data-form-error]');
    const errorMessage = errorAlert?.querySelector<HTMLElement>('.alert__desc');
    if (!successAlert || !errorAlert || !errorMessage) return;

    if (result.valid) {
      successAlert.hidden = false;
      errorAlert.hidden = true;
      // TODO: send `values` to a real backend/email service once one is chosen.
      form.reset();
    } else {
      errorMessage.textContent = Object.values(result.errors).join(' ');
      errorAlert.hidden = false;
      successAlert.hidden = true;
    }
  });
}
