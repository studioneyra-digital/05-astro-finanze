import { togglePeriod, type BillingPeriod } from '../lib/pricingToggle';

export function initPricingToggle(root: HTMLElement): void {
  let period: BillingPeriod = 'monthly';
  const switchBtn = root.querySelector<HTMLButtonElement>('.pricing-toggle__switch');
  const labels = Array.from(root.querySelectorAll<HTMLElement>('.pricing-toggle__label'));
  const priceViews = Array.from(root.querySelectorAll<HTMLElement>('.pricing-tab-item__price-view'));

  function render() {
    labels.forEach((label) => {
      label.classList.toggle('is-active', label.dataset.period === period);
    });
    priceViews.forEach((view) => {
      view.classList.toggle('is-active', view.dataset.period === period);
    });
    switchBtn?.setAttribute('aria-checked', String(period === 'yearly'));
  }

  switchBtn?.addEventListener('click', () => {
    period = togglePeriod(period);
    render();
  });

  render();
}
