# Genesys — Astro Finanze Theme

Reusable Astro starter for corporate/B2B sites, ported from a static HTML
UI-kit (Bootstrap-grid CSS + vendored JS libs, no build process) into a
typed, componentized, testable Astro project. Built to be cloned and
reconfigured for new client projects — swap content, keep the code.

## Stack

- **Astro 5**, `output: 'static'`. No UI framework (no React/Vue/Svelte/Alpine)
  — plain `.astro` markup + vanilla TypeScript modules.
- **pnpm** only. Node >= 20.3.0. `package.json` declares `engines` +
  `packageManager` — keep both in sync with `pnpm-workspace.yaml` and the
  Dockerfile's `corepack prepare` pin.
- **Vitest** for unit tests — only pure logic gets tests (DOM-coupled wiring
  does not).
- Styling: a single vendored `public/assets/css/main.css` (Bootstrap-grid +
  hand-authored component classes). **Never edit it, never add `<style>`
  blocks, never invent class names anywhere in the project.** Every class
  used in a component must already exist in `main.css` — grep it before
  using a new one.
- JS libraries loaded globally via `<script>` in `BaseLayout.astro`: Swiper,
  WOW.js + Animate.css, GSAP + ScrollTrigger, Lucide Icons (CDN). No jQuery
  — if the source UI-kit's `main.js` used jQuery, port the logic to vanilla
  DOM APIs.

## Architecture

```
src/
├── lib/            Pure, unit-tested logic. Dependency-injected (e.g. take
│                   a Storage-like param instead of touching window.localStorage
│                   directly) so tests never need jsdom/a real DOM.
├── scripts/        Thin DOM-wiring wrappers. Import from lib/, attach event
│                   listeners, read/write the DOM. Not unit-tested — verified
│                   by reading the code + a build/browser check.
├── components/
│   ├── elements/   Small style-only primitives (Button, Badge, Card, Alert,
│   │               FormField...). No business logic.
│   ├── sections/   Page-section components (Nav, Hero, Footer, ServiceCard,
│   │               Testimonials...). Some query Content Collections.
│   └── *.astro     Env-gated leaf components (e.g. WhatsAppButton).
├── layouts/
│   ├── BaseLayout.astro   <head> meta/SEO + all vendored CSS/JS loading.
│   └── PageLayout.astro   Nav + SubHero + slot + CtaBand + Footer, used by
│                          every internal page.
├── content/        Astro Content Collections (config.ts + seed data). Keep
│                   schemas minimal — only fields a component actually reads.
└── pages/          One file per route. Compose layouts + components; no
                    business logic lives here beyond prop wiring.
```

**Split rule:** if a piece of behavior has a pure computation in it (a
threshold check, a step function, a validation rule), extract that part into
`lib/` with a unit test, and keep only DOM plumbing in `scripts/`. This is
what let a ~30-task build stay reviewable — every `lib/` module got a
real test, every `scripts/` module stayed too small to hide bugs in.

## Hard constraints (do not relax without asking)

- Formularios (contacto + newsletter): validación + estado de éxito
  simulado en el cliente **únicamente** — nunca un `fetch`/envío real ni un
  email hardcodeado. Mark the integration point with `// TODO`.
- Env-gated features (e.g. `WhatsAppButton` on `PUBLIC_WHATSAPP_NUMBER`)
  must render nothing at all when the var is unset — no placeholder, no
  broken link.
- `<html lang="es">` on every page (adjust per project locale).
- Content collections use fictional/placeholder brand data — never real
  client data in a starter template.

## Gotchas found the hard way (check these first in a new project)

1. **`<script src="/assets/...">` referencing a `public/` file needs
   `is:inline`** or the Astro 5 build fails with "references an asset in
   the public/ directory". Plain `<script>import ... from '../scripts/x'`
   module-import tags do **not** need it — only literal `src=` pointing at
   `public/`.
2. **`getViteConfig` from `astro/config` (used in `vitest.config.ts`)
   requires a matching Vitest peer version** — check `node_modules/astro/package.json`'s
   own `vitest` peerDependency and pin `vitest` to match, or `getViteConfig`
   throws an opaque `"[object Object]"` error during test collection.
3. **pnpm 11+ blocks native postinstall scripts by default**
   (`ERR_PNPM_IGNORED_BUILDS`, e.g. for `esbuild`/`sharp`). Commit a
   `pnpm-workspace.yaml` with `onlyBuiltDependencies: [esbuild, sharp]` (not
   in `package.json` — that field is no longer read by modern pnpm) so
   `pnpm install` works non-interactively, including in Docker.
4. **Docker build on Windows hosts:** without a `.dockerignore` excluding
   `node_modules`, `COPY . .` after `pnpm install` inside the image
   overwrites the container's Linux `node_modules` with the host's
   Windows-native one, breaking the build. Always ship a `.dockerignore`.
5. **`node:20-alpine` + bare `corepack enable`** can pull pnpm 11.x, which
   requires Node >=22.13 and crashes on a Node 20 base image. Pin explicitly:
   `corepack prepare pnpm@<version> --activate`, matching the lockfile's
   `lockfileVersion`.
6. **Astro emits its own bundled JS under `/_astro/`**, not wherever your
   vendored assets live (`/assets/` here). If nginx/CDN caching rules only
   target `/assets/`, the Astro-bundled component scripts (from `<script>
   import ...` tags) miss those cache headers — add a matching
   `location /_astro/ { ... }` block if that matters for the project.
7. **Every CSS class name is a claim** — before using a class in new
   markup, grep it in the vendored CSS. A component that "looks styled" in
   isolation but uses an invented class (e.g. `whatsapp-float` instead of
   the real `.wa-btn`) will silently render unstyled/unpositioned. This bit
   this exact project once; catch it by grepping, not by eyeballing.

## Content Collections pattern

`src/content/config.ts` defines one `defineCollection` per content type
(`type: 'content'` for Markdown, `type: 'data'` for JSON). Keep schemas
exactly as wide as what a component reads — no speculative fields. Prefer
string fields over unions when a value might be a display string that
doesn't need arithmetic (e.g. a price shown as `"$490"` or `"Custom"` is a
`z.string()`, not `z.number()` — don't force a type that can't represent
your real seed data).

## Docker / deployment

- Multi-stage `Dockerfile`: `node:<pinned>-alpine` build stage (`pnpm install
  --frozen-lockfile` → `pnpm build`) → `nginx:alpine` serve stage (`COPY
  --from=build /app/dist`).
- Any `PUBLIC_*` env var the site reads at build time (Astro static output
  bakes these in) must be threaded through as a Docker `ARG` **and**
  `ENV` in the build stage — a `docker-compose.yml` `build.args` entry alone
  does nothing without a matching `ARG`/`ENV` pair in the Dockerfile.
- `docker-compose.yml` exposes `PORT` (default 8080) and forwards
  `PUBLIC_*` build args; `restart: unless-stopped`.
- Add a real `src/pages/404.astro` if nginx's `error_page 404` config
  references one — Astro won't generate `dist/404.html` unless the page
  exists.

## Reusing this as a starter for a new client project

1. Clone/copy the repo, rename in `package.json`.
2. Replace `src/content/**` seed data with the new client's real
   services/projects/testimonials/plans — schemas should already fit; only
   add fields if a new component genuinely needs them.
3. Update brand strings (name, email, phone, address) — search for the
   placeholder brand name across `src/components/sections/Footer.astro`,
   `ContactStrip.astro`, and every page's `PageLayout`/`BaseLayout` props.
4. If the new project's UI-kit differs, re-vendor `public/assets/css/main.css`
   and `public/assets/js/*` from the new source, and re-grep every component
   for class names that may no longer exist.
5. Decide fresh whether the contact form stays front-end-only or gets wired
   to a real backend — don't silently keep or drop that decision, ask.
6. Set `PUBLIC_WHATSAPP_NUMBER` (or leave unset to hide the button) via
   `.env` / Docker build args.

## Working process notes

This project was built via **subagent-driven-development**: one plan task
= one fresh implementer subagent + one fresh reviewer subagent (spec
compliance + code quality), with a controller (this session) verifying
build/test state, root-causing environment issues, and dispatching fixes
between tasks. A final whole-branch review (on the most capable model)
caught the one cross-task issue no single task's diff could reveal (the
invented `whatsapp-float` class, item 7 above). For a project of similar
scope, prefer that structure over one giant undifferentiated implementation
pass — it's what caught real bugs here.
