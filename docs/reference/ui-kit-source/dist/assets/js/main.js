let lenisInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  initSmoothScroll();
  initFaqAccordion();
  initPricingToggle();
  initHeroSlider();
  initNavbarElite();
  initNavbarScroll();
  initKitSidebarScrollSpy();
  initKitSnippetCopy();
  initProjectsSlider();
  initServicesSlider();
  initAlerts();
  initScrollTop();
  initTabs();
});

// Scroll suavizado (Lenis) para toda la página. Respeta reduced-motion y
// se degrada solo si lenis.min.js no está cargado (ej. páginas del UI Kit).
// lenisInstance queda expuesta para que initScrollTop() la reutilice.
function initSmoothScroll() {
  if (typeof Lenis === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  lenisInstance = new Lenis({ anchors: true });

  function raf(time) {
    lenisInstance.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

// Acordeón FAQ: un solo item abierto a la vez; click de nuevo lo cierra.
function initFaqAccordion() {
  document.querySelectorAll('.faq-item__question').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      const list = item.closest('.faq-list');
      const wasActive = item.classList.contains('is-active');

      list.querySelectorAll('.faq-item.is-active').forEach((openItem) => {
        openItem.classList.remove('is-active');
        openItem.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false');
      });

      if (!wasActive) {
        item.classList.add('is-active');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// Switch Monthly/Yearly: alterna el precio visible en cada .pricing-tab-item
// del mismo .pricing-toggle-group.
function initPricingToggle() {
  document.querySelectorAll('.pricing-toggle__switch').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const group = toggle.closest('.pricing-toggle-group');
      const isYearly = toggle.getAttribute('aria-checked') !== 'true';
      toggle.setAttribute('aria-checked', String(isYearly));

      const period = isYearly ? 'yearly' : 'monthly';

      group.querySelectorAll('.pricing-toggle__label').forEach((label) => {
        label.classList.toggle('is-active', label.dataset.period === period);
      });

      group.querySelectorAll('.pricing-tab-item__price-view').forEach((view) => {
        view.classList.toggle('is-active', view.dataset.period === period);
      });
    });
  });
}

// Hero Elite Slider: la paginación vive en el footer fijo (fuera del
// swiper), no dentro de cada slide.
function initHeroSlider() {
  document.querySelectorAll('.hero-elite-slider').forEach((hero) => {
    const swiperEl = hero.querySelector('.hero-elite-slider__swiper');
    const paginationEl = hero.querySelector('.hero-elite-slider__pagination');
    if (!swiperEl || typeof Swiper === 'undefined') return;

    new Swiper(swiperEl, {
      loop: true,
      effect: 'fade',
      fadeEffect: { crossFade: true },
      autoplay: { delay: 5500, disableOnInteraction: false },
      pagination: { el: paginationEl, clickable: true },
    });
  });
}

// Navbar Elite: dropdowns de escritorio (click) + menú off-canvas
// mobile con submenús tipo acordeón.
function initNavbarElite() {
  document.querySelectorAll('.navbar-elite').forEach((navbar) => {
    navbar.querySelectorAll('.navbar-elite__item--dropdown > .navbar-elite__link').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.navbar-elite__item--dropdown');
        const wasOpen = item.classList.contains('is-open');

        navbar.querySelectorAll('.navbar-elite__item--dropdown.is-open').forEach((openItem) => {
          openItem.classList.remove('is-open');
          openItem.querySelector('.navbar-elite__link').setAttribute('aria-expanded', 'false');
        });

        if (!wasOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    const toggle = navbar.querySelector('.navbar-elite__toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const isOpen = navbar.classList.toggle('is-menu-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
      });
    }

    navbar.querySelectorAll('.navbar-elite__mobile-item').forEach((item) => {
      const link = item.querySelector(':scope > .navbar-elite__mobile-link');
      const submenu = item.querySelector(':scope > .navbar-elite__mobile-submenu');
      if (!link || !submenu) return;

      link.addEventListener('click', () => {
        const wasOpen = item.classList.contains('is-open');
        const parentList = item.parentElement;

        parentList.querySelectorAll(':scope > .navbar-elite__mobile-item.is-open').forEach((openItem) => {
          openItem.classList.remove('is-open');
        });

        item.classList.toggle('is-open', !wasOpen);
      });
    });
  });

  document.addEventListener('click', (event) => {
    document.querySelectorAll('.navbar-elite__item--dropdown.is-open').forEach((item) => {
      if (!item.contains(event.target)) {
        item.classList.remove('is-open');
        item.querySelector('.navbar-elite__link').setAttribute('aria-expanded', 'false');
      }
    });
  });
}

// Navbar Elite al scrollear: pasado el umbral (100px) cambia de la barra
// transparente sobre el hero a una versión sólida fija arriba, con una
// animación CSS de entrada (ver .navbar-elite.is-scrolled en main.css).
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar-elite');
  if (!navbar) return;

  const SCROLL_THRESHOLD = 100;

  const toggleScrolled = () => {
    navbar.classList.toggle('is-scrolled', window.scrollY > SCROLL_THRESHOLD);
  };

  window.addEventListener('scroll', toggleScrolled, { passive: true });
  toggleScrolled();
}

// Sidebar del UI Kit (ui-kit2.html): marca .is-active en el link cuya
// sección está más visible, a medida que las secciones existan en el DOM.
function initKitSidebarScrollSpy() {
  const sidebar = document.querySelector('.kit-sidebar');
  if (!sidebar) return;

  const links = sidebar.querySelectorAll('.kit-sidebar__link');
  const sections = [...links]
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (!sections.length) return;

  const setActive = (id) => {
    links.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting);
      if (visible.length) setActive(visible[0].target.id);
    },
    { rootMargin: '-10% 0px -70% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}

// Botón "Copiar" de los snippets del UI Kit: copia el texto del <code>
// al portapapeles y muestra una confirmación breve en el propio botón.
function initKitSnippetCopy() {
  document.querySelectorAll('.kit-snippet__copy').forEach((button) => {
    const code = button.closest('.kit-snippet').querySelector('code');
    if (!code) return;

    const defaultLabel = button.textContent;

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = 'Copiado';
        button.classList.add('is-copied');
        setTimeout(() => {
          button.textContent = defaultLabel;
          button.classList.remove('is-copied');
        }, 1800);
      } catch (error) {
        button.textContent = 'Error al copiar';
      }
    });
  });
}

// Projects Slider: carrusel Swiper cuyo contenido son .card-project-item;
// slidesPerView crece por breakpoint (1.15 mobile → 3 en desktop).
function initProjectsSlider() {
  document.querySelectorAll('.projects-slider').forEach((wrap) => {
    const swiperEl = wrap.querySelector('.projects-slider__swiper');
    const paginationEl = wrap.querySelector('.projects-slider__pagination');
    if (!swiperEl || typeof Swiper === 'undefined') return;

    new Swiper(swiperEl, {
      slidesPerView: 1.15,
      spaceBetween: 20,
      pagination: { el: paginationEl, clickable: true },
      breakpoints: {
        576: { slidesPerView: 1.6, spaceBetween: 20 },
        768: { slidesPerView: 2.2, spaceBetween: 24 },
        1200: { slidesPerView: 3, spaceBetween: 24 },
      },
    });
  });
}

// Services Slider: carrusel Swiper cuyo contenido son .card-service-item;
// mismos breakpoints que Projects Slider.
function initServicesSlider() {
  document.querySelectorAll('.services-slider').forEach((wrap) => {
    const swiperEl = wrap.querySelector('.services-slider__swiper');
    const paginationEl = wrap.querySelector('.services-slider__pagination');
    if (!swiperEl || typeof Swiper === 'undefined') return;

    new Swiper(swiperEl, {
      loop: true,
      slidesPerView: 1.15,
      spaceBetween: 20,
      pagination: { el: paginationEl, clickable: true },
      breakpoints: {
        576: { slidesPerView: 1.6, spaceBetween: 20 },
        768: { slidesPerView: 2.2, spaceBetween: 24 },
        1200: { slidesPerView: 3, spaceBetween: 24 },
      },
    });
  });
}

// Alerts: el botón de cierre anima la salida y remueve el elemento
// del DOM al terminar la transición.
function initAlerts() {
  document.querySelectorAll('.alert__close').forEach((button) => {
    button.addEventListener('click', () => {
      const alert = button.closest('.alert');
      if (!alert) return;
      alert.classList.add('is-dismissing');
      alert.addEventListener('transitionend', () => alert.remove(), { once: true });
    });
  });
}

// Scroll-top: muestra el botón pasado un umbral de scroll y hace
// scroll suave al inicio al hacer click.
function initScrollTop() {
  const buttons = document.querySelectorAll('.scroll-top');
  if (!buttons.length) return;

  const toggleVisibility = () => {
    const isVisible = window.scrollY > 400;
    buttons.forEach((button) => button.classList.toggle('is-visible', isVisible));
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      if (lenisInstance) {
        lenisInstance.scrollTo(0);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  window.addEventListener('scroll', toggleVisibility, { passive: true });
  toggleVisibility();
}

// Tabs: un solo .tabs__panel visible a la vez, sincronizado con el
// tab activo dentro del mismo .tabs.
function initTabs() {
  document.querySelectorAll('.tabs').forEach((tabs) => {
    const tabButtons = tabs.querySelectorAll('.tabs__tab');

    tabButtons.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab-target');
        const panel = tabs.querySelector(`#${targetId}`);
        if (!panel) return;

        tabButtons.forEach((btn) => {
          btn.classList.remove('is-active');
          btn.setAttribute('aria-selected', 'false');
        });
        tabs.querySelectorAll('.tabs__panel').forEach((p) => p.classList.remove('is-active'));

        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        panel.classList.add('is-active');
      });
    });
  });
}
