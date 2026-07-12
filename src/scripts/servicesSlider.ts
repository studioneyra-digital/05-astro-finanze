declare global {
  interface Window {
    Swiper: new (el: string, options: Record<string, unknown>) => unknown;
  }
}

export function initServicesSlider(): void {
  new window.Swiper('.services-slider__swiper', {
    slidesPerView: 1,
    spaceBetween: 24,
    breakpoints: {
      768: { slidesPerView: 2 },
      1024: { slidesPerView: 4 },
    },
  });
}
