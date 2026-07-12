declare global {
  interface Window {
    WOW: new () => { init: () => void };
    lucide: { createIcons: () => void };
    gsap: unknown;
    ScrollTrigger: unknown;
    Lenis: new (options?: Record<string, unknown>) => { raf: (time: number) => void };
  }
}

export function initVendorLibraries(): void {
  new window.WOW().init();
  window.lucide.createIcons();

  const lenis = new window.Lenis();
  function raf(time: number) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}
