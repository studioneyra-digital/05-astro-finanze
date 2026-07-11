import { validateEmail } from './validateEmail';
import { validatePhone } from './validatePhone';

export interface ContactFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
}

export interface ContactFormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  message?: string;
}

export interface ContactFormResult {
  valid: boolean;
  errors: ContactFormErrors;
}

export function validateContactForm(values: ContactFormValues): ContactFormResult {
  const errors: ContactFormErrors = {};

  if (!values.firstName.trim()) errors.firstName = 'Ingresa tu nombre.';
  if (!values.lastName.trim()) errors.lastName = 'Ingresa tu apellido.';
  if (!validatePhone(values.phone)) errors.phone = 'Ingresa un teléfono válido.';
  if (!validateEmail(values.email)) errors.email = 'Ingresa un correo válido.';
  if (!values.message.trim()) errors.message = 'Escribe un mensaje.';

  return { valid: Object.keys(errors).length === 0, errors };
}
