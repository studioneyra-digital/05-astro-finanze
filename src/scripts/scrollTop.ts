import { shouldShowScrollTop } from '../lib/scrollTop';

export function initScrollTop(button: HTMLElement): void {
  const updateVisibility = () => {
    button.classList.toggle('is-visible', shouldShowScrollTop(window.scrollY));
  };
  updateVisibility();
  window.addEventListener('scroll', updateVisibility, { passive: true });
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
