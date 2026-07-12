declare global {
  interface Window {
    Swiper: new (el: string, options: Record<string, unknown>) => unknown;
  }
}

export function initHeroSlider(): void {
  new window.Swiper('.hero-elite-slider__swiper', {
    loop: true,
    autoplay: { delay: 6000 },
    effect: 'fade',
    pagination: { el: '.hero-elite-slider__pagination', clickable: true },
  });
}
