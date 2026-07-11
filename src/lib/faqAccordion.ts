export function toggleFaqItem(openIndex: number | null, clickedIndex: number): number | null {
  return openIndex === clickedIndex ? null : clickedIndex;
}
