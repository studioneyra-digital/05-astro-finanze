export function isNavScrolled(scrollY: number, threshold = 60): boolean {
  return scrollY >= threshold;
}
