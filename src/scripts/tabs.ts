import { getActiveTab } from '../lib/pricingTabs';

export function initTabs(root: HTMLElement): void {
  const tabButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('.tabs__tab'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('.tabs__panel'));
  const tabIds = tabButtons.map((button) => button.dataset.tabTarget ?? '');
  let activeId = tabButtons.find((button) => button.classList.contains('is-active'))?.dataset.tabTarget ?? tabIds[0] ?? '';

  function render() {
    tabButtons.forEach((button) => {
      const isActive = button.dataset.tabTarget === activeId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });
    panels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.id === activeId);
    });
  }

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeId = getActiveTab(tabIds, button.dataset.tabTarget ?? '', activeId);
      render();
    });
  });
}
