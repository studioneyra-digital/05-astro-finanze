export function shouldShowScrollTop(scrollY: number, threshold = 400): boolean {
  return scrollY >= threshold;
}
