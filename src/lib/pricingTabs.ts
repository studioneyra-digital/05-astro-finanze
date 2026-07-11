export function getActiveTab(tabIds: string[], requestedId: string, fallbackId: string): string {
  return tabIds.includes(requestedId) ? requestedId : fallbackId;
}
