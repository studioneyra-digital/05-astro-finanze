# Astro Finanze — corporate/B2B Astro starter

Reusable Astro starter for corporate/B2B sites, ported from a static HTML
UI-kit (Bootstrap-grid CSS + vendored JS libs, no build process) into a
typed, componentized, testable Astro project. Built to be cloned and
reconfigured for new client projects — swap content, keep the code.

This document is written to double as a **playbook for porting the next
UI-kit into Astro** — not just documentation of this one. Section order
roughly follows the order you'll actually need it in: stack decisions first,
then the ground-truth workflow that avoids the most expensive mistakes, then
architecture, then the gotchas paid for in real debugging time.

## Stack

- **Astro 5**, `output: 'static'`. No UI framework (no React/Vue/Svelte/Alpine)
  — plain `.astro` markup + vanilla TypeScript modules.
- **Pin the Astro version explicitly in `package.json`.** `pnpm create
  astro@latest` scaffolds whatever the *current* latest major is — by the
  time you read this it may no longer be 5.x. If the spec says "Astro 5",
  write `"astro": "^5.0.0"` yourself after scaffolding; don't trust the
  scaffold's version. A newer major can silently raise the Node floor (Astro
  7 requires Node ≥22.12) and break a Docker base image pinned to an older
  Node — see gotcha #5.
- **pnpm** only. Node ≥ 20.3.0. `package.json` declares `engines` +
  `packageManager` — keep both in sync with `pnpm-workspace.yaml` and the
  Dockerfile's `corepack prepare` pin. **Pick the pnpm version for
  Node-version compatibility, not for "latest":** pnpm 11+ requires Node
  ≥22.13 and will crash on `node:20-alpine` with
  `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`. If the project targets Node 20,
  pin `packageManager` to a pnpm 9.x/10.x release (matches the lockfile's
  `lockfileVersion: '9.0'`) — corepack will then transparently switch your
  *local* pnpm to match too, which is good: it surfaces the incompatibility
  locally instead of only inside Docker.
- **Vitest** for unit tests — only pure logic gets tests (DOM-coupled wiring
  does not). Pin `vitest` to whatever range `node_modules/astro/package.json`
  itself declares as a `devDependency` (not `peerDependencies` necessarily —
  check both) — a mismatch makes `getViteConfig` throw an opaque
  `"[object Object]"` error with no useful stack trace.
- Styling: a single vendored `public/assets/css/main.css` (Bootstrap-grid +
  hand-authored component classes). **Never edit it, never add `<style>`
  blocks, never invent class names anywhere in the project.** Every class
  used in a component must already exist in `main.css` — grep it before
  using a new one. See "Ground-truth verification workflow" below — this
  rule only works if you actually read the source, not a summary of it.
- JS libraries loaded globally via `<script>` in `BaseLayout.astro`: Swiper,
  WOW.js + Animate.css, GSAP + ScrollTrigger, Lucide Icons (CDN). No jQuery
  — if the source UI-kit's `main.js` used jQuery, port the logic to vanilla
  DOM APIs.

## Ground-truth verification workflow (do this before writing any component)

The single biggest source of rework in a port like this is writing
components/props from a *summary* of the source UI-kit instead of the
literal source files. A survey agent's prose summary is good for initial
scoping (page count, rough component list) but is **not sufficient** to
write correct prop shapes or markup — component structure has to come from
reading the actual HTML.

1. **Vendor the full source first, not just the assets you think you need.**
   Clone the source repo, copy CSS/JS/images into `public/assets/`, and also
   keep a full copy of the source's HTML/docs at
   `docs/reference/<source-name>/` (not served — outside `public/` and
   `src/pages/`) so every later task can grep exact markup instead of
   guessing. Respect any `docs/.restricted/`-style exclusion the source
   repo's own instructions specify.
2. **Watch your `.gitignore` scoping when vendoring a reference copy.** An
   unscoped rule like `dist/` (no leading slash) matches a directory named
   `dist` *anywhere* in the tree — including
   `docs/reference/<source>/dist/`, which is exactly the reference copy you
   just vendored for grepping. Scope build-output rules to the repo root:
   `/dist/`, not `dist/`. Verify with `git status`/`git add -n` that the
   reference copy actually got staged, not silently dropped.
3. **Before writing a component, `grep` its class stem in the vendored
   `main.css` and read the matching block in the reference HTML** — not the
   survey summary of it. Real examples from this project where the summary
   was wrong and only reading the source caught it:
   - A "Nav" component assumed to switch between a light and dark logo per
     page turned out to have a CSS that's *permanently* dark-themed (only
     `.is-scrolled`/`.is-menu-open` state classes exist) — there was no light
     variant to switch to.
   - "Pricing Tab Item" sounded like tabs (one plan visible at a time); the
     real markup showed all plans simultaneously with a Monthly/Yearly
     toggle switch affecting every card's price display at once. The actual
     tabs component in that kit was a completely different, generically-named
     "Industries We Serve" content switcher.
   - A "Card Metric" component was assumed to be the small stat shown inside
     a testimonial card; the real testimonial stat had its own dedicated
     classes, and Card Metric was a separate, larger standalone component
     used elsewhere.
   - Components like `card-ghost-item` and `preview-video` were assumed to
     need a CTA button / an actual `<video>` element; neither exists in the
     real markup — one is icon+title+desc only, the other is a thumbnail +
     play-button link with no embedded player.
4. **When a requested feature has zero support in the vendored CSS, don't
   invent a class to fill the gap** — that's the exact mistake this rule
   exists to prevent. Instead, repurpose an existing, semantically-close
   component's real classes. (E.g., if the design system has no
   floating-WhatsApp-button styling at all, render the WhatsApp link reusing
   a "contact channel" component's existing classes instead of fabricating
   `.wa-btn`/`.whatsapp-float`.)
5. **Run a full class-name audit before calling the port done.** Build the
   site, fetch every route's HTML, extract every `class="..."` value used,
   and diff against the vendored CSS files:
   ```bash
   grep -oE 'class="[^"]*"' /tmp/all_pages.html | sed 's/class="//;s/"//' \
     | tr ' ' '\n' | sort -u > /tmp/all_classes.txt
   while IFS= read -r cls; do
     grep -qF ".$cls" public/assets/css/*.css || echo "MISSING: $cls"
   done < /tmp/all_classes.txt
   ```
   Exclude Bootstrap grid/state utility classes (`col-*`, `row`, `g-4`,
   `is-*`, etc.) from the check. Anything left over is either (a) a real
   class that just lacks its own explicit CSS rule (verify by grepping the
   *source* HTML for it — if it's there verbatim, it's fine), or (b) a class
   you invented, which needs to be removed.
6. **`astro check` may be unreliable across Astro/TS version combos** (it
   errored with an opaque `"Cannot read properties of undefined
   (reading 'fileExists')"` in this project until `typescript` was repinned
   to Astro's expected range, and even then returned empty output on
   success). Don't depend on it as your only signal — `pnpm build` is the
   reliable fallback verification for every component/page task.

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
threshold check, a step function, a validation rule, a toggle-state
transition), extract that part into `lib/` with a unit test, and keep only
DOM plumbing in `scripts/`. This is what let a ~49-task build stay
reviewable — every `lib/` module got a real test, every `scripts/` module
stayed too small to hide bugs in.

## Hard constraints (do not relax without asking)

- Formularios (contacto + newsletter): validación + estado de éxito
  simulado en el cliente **únicamente** — nunca un `fetch`/envío real ni un
  email hardcodeado. Mark the integration point with `// TODO`.
- Env-gated features (e.g. `WhatsAppButton` on `PUBLIC_WHATSAPP_NUMBER`)
  must render nothing at all when the var is unset — no placeholder, no
  broken link.
- `<html lang="es">` on every page (adjust per project locale).
- Content collections use fictional/placeholder brand data — never real
  client data in a starter template. Write real, specific placeholder copy
  (active voice, concrete claims) rather than lorem-ipsum-style filler —
  it's what a reviewer or client will actually read first.

## Gotchas found the hard way (check these first in a new project)

1. **`<script src="/assets/...">` referencing a `public/` file needs
   `is:inline`** or the Astro 5 build fails with "references an asset in
   the public/ directory". Plain `<script>import ... from '../scripts/x'`
   module-import tags do **not** need it — only literal `src=` pointing at
   `public/`.
2. **`getViteConfig` from `astro/config` (used in `vitest.config.ts`)
   requires a matching Vitest version** — check `node_modules/astro/package.json`'s
   own `vitest` devDependency and pin your project's `vitest` to match, or
   `getViteConfig` throws an opaque `"[object Object]"` error during test
   collection.
3. **pnpm 9+ blocks native postinstall scripts by default**
   (`ERR_PNPM_IGNORED_BUILDS`, e.g. for `esbuild`/`sharp`). Commit a
   `pnpm-workspace.yaml` with `onlyBuiltDependencies: [esbuild, sharp]` (not
   in `package.json` — that field is no longer read by modern pnpm) so
   `pnpm install` works non-interactively, including in Docker. (A very new
   pnpm may auto-append an `allowBuilds:` block asking you to confirm
   `true`/`false` per package the first time you approve builds — once
   confirmed, `onlyBuiltDependencies` alone is sufficient and more portable
   across pnpm versions; drop the pnpm-specific `allowBuilds` key again if a
   later `pnpm install` re-adds it.)
4. **Docker build on Windows hosts:** without a `.dockerignore` excluding
   `node_modules`, `COPY . .` after `pnpm install` inside the image
   overwrites the container's Linux `node_modules` with the host's
   Windows-native one, breaking the build. Always ship a `.dockerignore`.
5. **`node:20-alpine` + bare `corepack enable`** pulls whatever pnpm version
   `packageManager` in `package.json` specifies — if that's pnpm 11+, it
   requires Node ≥22.13 and crashes on the Node 20 base image with
   `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`. Pin explicitly to a
   Node-20-compatible pnpm: `corepack prepare pnpm@9.15.0 --activate` (or
   whatever 9.x/10.x release matches your lockfile's `lockfileVersion`) —
   and make sure `package.json`'s `packageManager` field says the same
   version, since corepack enforces it locally too.
6. **Astro emits its own bundled JS under `/_astro/`**, not wherever your
   vendored assets live (`/assets/` here). If nginx/CDN caching rules only
   target `/assets/`, the Astro-bundled component scripts (from `<script>
   import ...` tags) miss those cache headers — add a matching
   `location /_astro/ { ... }` block if that matters for the project.
7. **Every CSS class name is a claim** — before using a class in new
   markup, grep it in the vendored CSS *and* read the real source HTML block
   it comes from (see "Ground-truth verification workflow" above). Don't
   assume a component category (e.g. "there's a floating WhatsApp button
   pattern in most kits") means this kit's CSS supports it — some kits
   simply don't have every component you'd expect, and inventing one to fill
   the gap is the failure mode this rule exists to prevent.
8. **`pnpm create astro@latest .` in a non-empty directory** (e.g. one that
   already has `CLAUDE.md`/`.git`/`docs/`) refuses to scaffold in place and
   creates a randomly-named sibling subdirectory instead — even with
   `--yes`. Move its contents up (`mv <subdir>/* <subdir>/.[!.]* .` /
   `shopt -s dotglob; mv <subdir>/* .`) and remove the empty subdirectory
   rather than fighting the CLI into scaffolding in place.

## Content Collections pattern

`src/content/config.ts` defines one `defineCollection` per content type
(`type: 'content'` for Markdown, `type: 'data'` for JSON). Keep schemas
exactly as wide as what a component reads — no speculative fields, but also
don't under-shape a field: check what the *real* interactive behavior needs
before finalizing (e.g. a pricing card that toggles Monthly/Yearly needs
separate `priceMonthly`/`priceYearly` fields, not one `price` string, if
that's what the real component actually does — see ground-truth workflow
item 3). Prefer string fields over unions when a value might be a display
string that doesn't need arithmetic (e.g. a price shown as `"$490"` or
`"Custom"` is a `z.string()`, not `z.number()` — don't force a type that
can't represent your real seed data).

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
- **Verify the Docker build from a clean checkout, not just the working
  tree** — `git clone` the repo into a scratch directory and
  `docker compose build` there. The working tree can accidentally rely on
  local state (an installed devDependency, a locally-cached file) that a
  fresh clone won't have; this is also how you catch a `.gitignore` scoping
  bug like item 2 in the ground-truth workflow above, since a file silently
  excluded from git simply won't exist in the clone.

## Reusing this as a starter for a new client project

1. Clone/copy the repo, rename in `package.json`.
2. Replace `src/content/**` seed data with the new client's real
   services/projects/testimonials/plans — schemas should already fit; only
   add fields if a new component genuinely needs them.
3. Update brand strings (name, email, phone, address) — search for the
   placeholder brand name across `src/components/sections/Footer.astro`,
   `ContactStrip.astro`, and every page's `PageLayout`/`BaseLayout` props.
4. If the new project's UI-kit differs, re-vendor `public/assets/css/main.css`
   and `public/assets/js/*` from the new source (plus a full reference copy
   per the ground-truth workflow above), and re-grep every component for
   class names that may no longer exist — a component built against one
   kit's markup will not automatically be correct against another's, even
   if the component names sound the same (see the Nav/Pricing/CardMetric
   examples above).
5. Decide fresh whether the contact form stays front-end-only or gets wired
   to a real backend — don't silently keep or drop that decision, ask.
6. Set `PUBLIC_WHATSAPP_NUMBER` (or leave unset to hide the button) via
   `.env` / Docker build args.

## Working process notes

This project went through: brainstorming → a written design spec → a
detailed task-by-task implementation plan (`docs/superpowers/plans/`) →
inline execution in a single long session, correcting the plan against
ground truth as real source files became available (the plan was drafted
from an agent's survey summary before the source was vendored; several
prop shapes it specified turned out wrong once the actual HTML/CSS could be
read directly — see ground-truth workflow above). A final whole-project
review (full class-name audit + a clean-checkout Docker build) caught
issues no single task's diff would have revealed on its own: an invented
`.gitignore` scoping bug, four fabricated wrapper classes with no CSS
backing, and the pnpm/Node version mismatch.

**Execution mode tradeoff, from actual experience:** subagent-driven
development (fresh implementer + fresh reviewer subagent per task) buys
better isolation and catches cross-task issues, but a ~49-task plan means
~100 cold-start subagent invocations, each re-deriving context (re-reading
the plan, the reference source, `CLAUDE.md`) from scratch — that repeated
context-loading is real token cost. Inline execution in one session reuses
prompt caching across the whole run and was meaningfully cheaper in total
tokens for a port of this size, at the cost of the session's own context
growing large enough to need compaction, and losing the "fresh eyes" review
isolation subagents give you. For a project of similar scope, pick based on
which cost you'd rather pay — there isn't a universally correct answer.
