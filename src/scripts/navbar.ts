import { isNavScrolled } from '../lib/navScroll';

export function initNavbar(nav: HTMLElement): void {
  const updateScrolledClass = () => {
    nav.classList.toggle('is-scrolled', isNavScrolled(window.scrollY));
  };
  updateScrolledClass();
  window.addEventListener('scroll', updateScrolledClass, { passive: true });

  const toggle = nav.querySelector<HTMLButtonElement>('.navbar-elite__toggle');
  toggle?.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-menu-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
}
