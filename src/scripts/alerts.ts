export function initAlerts(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-alert]').forEach((alert) => {
    const dismissBtn = alert.querySelector<HTMLButtonElement>('[data-alert-dismiss]');
    dismissBtn?.addEventListener('click', () => alert.remove());
  });
}
