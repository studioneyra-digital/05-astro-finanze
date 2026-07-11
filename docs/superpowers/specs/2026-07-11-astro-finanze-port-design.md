# Astro Finanze — Port design spec

**Date:** 2026-07-11
**Source UI-kit:** https://github.com/studioneyra-digital/05-finanze.git (static HTML/CSS/JS,
no build process — Bootstrap grid, jQuery, Swiper, WOW.js/Animate.css, GSAP/ScrollTrigger,
Lucide icons)
**Target:** this repo, a typed/componentized Astro 5 project per the architecture already
defined in [CLAUDE.md](../../../CLAUDE.md).

This spec covers *what gets built* (page map, content collections, component inventory,
asset/logic porting plan). It does not repeat the stack/architecture/hard-constraints/gotchas
already fixed in CLAUDE.md — those apply as-is.

## 1. Source repo inventory (reference)

- `dist/index.html` — the real homepage: Nav+Hero(slider) → Marquee → About(`#about`) →
  Services(`#services`) → Projects(`#projects`) → Testimonials(`#testimonials`) → Footer →
  scroll-to-top.
- `dist/hero.html` / `dist/hero-slider.html` — isolated hero variants (static v1 vs
  Swiper-based slider). The slider variant is what `index.html` actually uses.
- `dist/ui-kit.html` (earlier/partial) and `dist/ui-kit2.html` (current, superset) — component
  style-guide pages, organized as Foundations / Elements / Components. `ui-kit2.html` is the
  source of truth for what components exist. **Neither is ported as a site route** — they're
  design reference only.
- `dist/assets/css/main.css` (5,306 lines, only project stylesheet) + `animate.min.css`,
  `bootstrap-grid.min.css`, `swiper-bundle.min.css`.
- `dist/assets/js/main.js` (own logic: `initSmoothScroll`, `initFaqAccordion`,
  `initPricingToggle`, `initHeroSlider`, `initNavbarElite`, `initNavbarScroll`,
  `initProjectsSlider`, `initServicesSlider`, `initAlerts`, `initScrollTop`, `initTabs`;
  plus `initKitSidebarScrollSpy`/`initKitSnippetCopy` which are ui-kit-demo-only and are
  **not** ported) + vendor libs (jQuery, Swiper, WOW, GSAP, ScrollTrigger, Lenis).
- `dist/assets/img/logos/logo.svg` (single generic logo — no dark/white variants yet) and
  `dist/assets/img/lib/*` (placeholder photography for hero/about/expertise/faq/posts/projects/
  services).
- `docs/ui-design.md` — design tokens (CSS variables): colors (some still "Por definir"),
  Space Grotesk/DM Sans type scale via `clamp()`, 10-step spacing scale, radius/shadow/easing
  tokens. These are already baked into vendored `main.css` — no new tokens to invent.
- Contact form (`form-panel`, light/dark): First Name, Last Name, Phone, E-mail, Message — no
  existing validation. Newsletter (`.newsletter`): single required email field.
- `docs/.restricted/` — **not read**, per the source repo's own CLAUDE.md instruction.

## 2. Page map (14 routes)

| Route | Composition |
|---|---|
| `/` | Nav, Hero (slider), Marquee, About (summary), Services (summary, links to `/servicios`), Projects (summary, links to `/proyectos`), Testimonials (summary), CTA Band, Footer |
| `/nosotros` | SubHero + expanded About (expertise items, preview video) + CTA Band |
| `/servicios` | SubHero + grid of service cards (from `services` collection) |
| `/servicios/[slug]` | SubHero + single service detail |
| `/proyectos` | SubHero + grid of project cards (from `projects` collection) |
| `/proyectos/[slug]` | SubHero + single project detail |
| `/blog` | SubHero + grid of post cards (from `posts` collection) |
| `/blog/[slug]` | SubHero + article detail |
| `/equipo` | SubHero + team grid (from `team` collection) |
| `/planes` | SubHero + pricing tabs (from `plans` collection) |
| `/testimonios` | SubHero + testimonial grid (from `testimonials` collection) |
| `/faq` | SubHero + FAQ accordion (5 Q&A) |
| `/contacto` | SubHero + contact form (client-side validation + simulated success only) |
| `/404` | Error page (required — nginx `error_page 404` references it per CLAUDE.md) |

All internal pages use `PageLayout` (Nav + SubHero + slot + CtaBand + Footer). Home composes
sections directly (it doesn't use SubHero).

## 3. Content collections (6)

| Collection | Type | Fields |
|---|---|---|
| `services` | `content` | title, icon (Lucide icon name, string), shortDescription, image?, body |
| `projects` | `content` | title, category (string tag), image, shortDescription, body |
| `testimonials` | `data` | avatar, name, role, rating (number 1–5), quote, stat?, statCaption? |
| `plans` | `data` | planName, icon, price (`z.string()` — must fit both `"$490"` and `"Custom"`), features (string[]), highlighted (boolean) |
| `posts` | `content` | title, excerpt, image, publishDate, author?, body |
| `team` | `data` | name, role, photo |

Seed data: fictional/placeholder "Finanze" brand content only, per CLAUDE.md's hard
constraint against real client data.

## 4. Component inventory

- **`elements/`**: Button, Badge, Card (Feature/ContextElite, Ghost, Metric, Project,
  ServiceElite, ServiceItem, Post, TeamItemMetal), FormField, Alert, Divider, CookieBanner,
  Newsletter, Stepper, Tabs, SubHero, ScrollTop.
- **`sections/`**: Nav (NavbarElite), Hero (static v1 + Slider variants), Marquee,
  AboutSection (AboutUsItemElite), ServicesSection, ProjectsSection (+ slider),
  TestimonialsSection, Footer (FooterElite), FaqAccordion, PricingTabs, ContactForm,
  TeamGrid, GoogleRatingBox, ExpertiseItemElite, PreviewVideo, SpecialQuote, CtaBand,
  ContactStrip.
- Root: `WhatsAppButton.astro` (env-gated on `PUBLIC_WHATSAPP_NUMBER`, renders nothing if
  unset — per CLAUDE.md hard constraint).

## 5. Asset & logic porting plan

- Re-vendor as-is into `public/assets/`: `main.css`, `animate.min.css`,
  `bootstrap-grid.min.css`, `swiper-bundle.min.css`, JS vendor libs (Swiper, WOW, GSAP,
  ScrollTrigger, Lenis — **not** jQuery), and `img/lib/*` placeholder photography. Lucide
  stays CDN-loaded per CLAUDE.md.
- `main.js`'s jQuery-based functions are rewritten in vanilla TypeScript, split per the
  project's `lib/` (pure logic) vs `scripts/` (DOM wiring) convention:
  - `lib/` candidates with unit tests: FAQ accordion open/close state, pricing-tab active-tab
    selection, nav "is-scrolled" threshold logic, contact-form validation rules, newsletter
    email validation.
  - `scripts/` (untested, thin wiring): hero/projects/services Swiper init, WOW/GSAP/
    ScrollTrigger/Lenis init, scroll-to-top, Lucide `createIcons()` call, alerts dismissal.
- Missing brand assets not present in source (`logo-dark`/`logo-white` SVG variants,
  `favicon.ico`, `og-image.jpg`) get simple placeholder versions generated during the
  scaffold phase, since the source only ships one generic `logo.svg`.
- `PUBLIC_WHATSAPP_NUMBER` gets a placeholder value (e.g. `+51999999999`) for local dev/build
  verification only — not meant as a real contact number.

## 6. Forms

Both contact (`/contacto`) and newsletter forms: client-side validation + simulated success
state only, per CLAUDE.md's hard constraint. No `fetch`/real submission, no hardcoded email.
Mark the integration point with `// TODO`.

## 7. Docker / deployment

Exactly as specified in CLAUDE.md: multi-stage Dockerfile (`node:20-alpine` build stage with
pinned `corepack prepare pnpm@<lockfile-version>` → `nginx:alpine` serve stage),
`docker-compose.yml` exposing `PORT` (default 8080) and forwarding `PUBLIC_*` build args,
`pnpm-workspace.yaml` with `onlyBuiltDependencies: [esbuild, sharp]`, `.dockerignore`
excluding `node_modules`. `nginx` config needs a `location /_astro/` cache-header block
alongside `/assets/` (gotcha #6), and `error_page 404` pointing at the real `404.astro`.

## 8. Build process

Per CLAUDE.md's documented working process (already used successfully on a project of
similar scope): **subagent-driven-development**. One implementation plan task = one fresh
implementer subagent + one fresh reviewer subagent (spec compliance + code quality), with
this session acting as controller — verifying build/test state, root-causing environment
issues, dispatching fixes between tasks. Rough phase grouping for the plan (final granular
task list produced by the writing-plans skill):

0. Scaffold: `astro create`, pnpm/Vitest config, Docker skeleton, asset vendoring, missing
   placeholder brand assets.
1. Layouts: `BaseLayout`, `PageLayout`, Nav, Footer, CtaBand, SubHero.
2. Elements: buttons, badges, cards, form fields, alerts, dividers, etc.
3. Content collections: `config.ts` + seed data for all 6 collections.
4. Sections: Hero variants, Marquee, About, Services, Projects, Testimonials, FAQ, Pricing
   tabs, Team grid, blog post cards.
5. Pages: all 14 routes wiring layouts + sections + collections.
6. Forms + WhatsApp button + interactive `lib/`+`scripts/` logic + unit tests.
7. Docker/deployment finalization.
8. Final whole-branch review (most capable model) for cross-task issues (e.g. invented CSS
   classes — see CLAUDE.md gotcha #7).

## Out of scope (explicitly deferred, not silently dropped)

- Real backend integration for contact/newsletter forms (marked `// TODO`, per hard
  constraint — decide fresh only if this project is reused for a real client, per CLAUDE.md
  §"Reusing this as a starter").
- Publishing `ui-kit.html`/`ui-kit2.html` as a live site route — they're design reference
  only during the build.
- Real WhatsApp number, real logo, real brand photography — all placeholder until a real
  client engagement reuses this starter.
