import { toggleFaqItem } from '../lib/faqAccordion';

export function initFaqAccordion(root: HTMLElement): void {
  let openIndex: number | null = 0;
  const items = Array.from(root.querySelectorAll<HTMLElement>('.faq-item'));

  function render() {
    items.forEach((item, index) => {
      const isOpen = index === openIndex;
      item.classList.toggle('is-active', isOpen);
      const question = item.querySelector<HTMLButtonElement>('.faq-item__question');
      question?.setAttribute('aria-expanded', String(isOpen));
    });
  }

  items.forEach((item, index) => {
    const question = item.querySelector<HTMLButtonElement>('.faq-item__question');
    question?.addEventListener('click', () => {
      openIndex = toggleFaqItem(openIndex, index);
      render();
    });
  });

  render();
}
