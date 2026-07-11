# Astro Finanze Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the "Finanze" static HTML UI-kit (source: https://github.com/studioneyra-digital/05-finanze.git) into a typed, componentized, Dockerized Astro 5 site with 14 routes, 6 content collections, and a vanilla-TS interactive layer, per `docs/superpowers/specs/2026-07-11-astro-finanze-port-design.md`.

**Architecture:** Astro 5 static output, no UI framework. Pure computation (thresholds, validation, toggle state) lives in `src/lib/` with Vitest tests; DOM wiring lives in `src/scripts/` (untested, verified by build + browser check); presentation lives in `src/components/{elements,sections}` and `src/layouts/`; content lives in `src/content/` (Content Collections). Vendored CSS/JS/images from the source UI-kit live in `public/assets/`; a non-served reference copy of the full source HTML/docs lives in `docs/reference/ui-kit-source/` for implementers to read exact markup/classes from (never fabricate class names — grep `main.css` / the reference HTML first).

**Tech Stack:** Astro 5 (`output: 'static'`), pnpm, Node ≥20.3.0, Vitest, Bootstrap-grid CSS (vendored), jQuery-free vanilla TS, Swiper, WOW.js + Animate.css, GSAP + ScrollTrigger, Lenis, Lucide Icons (CDN), Docker (`node:20-alpine` build → `nginx:alpine` serve).

## Global Constraints

- `pnpm` only; Node ≥20.3.0; `package.json` `engines`/`packageManager` must match `pnpm-workspace.yaml` and the Dockerfile's `corepack prepare` pin.
- Never edit `public/assets/css/main.css`; never add `<style>` blocks; never invent a class name — grep it in `main.css` or the reference HTML in `docs/reference/ui-kit-source/dist/` before using it in any component.
- No jQuery anywhere in `src/` — port jQuery-based logic from the source `main.js` to vanilla DOM APIs.
- `<html lang="es">` on every page.
- Contact and newsletter forms: client-side validation + simulated success state only. Never a real `fetch`/submission or a hardcoded email. Mark the integration point with `// TODO`.
- `WhatsAppButton` renders nothing (not even a placeholder) when `PUBLIC_WHATSAPP_NUMBER` is unset.
- Content collections use fictional "Finanze" placeholder data only — never real client data.
- `<script src="/assets/...">` tags referencing `public/` files need `is:inline`; plain `<script>import ...</script>` module tags do not.
- Only pure logic (in `src/lib/`) gets Vitest tests. `src/scripts/` wiring is verified by reading the code + `pnpm build` + a dev-server browser check — do not write DOM/jsdom tests for it.
- Every `git commit` step in this plan is literal — run it after each task's verification passes.

---

## Phase 0 — Scaffold & environment

### Task 1: Initialize Astro project, vendor UI-kit source, pnpm/Docker environment plumbing

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `pnpm-workspace.yaml`, `.gitignore`, `.dockerignore`
- Create: `public/assets/css/main.css`, `public/assets/css/animate.min.css`, `public/assets/css/bootstrap-grid.min.css`, `public/assets/css/swiper-bundle.min.css` (copied verbatim from source)
- Create: `public/assets/js/swiper-bundle.min.js`, `public/assets/js/wow.min.js`, `public/assets/js/gsap.min.js`, `public/assets/js/ScrollTrigger.min.js`, `public/assets/js/lenis.min.js` (copied verbatim from source — **do not copy `jquery-3.7.1.min.js` or `main.js`**, both are superseded by TS in later tasks)
- Create: `public/assets/img/lib/*` (copied verbatim from source `dist/assets/img/lib/`)
- Create: `docs/reference/ui-kit-source/` — copy of the source repo's `dist/` and `docs/ui-design.md`, `docs/informe-sesion-2026-07-03.md`, `docs/informe-detallado-sesion-2026-07-03.md` (**do not copy `docs/.restricted/`** — the source repo's own CLAUDE.md forbids reading it, and there is no reason to vendor it)

**Interfaces:**
- Produces: `public/assets/**` (served at `/assets/...` in every later layout/component task), `docs/reference/ui-kit-source/dist/{index.html,ui-kit2.html,hero-slider.html}` and `docs/reference/ui-kit-source/docs/ui-design.md` (read-only reference for every later markup-porting task — grep exact class names from here, never invent them).

- [ ] **Step 1: Scaffold the Astro project**

Run: `pnpm create astro@latest . -- --template minimal --typescript strict --no-install --no-git`

(We already ran `git init` for this repo — decline any prompt to re-init.)

- [ ] **Step 2: Set `output: 'static'` in `astro.config.mjs`**

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
});
```

- [ ] **Step 3: Pin engines and packageManager in `package.json`**

Check the pnpm version installed locally with `pnpm --version`, then add (substituting that version):

```json
{
  "engines": { "node": ">=20.3.0" },
  "packageManager": "pnpm@9.15.0"
}
```

- [ ] **Step 4: Add `pnpm-workspace.yaml`**

```yaml
packages:
  - "."
onlyBuiltDependencies:
  - esbuild
  - sharp
```

- [ ] **Step 5: Add `.gitignore` and `.dockerignore`**

```
# .gitignore
node_modules/
dist/
.astro/
.env
.env.*
!.env.example
```

```
# .dockerignore
node_modules
dist
.astro
.git
docs
```

- [ ] **Step 6: Clone the source UI-kit into a scratch location and vendor its assets**

```bash
git clone --depth 1 https://github.com/studioneyra-digital/05-finanze.git /tmp/finanze-source
mkdir -p public/assets/css public/assets/js public/assets/img
cp /tmp/finanze-source/dist/assets/css/main.css public/assets/css/
cp /tmp/finanze-source/dist/assets/css/animate.min.css public/assets/css/
cp /tmp/finanze-source/dist/assets/css/bootstrap-grid.min.css public/assets/css/
cp /tmp/finanze-source/dist/assets/css/swiper-bundle.min.css public/assets/css/
cp /tmp/finanze-source/dist/assets/js/swiper-bundle.min.js public/assets/js/
cp /tmp/finanze-source/dist/assets/js/wow.min.js public/assets/js/
cp /tmp/finanze-source/dist/assets/js/gsap.min.js public/assets/js/
cp /tmp/finanze-source/dist/assets/js/ScrollTrigger.min.js public/assets/js/
cp /tmp/finanze-source/dist/assets/js/lenis.min.js public/assets/js/
cp -r /tmp/finanze-source/dist/assets/img/lib public/assets/img/lib
mkdir -p docs/reference/ui-kit-source
cp -r /tmp/finanze-source/dist docs/reference/ui-kit-source/dist
mkdir -p docs/reference/ui-kit-source/docs
cp /tmp/finanze-source/docs/ui-design.md docs/reference/ui-kit-source/docs/
cp /tmp/finanze-source/docs/informe-sesion-2026-07-03.md docs/reference/ui-kit-source/docs/
cp /tmp/finanze-source/docs/informe-detallado-sesion-2026-07-03.md docs/reference/ui-kit-source/docs/
rm -rf /tmp/finanze-source
```

Verify `docs/.restricted/` was **not** copied: `ls docs/reference/ui-kit-source/docs/` must not list a `.restricted` entry.

- [ ] **Step 7: Verify install and dev server**

Run: `pnpm install && pnpm dev`
Expected: dev server starts on `localhost:4321` with no errors; stop it with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git add package.json astro.config.mjs tsconfig.json pnpm-workspace.yaml .gitignore .dockerignore public/assets docs/reference src pnpm-lock.yaml
git commit -m "Scaffold Astro project and vendor UI-kit source assets"
```

---

### Task 2: Vitest configuration + smoke test

**Files:**
- Create: `vitest.config.ts`
- Create: `src/lib/example.ts`, `src/lib/example.test.ts` (deleted in Task 4 once a real lib module exists — see Step 5)

**Interfaces:**
- Produces: a working `pnpm test` command every later `src/lib/*.test.ts` task relies on.

- [ ] **Step 1: Check Astro's vitest peer version**

Run: `node -e "console.log(require('./node_modules/astro/package.json').peerDependencies?.vitest)"`
Expected: prints a semver range (e.g. `^2.0.0` or `^3.0.0`) — note it for Step 2.

- [ ] **Step 2: Install Vitest pinned to that range**

Run: `pnpm add -D vitest@<range-from-step-1>`

- [ ] **Step 3: Write `vitest.config.ts`**

```ts
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Write a smoke-test lib module and test**

```ts
// src/lib/example.ts
export function add(a: number, b: number): number {
  return a + b;
}
```

```ts
// src/lib/example.test.ts
import { describe, it, expect } from 'vitest';
import { add } from './example';

describe('add', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
});
```

- [ ] **Step 5: Add the `test` script and run it**

Add to `package.json` scripts: `"test": "vitest run"`.
Run: `pnpm test`
Expected: 1 passed test file, 1 passed test.

- [ ] **Step 6: Delete the smoke-test files**

```bash
rm src/lib/example.ts src/lib/example.test.ts
```

(They existed only to prove the runner works — Task 4 adds the first real `lib/` module.)

- [ ] **Step 7: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml
git commit -m "Configure Vitest for src/lib unit tests"
```

---

### Task 3: Placeholder brand assets (logo dark/white, favicon, og-image)

**Files:**
- Create: `public/assets/img/logos/logo-dark.svg`, `public/assets/img/logos/logo-white.svg`, `public/assets/img/favicon.ico`, `public/assets/img/og-image.jpg`

**Interfaces:**
- Produces: `/assets/img/logos/logo-dark.svg`, `/assets/img/logos/logo-white.svg` (consumed by the Nav task), `/assets/img/favicon.ico`, `/assets/img/og-image.jpg` (consumed by the BaseLayout task).

- [ ] **Step 1: Write a simple wordmark SVG for the dark variant**

```svg
<!-- public/assets/img/logos/logo-dark.svg -->
<svg width="140" height="32" viewBox="0 0 140 32" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Finanze">
  <text x="0" y="23" font-family="Space Grotesk, sans-serif" font-size="24" font-weight="700" fill="#15152B">Finanze</text>
</svg>
```

- [ ] **Step 2: Write the white variant (same wordmark, white fill, for dark hero/footer nav)**

```svg
<!-- public/assets/img/logos/logo-white.svg -->
<svg width="140" height="32" viewBox="0 0 140 32" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Finanze">
  <text x="0" y="23" font-family="Space Grotesk, sans-serif" font-size="24" font-weight="700" fill="#FFFFFF">Finanze</text>
</svg>
```

- [ ] **Step 3: Generate a minimal favicon and og-image placeholder**

Run (requires ImageMagick; if unavailable, use any local tool to produce a 32x32 `.ico` and a 1200x630 `.jpg` — the exact pixels don't matter, only that the files exist at these paths):

```bash
convert -size 32x32 xc:#2b46e0 public/assets/img/favicon.ico
convert -size 1200x630 xc:#15152B -gravity center -fill white -pointsize 64 -annotate 0 "Finanze" public/assets/img/og-image.jpg
```

- [ ] **Step 4: Verify files exist**

Run: `ls public/assets/img/logos/ public/assets/img/favicon.ico public/assets/img/og-image.jpg`
Expected: all four paths listed, no errors.

- [ ] **Step 5: Commit**

```bash
git add public/assets/img/logos public/assets/img/favicon.ico public/assets/img/og-image.jpg
git commit -m "Add placeholder brand assets (logo variants, favicon, og-image)"
```

---

## Phase 1 — Pure logic (`src/lib/`), TDD

### Task 4: Nav scroll threshold — `src/lib/navScroll.ts`

**Files:**
- Create: `src/lib/navScroll.ts`, `src/lib/navScroll.test.ts`

**Interfaces:**
- Produces: `isNavScrolled(scrollY: number, threshold?: number): boolean` (default `threshold = 60`) — consumed by `src/scripts/navbar.ts` (Task 12).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/navScroll.test.ts
import { describe, it, expect } from 'vitest';
import { isNavScrolled } from './navScroll';

describe('isNavScrolled', () => {
  it('is false at scrollY 0', () => {
    expect(isNavScrolled(0)).toBe(false);
  });

  it('is false just below the default 60px threshold', () => {
    expect(isNavScrolled(59)).toBe(false);
  });

  it('is true at exactly the default threshold', () => {
    expect(isNavScrolled(60)).toBe(true);
  });

  it('respects a custom threshold', () => {
    expect(isNavScrolled(100, 120)).toBe(false);
    expect(isNavScrolled(120, 120)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test navScroll`
Expected: FAIL — `Cannot find module './navScroll'`.

- [ ] **Step 3: Implement**

```ts
// src/lib/navScroll.ts
export function isNavScrolled(scrollY: number, threshold = 60): boolean {
  return scrollY >= threshold;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test navScroll`
Expected: PASS — 4 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/navScroll.ts src/lib/navScroll.test.ts
git commit -m "Add isNavScrolled threshold logic"
```

---

### Task 5: Scroll-to-top visibility threshold — `src/lib/scrollTop.ts`

**Files:**
- Create: `src/lib/scrollTop.ts`, `src/lib/scrollTop.test.ts`

**Interfaces:**
- Produces: `shouldShowScrollTop(scrollY: number, threshold?: number): boolean` (default `threshold = 400`) — consumed by `src/scripts/scrollTop.ts` (Task 17).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/scrollTop.test.ts
import { describe, it, expect } from 'vitest';
import { shouldShowScrollTop } from './scrollTop';

describe('shouldShowScrollTop', () => {
  it('is false near the top', () => {
    expect(shouldShowScrollTop(0)).toBe(false);
    expect(shouldShowScrollTop(399)).toBe(false);
  });

  it('is true past the default 400px threshold', () => {
    expect(shouldShowScrollTop(400)).toBe(true);
    expect(shouldShowScrollTop(2000)).toBe(true);
  });

  it('respects a custom threshold', () => {
    expect(shouldShowScrollTop(100, 50)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test scrollTop`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/scrollTop.ts
export function shouldShowScrollTop(scrollY: number, threshold = 400): boolean {
  return scrollY >= threshold;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test scrollTop`
Expected: PASS — 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/scrollTop.ts src/lib/scrollTop.test.ts
git commit -m "Add shouldShowScrollTop threshold logic"
```

---

### Task 6: FAQ accordion toggle state — `src/lib/faqAccordion.ts`

**Files:**
- Create: `src/lib/faqAccordion.ts`, `src/lib/faqAccordion.test.ts`

**Interfaces:**
- Produces: `toggleFaqItem(openIndex: number | null, clickedIndex: number): number | null` — consumed by `src/scripts/faqAccordion.ts` (Task 35).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/faqAccordion.test.ts
import { describe, it, expect } from 'vitest';
import { toggleFaqItem } from './faqAccordion';

describe('toggleFaqItem', () => {
  it('opens a closed item when none is open', () => {
    expect(toggleFaqItem(null, 2)).toBe(2);
  });

  it('closes the currently open item when clicked again', () => {
    expect(toggleFaqItem(2, 2)).toBe(null);
  });

  it('switches to a different item, closing the previous one (one-open-at-a-time)', () => {
    expect(toggleFaqItem(0, 3)).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test faqAccordion`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/faqAccordion.ts
export function toggleFaqItem(openIndex: number | null, clickedIndex: number): number | null {
  return openIndex === clickedIndex ? null : clickedIndex;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test faqAccordion`
Expected: PASS — 3 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/faqAccordion.ts src/lib/faqAccordion.test.ts
git commit -m "Add toggleFaqItem one-open-at-a-time accordion logic"
```

---

### Task 7: Pricing tab selection — `src/lib/pricingTabs.ts`

**Files:**
- Create: `src/lib/pricingTabs.ts`, `src/lib/pricingTabs.test.ts`

**Interfaces:**
- Produces: `getActiveTab(tabIds: string[], requestedId: string, fallbackId: string): string` — consumed by `src/scripts/pricingTabs.ts` (Task 36) and reusable by any future `Tabs` wiring.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/pricingTabs.test.ts
import { describe, it, expect } from 'vitest';
import { getActiveTab } from './pricingTabs';

describe('getActiveTab', () => {
  const tabIds = ['basic', 'pro', 'enterprise'];

  it('returns the requested tab when it exists', () => {
    expect(getActiveTab(tabIds, 'pro', 'basic')).toBe('pro');
  });

  it('falls back when the requested tab id is unknown', () => {
    expect(getActiveTab(tabIds, 'nonexistent', 'basic')).toBe('basic');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test pricingTabs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/pricingTabs.ts
export function getActiveTab(tabIds: string[], requestedId: string, fallbackId: string): string {
  return tabIds.includes(requestedId) ? requestedId : fallbackId;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test pricingTabs`
Expected: PASS — 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pricingTabs.ts src/lib/pricingTabs.test.ts
git commit -m "Add getActiveTab tab-selection logic"
```

---

### Task 8: Email + phone format validation — `src/lib/validateEmail.ts`, `src/lib/validatePhone.ts`

**Files:**
- Create: `src/lib/validateEmail.ts`, `src/lib/validateEmail.test.ts`, `src/lib/validatePhone.ts`, `src/lib/validatePhone.test.ts`

**Interfaces:**
- Produces: `validateEmail(email: string): boolean`, `validatePhone(phone: string): boolean` — both consumed by `src/lib/contactFormValidation.ts` (Task 9) and `src/scripts/newsletter.ts` (Task 21).

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/validateEmail.test.ts
import { describe, it, expect } from 'vitest';
import { validateEmail } from './validateEmail';

describe('validateEmail', () => {
  it('accepts a well-formed email', () => {
    expect(validateEmail('ana@finanze.com')).toBe(true);
  });

  it('rejects a missing @', () => {
    expect(validateEmail('ana-finanze.com')).toBe(false);
  });

  it('rejects a missing domain', () => {
    expect(validateEmail('ana@')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});
```

```ts
// src/lib/validatePhone.test.ts
import { describe, it, expect } from 'vitest';
import { validatePhone } from './validatePhone';

describe('validatePhone', () => {
  it('accepts digits with a leading +', () => {
    expect(validatePhone('+51987654321')).toBe(true);
  });

  it('accepts digits with spaces and dashes', () => {
    expect(validatePhone('987-654-321')).toBe(true);
  });

  it('rejects letters', () => {
    expect(validatePhone('abc123')).toBe(false);
  });

  it('rejects strings shorter than 7 digits', () => {
    expect(validatePhone('12345')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test validateEmail validatePhone`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/validateEmail.ts
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}
```

```ts
// src/lib/validatePhone.ts
const PHONE_PATTERN = /^\+?[\d\s-]{7,}$/;

export function validatePhone(phone: string): boolean {
  const digitCount = phone.replace(/\D/g, '').length;
  return PHONE_PATTERN.test(phone) && digitCount >= 7;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test validateEmail validatePhone`
Expected: PASS — 8 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validateEmail.ts src/lib/validateEmail.test.ts src/lib/validatePhone.ts src/lib/validatePhone.test.ts
git commit -m "Add email and phone format validation"
```

---

### Task 9: Contact form validation — `src/lib/contactFormValidation.ts`

**Files:**
- Create: `src/lib/contactFormValidation.ts`, `src/lib/contactFormValidation.test.ts`

**Interfaces:**
- Consumes: `validateEmail` from `./validateEmail`, `validatePhone` from `./validatePhone` (Task 8).
- Produces: `interface ContactFormValues { firstName: string; lastName: string; phone: string; email: string; message: string }`, `interface ContactFormErrors { firstName?: string; lastName?: string; phone?: string; email?: string; message?: string }`, `interface ContactFormResult { valid: boolean; errors: ContactFormErrors }`, `validateContactForm(values: ContactFormValues): ContactFormResult` — consumed by `src/scripts/contactForm.ts` (Task 38).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/contactFormValidation.test.ts
import { describe, it, expect } from 'vitest';
import { validateContactForm, type ContactFormValues } from './contactFormValidation';

const validValues: ContactFormValues = {
  firstName: 'Ana',
  lastName: 'Torres',
  phone: '+51987654321',
  email: 'ana@finanze.com',
  message: 'Quisiera más información sobre sus servicios.',
};

describe('validateContactForm', () => {
  it('accepts fully valid values', () => {
    const result = validateContactForm(validValues);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('flags a missing first name', () => {
    const result = validateContactForm({ ...validValues, firstName: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.firstName).toBeDefined();
  });

  it('flags an invalid email', () => {
    const result = validateContactForm({ ...validValues, email: 'not-an-email' });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it('flags an invalid phone', () => {
    const result = validateContactForm({ ...validValues, phone: 'abc' });
    expect(result.valid).toBe(false);
    expect(result.errors.phone).toBeDefined();
  });

  it('flags an empty message', () => {
    const result = validateContactForm({ ...validValues, message: '   ' });
    expect(result.valid).toBe(false);
    expect(result.errors.message).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test contactFormValidation`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/contactFormValidation.ts
import { validateEmail } from './validateEmail';
import { validatePhone } from './validatePhone';

export interface ContactFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  message: string;
}

export interface ContactFormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  message?: string;
}

export interface ContactFormResult {
  valid: boolean;
  errors: ContactFormErrors;
}

export function validateContactForm(values: ContactFormValues): ContactFormResult {
  const errors: ContactFormErrors = {};

  if (!values.firstName.trim()) errors.firstName = 'Ingresa tu nombre.';
  if (!values.lastName.trim()) errors.lastName = 'Ingresa tu apellido.';
  if (!validatePhone(values.phone)) errors.phone = 'Ingresa un teléfono válido.';
  if (!validateEmail(values.email)) errors.email = 'Ingresa un correo válido.';
  if (!values.message.trim()) errors.message = 'Escribe un mensaje.';

  return { valid: Object.keys(errors).length === 0, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test contactFormValidation`
Expected: PASS — 5 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/contactFormValidation.ts src/lib/contactFormValidation.test.ts
git commit -m "Add contact form validation combining email/phone/required-field rules"
```

---

### Task 10: Cookie consent storage logic — `src/lib/cookieConsent.ts`

**Files:**
- Create: `src/lib/cookieConsent.ts`, `src/lib/cookieConsent.test.ts`

**Interfaces:**
- Produces: `type ConsentStorage = Pick<Storage, 'getItem' | 'setItem'>`, `hasAcceptedCookies(storage: ConsentStorage): boolean`, `acceptCookies(storage: ConsentStorage): void` — consumed by `src/scripts/cookieBanner.ts` (Task 21).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/cookieConsent.test.ts
import { describe, it, expect } from 'vitest';
import { hasAcceptedCookies, acceptCookies, type ConsentStorage } from './cookieConsent';

function createFakeStorage(initial: Record<string, string> = {}): ConsentStorage {
  const store = { ...initial };
  return {
    getItem: (key: string) => (key in store ? store[key] : null),
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
  };
}

describe('cookieConsent', () => {
  it('reports no consent by default', () => {
    expect(hasAcceptedCookies(createFakeStorage())).toBe(false);
  });

  it('reports consent after acceptCookies is called', () => {
    const storage = createFakeStorage();
    acceptCookies(storage);
    expect(hasAcceptedCookies(storage)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test cookieConsent`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/cookieConsent.ts
export type ConsentStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'finanze:cookie-consent';

export function hasAcceptedCookies(storage: ConsentStorage): boolean {
  return storage.getItem(STORAGE_KEY) === 'accepted';
}

export function acceptCookies(storage: ConsentStorage): void {
  storage.setItem(STORAGE_KEY, 'accepted');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test cookieConsent`
Expected: PASS — 2 tests passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/cookieConsent.ts src/lib/cookieConsent.test.ts
git commit -m "Add cookie consent storage logic with injectable Storage"
```

---

## Phase 2 — Layouts & global chrome

> Every task in this phase: after implementing, run `pnpm build` (expect a clean build) and note any class used — grep it first in `public/assets/css/main.css`. If it's missing, open `docs/reference/ui-kit-source/dist/index.html` and `.../dist/ui-kit2.html` and search for the component by the class names listed in the spec's §4 Component inventory to find the exact markup structure before writing the Astro version.

### Task 11: `BaseLayout.astro` + vendor script init — `src/scripts/vendorInit.ts`

**Files:**
- Create: `src/layouts/BaseLayout.astro`, `src/scripts/vendorInit.ts`

**Interfaces:**
- Consumes: `/assets/css/*.css`, `/assets/js/*.js` (Task 1), `/assets/img/favicon.ico`, `/assets/img/og-image.jpg` (Task 3).
- Produces: `BaseLayout` Astro props `{ title: string; description: string; ogImage?: string }` with a default `<slot />` — consumed by `PageLayout` (Task 15) and every page (Phase 6).

- [ ] **Step 1: Write `src/scripts/vendorInit.ts`**

```ts
// src/scripts/vendorInit.ts
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
```

- [ ] **Step 2: Write `BaseLayout.astro`**

Read `docs/reference/ui-kit-source/dist/index.html`'s `<head>` for the exact `<link>`/`<meta>` order before writing this — the CSS/JS order below matches CLAUDE.md's documented load order.

```astro
---
// src/layouts/BaseLayout.astro
interface Props {
  title: string;
  description: string;
  ogImage?: string;
}
const { title, description, ogImage = '/assets/img/og-image.jpg' } = Astro.props;
---
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="/assets/img/favicon.ico" />

  <link rel="stylesheet" href="/assets/css/animate.min.css" />
  <link rel="stylesheet" href="/assets/css/swiper-bundle.min.css" />
  <link rel="stylesheet" href="/assets/css/bootstrap-grid.min.css" />
  <link rel="stylesheet" href="/assets/css/main.css" />
</head>
<body>
  <slot />

  <script src="/assets/js/swiper-bundle.min.js" is:inline></script>
  <script src="/assets/js/wow.min.js" is:inline></script>
  <script src="/assets/js/gsap.min.js" is:inline></script>
  <script src="/assets/js/ScrollTrigger.min.js" is:inline></script>
  <script src="/assets/js/lenis.min.js" is:inline></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js" is:inline></script>
  <script>
    import { initVendorLibraries } from '../scripts/vendorInit';
    initVendorLibraries();
  </script>
</body>
</html>
```

- [ ] **Step 3: Verify the build**

Run: `pnpm build`
Expected: build succeeds with no "references an asset in the public/ directory" errors (confirms the `is:inline` gotcha is handled correctly).

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro src/scripts/vendorInit.ts
git commit -m "Add BaseLayout with vendored CSS/JS loading and vendor library init"
```

---

### Task 12: Nav section — `src/components/sections/Nav.astro` + `src/scripts/navbar.ts`

**Files:**
- Create: `src/components/sections/Nav.astro`, `src/scripts/navbar.ts`

**Interfaces:**
- Consumes: `isNavScrolled` from `src/lib/navScroll.ts` (Task 4); `/assets/img/logos/logo-dark.svg`, `/assets/img/logos/logo-white.svg` (Task 3).
- Produces: `Nav` Astro props `{ theme: 'dark-hero' | 'internal' }` — consumed by `Hero` (Home page, Task 39) and `PageLayout` (Task 15).

Nav links (main): Inicio (`/`), Nosotros (`/nosotros`), Servicios (`/servicios`), Proyectos (`/proyectos`), Planes (`/planes`), Blog (`/blog`), Contacto (`/contacto`). Secondary links (Equipo, Testimonios, FAQ) live in the Footer's "Quick Links" column (Task 13), not the main nav, to keep it uncluttered.

- [ ] **Step 1: Read the source markup**

Open `docs/reference/ui-kit-source/dist/index.html` and locate the `navbar-elite` block (it sits inside the same hero comment block as `hero-elite-slider`). Note the exact off-canvas toggle button markup and classes used for desktop vs mobile nav — reuse them 1:1.

- [ ] **Step 2: Write `src/scripts/navbar.ts`**

```ts
// src/scripts/navbar.ts
import { isNavScrolled } from '../lib/navScroll';

export function initNavbar(nav: HTMLElement): void {
  const updateScrolledClass = () => {
    nav.classList.toggle('is-scrolled', isNavScrolled(window.scrollY));
  };
  updateScrolledClass();
  window.addEventListener('scroll', updateScrolledClass, { passive: true });

  const toggle = nav.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const offcanvas = nav.querySelector<HTMLElement>('[data-nav-offcanvas]');
  toggle?.addEventListener('click', () => {
    offcanvas?.classList.toggle('is-open');
  });
}
```

- [ ] **Step 3: Write `Nav.astro`**

Build the markup from the source reference (Step 1), parameterizing only the logo variant and initial transparent/solid state on `theme`. Wire the script:

```astro
---
// src/components/sections/Nav.astro
interface Props {
  theme: 'dark-hero' | 'internal';
}
const { theme } = Astro.props;
const logoSrc = theme === 'dark-hero' ? '/assets/img/logos/logo-white.svg' : '/assets/img/logos/logo-dark.svg';
---
<nav class:list={['navbar-elite', { 'navbar-elite--transparent': theme === 'dark-hero' }]} data-navbar>
  <!-- port exact structure from docs/reference/ui-kit-source/dist/index.html's navbar-elite block here,
       using {logoSrc} for the <img> src, and the nav links listed in this task's Interfaces note -->
</nav>

<script>
  import { initNavbar } from '../../scripts/navbar';
  const nav = document.querySelector<HTMLElement>('[data-navbar]');
  if (nav) initNavbar(nav);
</script>
```

- [ ] **Step 4: Verify in the browser**

Run: `pnpm dev`, open the dev server, temporarily drop `<Nav theme="internal" />` into `src/pages/index.astro` to check it renders styled and the off-canvas toggle works, then remove that temporary insertion (Task 39 wires it for real).

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/Nav.astro src/scripts/navbar.ts
git commit -m "Add Nav section with scroll and off-canvas behavior"
```

---

### Task 13: Footer section — `src/components/sections/Footer.astro`

**Files:**
- Create: `src/components/sections/Footer.astro`

**Interfaces:**
- Produces: `Footer` Astro component, no props (static content) — consumed by `PageLayout` (Task 15) and the Home page (Task 39).

- [ ] **Step 1: Read the source markup**

Open `docs/reference/ui-kit-source/dist/index.html`, locate the `footer-elite` block (4 columns: About Company, Quick Links, Our Services, Working Hours + legal links).

- [ ] **Step 2: Write `Footer.astro`**

Port the 4-column structure verbatim from the source. Update the "Quick Links" column to point at: Nosotros (`/nosotros`), Proyectos (`/proyectos`), Testimonios (`/testimonios`), Equipo (`/equipo`), FAQ (`/faq`), Planes (`/planes`), Blog (`/blog`), Contacto (`/contacto`). Keep "Our Services" column as static text links (Wealth Management, Financial Planning, Business Consulting, Risk & Compliance) pointing at `/servicios`. Keep the legal links (Help, Privacy Policy, Terms & Conditions) as `href="#"` placeholders — no legal pages exist yet, matching CLAUDE.md's "no broken links" only applying to env-gated features, not placeholder legal pages, which is a documented gap and is fine at starter-template stage.

```astro
---
// src/components/sections/Footer.astro
---
<footer class="footer-elite">
  <!-- port exact 4-column structure from docs/reference/ui-kit-source/dist/index.html's footer-elite block -->
</footer>
```

- [ ] **Step 3: Verify with a build**

Run: `pnpm build`
Expected: no errors (Footer isn't wired into a page yet, so this just checks the file is valid Astro syntax — use `pnpm astro check` if available for a syntax-only check).

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/Footer.astro
git commit -m "Add Footer section with 4-column layout"
```

---

### Task 14: `SubHero` and `CtaBand` elements

**Files:**
- Create: `src/components/elements/SubHero.astro`, `src/components/elements/CtaBand.astro`

**Interfaces:**
- Produces: `SubHero` props `{ title: string; breadcrumb: { label: string; href?: string }[] }`; `CtaBand` props `{ heading: string; ctaLabel: string; ctaHref: string }` — both consumed by `PageLayout` (Task 15) and directly by the Home page (Task 39).

- [ ] **Step 1: Read the source markup**

Open `docs/reference/ui-kit-source/dist/ui-kit2.html`, locate the `sub-hero` and `cta-band` entries under Elements.

- [ ] **Step 2: Write `SubHero.astro`**

```astro
---
// src/components/elements/SubHero.astro
interface BreadcrumbItem {
  label: string;
  href?: string;
}
interface Props {
  title: string;
  breadcrumb: BreadcrumbItem[];
}
const { title, breadcrumb } = Astro.props;
---
<section class="sub-hero">
  <h1>{title}</h1>
  <nav class="sub-hero__breadcrumb" aria-label="Breadcrumb">
    {breadcrumb.map((item) => (
      item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>
    ))}
  </nav>
  <!-- reconcile the exact sub-hero markup/classes from docs/reference/ui-kit-source/dist/ui-kit2.html here -->
</section>
```

- [ ] **Step 3: Write `CtaBand.astro`**

```astro
---
// src/components/elements/CtaBand.astro
interface Props {
  heading: string;
  ctaLabel: string;
  ctaHref: string;
}
const { heading, ctaLabel, ctaHref } = Astro.props;
---
<section class="cta-band">
  <h2>{heading}</h2>
  <a class="button-elite" href={ctaHref}>{ctaLabel}</a>
  <!-- reconcile exact cta-band markup/classes from docs/reference/ui-kit-source/dist/ui-kit2.html here -->
</section>
```

- [ ] **Step 4: Verify**

Run: `pnpm astro check` (or `pnpm build` if `astro check` isn't configured).
Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/elements/SubHero.astro src/components/elements/CtaBand.astro
git commit -m "Add SubHero and CtaBand elements"
```

---

### Task 15: `PageLayout.astro`

**Files:**
- Create: `src/layouts/PageLayout.astro`

**Interfaces:**
- Consumes: `BaseLayout` (Task 11), `Nav` with `theme="internal"` (Task 12), `Footer` (Task 13), `SubHero`, `CtaBand` (Task 14), `WhatsAppButton` (Task 16).
- Produces: `PageLayout` props `{ title: string; description: string; subHeroTitle: string; breadcrumb: { label: string; href?: string }[]; ctaHeading: string; ctaLabel: string; ctaHref: string }` with a default `<slot />` for page-specific content — consumed by every internal page in Phase 6.

- [ ] **Step 1: Write `PageLayout.astro`**

```astro
---
// src/layouts/PageLayout.astro
import BaseLayout from './BaseLayout.astro';
import Nav from '../components/sections/Nav.astro';
import Footer from '../components/sections/Footer.astro';
import SubHero from '../components/elements/SubHero.astro';
import CtaBand from '../components/elements/CtaBand.astro';
import WhatsAppButton from '../components/WhatsAppButton.astro';

interface BreadcrumbItem {
  label: string;
  href?: string;
}
interface Props {
  title: string;
  description: string;
  subHeroTitle: string;
  breadcrumb: BreadcrumbItem[];
  ctaHeading: string;
  ctaLabel: string;
  ctaHref: string;
}
const { title, description, subHeroTitle, breadcrumb, ctaHeading, ctaLabel, ctaHref } = Astro.props;
---
<BaseLayout title={title} description={description}>
  <Nav theme="internal" />
  <SubHero title={subHeroTitle} breadcrumb={breadcrumb} />
  <slot />
  <CtaBand heading={ctaHeading} ctaLabel={ctaLabel} ctaHref={ctaHref} />
  <Footer />
  <WhatsAppButton />
</BaseLayout>
```

- [ ] **Step 2: Verify**

Run: `pnpm astro check`
Expected: no type errors (Task 16 must exist first — do that task before running this check if working out of order).

- [ ] **Step 3: Commit**

```bash
git add src/layouts/PageLayout.astro
git commit -m "Add PageLayout composing Nav, SubHero, CtaBand, Footer, WhatsAppButton"
```

---

### Task 16: `WhatsAppButton.astro`

**Files:**
- Create: `src/components/WhatsAppButton.astro`
- Create: `.env.example`

**Interfaces:**
- Produces: `WhatsAppButton` Astro component, no props, reads `import.meta.env.PUBLIC_WHATSAPP_NUMBER` — consumed by `PageLayout` (Task 15) and the Home page (Task 39).

- [ ] **Step 1: Grep the real class name**

Run: `grep -n "wa-btn\|whatsapp" public/assets/css/main.css`
Expected: at least one match — use that exact class in Step 2 (do not invent `whatsapp-float` or similar; this is the exact mistake flagged in CLAUDE.md gotcha #7).

- [ ] **Step 2: Write `WhatsAppButton.astro`**

```astro
---
// src/components/WhatsAppButton.astro
const number = import.meta.env.PUBLIC_WHATSAPP_NUMBER;
---
{number && (
  <a
    class="wa-btn"
    href={`https://wa.me/${number}`}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chatear por WhatsApp"
  >
    <!-- use the icon markup found alongside the wa-btn class in main.css/reference HTML -->
  </a>
)}
```

(Replace `wa-btn` above with whatever Step 1 actually found, if different.)

- [ ] **Step 3: Write `.env.example`**

```
PUBLIC_WHATSAPP_NUMBER=
```

- [ ] **Step 4: Verify both states**

Run: `PUBLIC_WHATSAPP_NUMBER=51999999999 pnpm build` then check `dist/` output contains the button markup on a built page.
Run: `pnpm build` (no env var set) and confirm the button markup is absent from the built output.

- [ ] **Step 5: Commit**

```bash
git add src/components/WhatsAppButton.astro .env.example
git commit -m "Add env-gated WhatsAppButton"
```

---

### Task 17: `ScrollTop` element + wiring

**Files:**
- Create: `src/components/elements/ScrollTop.astro`, `src/scripts/scrollTop.ts`

**Interfaces:**
- Consumes: `shouldShowScrollTop` from `src/lib/scrollTop.ts` (Task 5).
- Produces: `ScrollTop` Astro component, no props — consumed by `PageLayout` (add it alongside `WhatsAppButton` — update Task 15's file) and the Home page (Task 39).

- [ ] **Step 1: Grep the real class name**

Run: `grep -n "scroll-top\|scrolltop" public/assets/css/main.css`

- [ ] **Step 2: Write `src/scripts/scrollTop.ts`**

```ts
// src/scripts/scrollTop.ts
import { shouldShowScrollTop } from '../lib/scrollTop';

export function initScrollTop(button: HTMLElement): void {
  const updateVisibility = () => {
    button.classList.toggle('is-visible', shouldShowScrollTop(window.scrollY));
  };
  updateVisibility();
  window.addEventListener('scroll', updateVisibility, { passive: true });
  button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
```

- [ ] **Step 3: Write `ScrollTop.astro`**

```astro
---
// src/components/elements/ScrollTop.astro
---
<button type="button" class="scroll-top" data-scroll-top aria-label="Volver arriba">
  <!-- port exact icon/markup found alongside the scroll-top class -->
</button>

<script>
  import { initScrollTop } from '../../scripts/scrollTop';
  const button = document.querySelector<HTMLElement>('[data-scroll-top]');
  if (button) initScrollTop(button);
</script>
```

- [ ] **Step 4: Add it to `PageLayout.astro`**

In `src/layouts/PageLayout.astro` (Task 15), import and render `<ScrollTop />` next to `<WhatsAppButton />`.

- [ ] **Step 5: Verify**

Run: `pnpm build`
Expected: clean build.

- [ ] **Step 6: Commit**

```bash
git add src/components/elements/ScrollTop.astro src/scripts/scrollTop.ts src/layouts/PageLayout.astro
git commit -m "Add ScrollTop element and wire into PageLayout"
```

---

## Phase 3 — Elements (style-only primitives)

> Every markup task below follows the same pattern: grep the class name in `public/assets/css/main.css` first, read the matching block in `docs/reference/ui-kit-source/dist/ui-kit2.html`, port the structure, verify with `pnpm build`, commit. Steps are abbreviated after Task 19 to avoid repetition — apply the same 4-step pattern.

### Task 18: `Button.astro`, `Badge.astro`

**Files:**
- Create: `src/components/elements/Button.astro`, `src/components/elements/Badge.astro`

**Interfaces:**
- Produces: `Button` props `{ href?: string; label: string; variant?: 'primary' | 'secondary'; type?: 'button' | 'submit' }` (renders `<a>` if `href` is given, else `<button>`); `Badge` props `{ label: string }` — both consumed throughout Phase 5 sections and Phase 6 pages.

- [ ] **Step 1: Grep + read source**

`grep -n "button-elite" public/assets/css/main.css`; read the matching block in `docs/reference/ui-kit-source/dist/ui-kit2.html` (Elements → Botones) and `docs/reference/ui-kit-source/dist/ui-kit2.html` (Elements → Badges & Tags).

- [ ] **Step 2: Write `Button.astro`**

```astro
---
// src/components/elements/Button.astro
interface Props {
  href?: string;
  label: string;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit';
}
const { href, label, variant = 'primary', type = 'button' } = Astro.props;
const classes = ['button-elite', `button-elite--${variant}`];
---
{href ? (
  <a class:list={classes} href={href}>{label}</a>
) : (
  <button class:list={classes} type={type}>{label}</button>
)}
```

- [ ] **Step 3: Write `Badge.astro`**

```astro
---
// src/components/elements/Badge.astro
interface Props {
  label: string;
}
const { label } = Astro.props;
---
<span class="badge">{label}</span>
```

(Adjust class names in both files if Step 1's grep found different exact names than `button-elite`/`badge`.)

- [ ] **Step 4: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/elements/Button.astro src/components/elements/Badge.astro
git commit -m "Add Button and Badge elements"
```

---

### Task 19: `FormField.astro`, `Alert.astro` + `src/scripts/alerts.ts`

**Files:**
- Create: `src/components/elements/FormField.astro`, `src/components/elements/Alert.astro`, `src/scripts/alerts.ts`

**Interfaces:**
- Produces: `FormField` props `{ id: string; name: string; label: string; type: 'text' | 'email' | 'tel'; as?: 'input' | 'textarea'; required?: boolean }`; `Alert` props `{ variant: 'success' | 'error' | 'info'; message: string }` — both consumed by `ContactForm` section (Task 38) and `Newsletter` element (Task 21).

- [ ] **Step 1: Grep + read source** (`grep -n "form-panel\|sr-only" public/assets/css/main.css`; `grep -n "alert" public/assets/css/main.css`; read the matching blocks in `ui-kit2.html`).

- [ ] **Step 2: Write `FormField.astro`**

```astro
---
// src/components/elements/FormField.astro
interface Props {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel';
  as?: 'input' | 'textarea';
  required?: boolean;
}
const { id, name, label, type, as = 'input', required = false } = Astro.props;
---
<div class="form-field">
  <label class="sr-only" for={id}>{label}</label>
  {as === 'textarea' ? (
    <textarea id={id} name={name} placeholder={label} required={required}></textarea>
  ) : (
    <input id={id} name={name} type={type} placeholder={label} required={required} />
  )}
</div>
```

- [ ] **Step 3: Write `Alert.astro`**

```astro
---
// src/components/elements/Alert.astro
interface Props {
  variant: 'success' | 'error' | 'info';
  message: string;
}
const { variant, message } = Astro.props;
---
<div class:list={['alert', `alert--${variant}`]} data-alert role="status">
  <p>{message}</p>
  <button type="button" data-alert-dismiss aria-label="Cerrar">&times;</button>
</div>
```

- [ ] **Step 4: Write `src/scripts/alerts.ts`**

```ts
// src/scripts/alerts.ts
export function initAlerts(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-alert]').forEach((alert) => {
    const dismissBtn = alert.querySelector<HTMLButtonElement>('[data-alert-dismiss]');
    dismissBtn?.addEventListener('click', () => alert.remove());
  });
}
```

- [ ] **Step 5: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/elements/FormField.astro src/components/elements/Alert.astro src/scripts/alerts.ts
git commit -m "Add FormField and Alert elements with dismiss wiring"
```

---

### Task 20: `Divider.astro`, `Newsletter.astro` + `src/scripts/newsletter.ts`

**Files:**
- Create: `src/components/elements/Divider.astro`, `src/components/elements/Newsletter.astro`, `src/scripts/newsletter.ts`

**Interfaces:**
- Consumes: `validateEmail` from `src/lib/validateEmail.ts` (Task 8), `FormField`, `Button`, `Alert` (Tasks 18–19).
- Produces: `Newsletter` props `{ heading: string }` — consumed by `Footer.astro` (update Task 13's file to render it in the appropriate column).

Feedback is shown via the `Alert` element (Task 19), not raw text: both a success and an error `Alert` are pre-rendered hidden, and the script toggles which one is visible — this is what actually gives `Alert` real usage in the site (grep for `Alert` importers after this task to confirm it's no longer orphaned).

- [ ] **Step 1: Grep + read source** (`divider`, `newsletter` classes in `main.css`; matching blocks in `ui-kit2.html`).

- [ ] **Step 2: Write `Divider.astro`**

```astro
---
// src/components/elements/Divider.astro
---
<hr class="divider" />
```

- [ ] **Step 3: Write `src/scripts/newsletter.ts`**

```ts
// src/scripts/newsletter.ts
import { validateEmail } from '../lib/validateEmail';

export function initNewsletter(form: HTMLFormElement): void {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = form.querySelector<HTMLInputElement>('input[type="email"]');
    const email = input?.value ?? '';
    const successAlert = form.querySelector<HTMLElement>('[data-newsletter-success]');
    const errorAlert = form.querySelector<HTMLElement>('[data-newsletter-error]');
    if (!successAlert || !errorAlert) return;

    if (validateEmail(email)) {
      successAlert.hidden = false;
      errorAlert.hidden = true;
      // TODO: send `email` to a real newsletter provider once one is chosen.
      form.reset();
    } else {
      errorAlert.hidden = false;
      successAlert.hidden = true;
    }
  });
}
```

- [ ] **Step 4: Write `Newsletter.astro`**

```astro
---
// src/components/elements/Newsletter.astro
import FormField from './FormField.astro';
import Button from './Button.astro';
import Alert from './Alert.astro';

interface Props {
  heading: string;
}
const { heading } = Astro.props;
---
<div class="newsletter">
  <h3>{heading}</h3>
  <form data-newsletter>
    <FormField id="newsletter-email" name="email" label="Tu correo" type="email" required />
    <Button label="Suscribirme" type="submit" />
    <div data-newsletter-success hidden>
      <Alert variant="success" message="¡Gracias por suscribirte!" />
    </div>
    <div data-newsletter-error hidden>
      <Alert variant="error" message="Ingresa un correo válido." />
    </div>
  </form>
</div>

<script>
  import { initNewsletter } from '../../scripts/newsletter';
  document.querySelectorAll<HTMLFormElement>('[data-newsletter]').forEach(initNewsletter);
</script>
```

- [ ] **Step 5: Wire into `Footer.astro`**

Edit `src/components/sections/Footer.astro` (Task 13) to import and render `<Newsletter heading="Mantente informado" />` in its dark band area, matching where the source shows the newsletter form.

- [ ] **Step 6: Verify + commit**

Run: `pnpm build`. Then:

```bash
git add src/components/elements/Divider.astro src/components/elements/Newsletter.astro src/scripts/newsletter.ts src/components/sections/Footer.astro
git commit -m "Add Divider and Newsletter elements, wire Newsletter into Footer"
```

---

### Task 21: `Stepper.astro`, `Tabs.astro` + `src/scripts/cookieBanner.ts` + `CookieBanner.astro`

**Files:**
- Create: `src/components/elements/Stepper.astro`, `src/components/elements/Tabs.astro`, `src/components/elements/CookieBanner.astro`, `src/scripts/cookieBanner.ts`

**Interfaces:**
- Consumes: `hasAcceptedCookies`, `acceptCookies` from `src/lib/cookieConsent.ts` (Task 10).
- Produces: `Stepper` props `{ steps: { label: string }[]; activeIndex: number }` — consumed by the "Cómo trabajamos" block on `/servicios` (Task 41). `Tabs` props `{ tabs: { id: string; label: string }[]; activeId: string }`, emitting `data-tab-button` elements with `data-tab-id` — consumed by `PricingTabs` section (Task 36). `CookieBanner`, no props — consumed by `BaseLayout.astro` (update Task 11's file).

- [ ] **Step 1: Grep + read source** (`stepper`, `tabs`, `cookie-banner` classes in `main.css`; matching blocks in `ui-kit2.html`).

- [ ] **Step 2: Write `Stepper.astro`**

```astro
---
// src/components/elements/Stepper.astro
interface Props {
  steps: { label: string }[];
  activeIndex: number;
}
const { steps, activeIndex } = Astro.props;
---
<ol class="stepper">
  {steps.map((step, index) => (
    <li class:list={['stepper__step', { 'is-active': index === activeIndex, 'is-done': index < activeIndex }]}>
      {step.label}
    </li>
  ))}
</ol>
```

- [ ] **Step 3: Write `Tabs.astro`**

```astro
---
// src/components/elements/Tabs.astro
interface Props {
  tabs: { id: string; label: string }[];
  activeId: string;
}
const { tabs, activeId } = Astro.props;
---
<div class="tabs" role="tablist" data-tabs>
  {tabs.map((tab) => (
    <button
      type="button"
      class:list={['tabs__button', { 'is-active': tab.id === activeId }]}
      data-tab-button
      data-tab-id={tab.id}
      role="tab"
      aria-selected={tab.id === activeId}
    >
      {tab.label}
    </button>
  ))}
</div>
```

- [ ] **Step 4: Write `src/scripts/cookieBanner.ts`**

```ts
// src/scripts/cookieBanner.ts
import { hasAcceptedCookies, acceptCookies } from '../lib/cookieConsent';

export function initCookieBanner(banner: HTMLElement): void {
  if (hasAcceptedCookies(window.localStorage)) {
    banner.remove();
    return;
  }
  const acceptBtn = banner.querySelector<HTMLButtonElement>('[data-cookie-accept]');
  acceptBtn?.addEventListener('click', () => {
    acceptCookies(window.localStorage);
    banner.remove();
  });
}
```

- [ ] **Step 5: Write `CookieBanner.astro`**

```astro
---
// src/components/elements/CookieBanner.astro
---
<div class="cookie-banner" data-cookie-banner>
  <p>Usamos cookies para mejorar tu experiencia.</p>
  <button type="button" class="button-elite" data-cookie-accept>Aceptar</button>
</div>

<script>
  import { initCookieBanner } from '../../scripts/cookieBanner';
  const banner = document.querySelector<HTMLElement>('[data-cookie-banner]');
  if (banner) initCookieBanner(banner);
</script>
```

- [ ] **Step 6: Wire into `BaseLayout.astro`**

Edit `src/layouts/BaseLayout.astro` (Task 11) to import and render `<CookieBanner />` just before `</body>`.

- [ ] **Step 7: Verify + commit**

Run: `pnpm build`. Then:

```bash
git add src/components/elements/Stepper.astro src/components/elements/Tabs.astro src/components/elements/CookieBanner.astro src/scripts/cookieBanner.ts src/layouts/BaseLayout.astro
git commit -m "Add Stepper, Tabs, CookieBanner elements and wire CookieBanner into BaseLayout"
```

---

### Task 22: `CardServiceItem.astro`, `CardProjectItem.astro`

**Files:**
- Create: `src/components/elements/CardServiceItem.astro`, `src/components/elements/CardProjectItem.astro`

**Interfaces:**
- Consumes: `CollectionEntry<'services'>` and `CollectionEntry<'projects'>` types from `astro:content` (defined in Task 28 — if built before Task 28, use inline prop types matching that task's schema exactly: services `{ title: string; icon: string; shortDescription: string; image?: string }`, projects `{ title: string; category: string; image: string; shortDescription: string }`); `Badge` from `./Badge.astro` (Task 18).
- Produces: `CardServiceItem` props `{ title: string; icon: string; shortDescription: string; href: string }`; `CardProjectItem` props `{ title: string; category: string; image: string; href: string }` — both consumed by `ServicesSection`/`ProjectsSection` (Tasks 32–33) and their listing pages (Tasks 41–42).

- [ ] **Step 1: Grep + read source** (`card-service-item`, `card-project-item` in `main.css`; matching blocks in `ui-kit2.html`).

- [ ] **Step 2: Write `CardServiceItem.astro`**

```astro
---
// src/components/elements/CardServiceItem.astro
interface Props {
  title: string;
  icon: string;
  shortDescription: string;
  href: string;
}
const { title, icon, shortDescription, href } = Astro.props;
---
<a class="card-service-item" href={href}>
  <i data-lucide={icon}></i>
  <h3>{title}</h3>
  <p>{shortDescription}</p>
</a>
```

- [ ] **Step 3: Write `CardProjectItem.astro`**

```astro
---
// src/components/elements/CardProjectItem.astro
import Badge from './Badge.astro';

interface Props {
  title: string;
  category: string;
  image: string;
  href: string;
}
const { title, category, image, href } = Astro.props;
---
<a class="card-project-item" href={href}>
  <img src={image} alt={title} loading="lazy" />
  <Badge label={category} />
  <h3>{title}</h3>
</a>
```

Note: this task depends on `Badge.astro` existing (Task 18) — if executed out of order, build `Badge.astro` first.

- [ ] **Step 4: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/elements/CardServiceItem.astro src/components/elements/CardProjectItem.astro
git commit -m "Add CardServiceItem and CardProjectItem elements"
```

---

### Task 23: `CardMetric.astro`, `CardGhost.astro`, `CardFeature.astro`

**Files:**
- Create: `src/components/elements/CardMetric.astro`, `src/components/elements/CardGhost.astro`, `src/components/elements/CardFeature.astro`

**Interfaces:**
- Produces: `CardMetric` props `{ value: string; caption: string }` — consumed by `TestimonialsSection` (Task 34) for the stat callout. `CardGhost` props `{ title: string; description: string; ctaLabel: string; ctaHref: string }` — consumed by the FAQ page (Task 47). `CardFeature` props `{ icon: string; title: string; description: string }` — consumed by the About page (Task 40).

- [ ] **Step 1: Grep + read source** (`card-metric-item`, `card-ghost-item`, `card-feature`/`card-context-elite` in `main.css`; matching blocks in `ui-kit2.html`).

- [ ] **Step 2: Write `CardMetric.astro`**

```astro
---
// src/components/elements/CardMetric.astro
interface Props {
  value: string;
  caption: string;
}
const { value, caption } = Astro.props;
---
<div class="card-metric-item">
  <strong>{value}</strong>
  <span>{caption}</span>
</div>
```

- [ ] **Step 3: Write `CardGhost.astro`**

```astro
---
// src/components/elements/CardGhost.astro
import Button from './Button.astro';

interface Props {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}
const { title, description, ctaLabel, ctaHref } = Astro.props;
---
<div class="card-ghost-item">
  <h3>{title}</h3>
  <p>{description}</p>
  <Button label={ctaLabel} href={ctaHref} variant="secondary" />
</div>
```

- [ ] **Step 4: Write `CardFeature.astro`**

```astro
---
// src/components/elements/CardFeature.astro
interface Props {
  icon: string;
  title: string;
  description: string;
}
const { icon, title, description } = Astro.props;
---
<div class="card-feature">
  <i data-lucide={icon}></i>
  <h3>{title}</h3>
  <p>{description}</p>
</div>
```

- [ ] **Step 5: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/elements/CardMetric.astro src/components/elements/CardGhost.astro src/components/elements/CardFeature.astro
git commit -m "Add CardMetric, CardGhost, CardFeature elements"
```

---

### Task 24: `TeamItemMetal.astro`, `ProgressBarMetal.astro`

**Files:**
- Create: `src/components/elements/TeamItemMetal.astro`, `src/components/elements/ProgressBarMetal.astro`

**Interfaces:**
- Produces: `TeamItemMetal` props `{ name: string; role: string; photo: string }` — consumed by `TeamGrid` section (Task 37). `ProgressBarMetal` props `{ label: string; percent: number }` — consumed by the About page (Task 40).

- [ ] **Step 1: Grep + read source** (`team-item-metal`, `progress-bar-metal` in `main.css`; matching blocks in `ui-kit2.html`).

- [ ] **Step 2: Write `TeamItemMetal.astro`**

```astro
---
// src/components/elements/TeamItemMetal.astro
interface Props {
  name: string;
  role: string;
  photo: string;
}
const { name, role, photo } = Astro.props;
---
<div class="team-item-metal">
  <img src={photo} alt={name} loading="lazy" />
  <h3>{name}</h3>
  <p>{role}</p>
</div>
```

- [ ] **Step 3: Write `ProgressBarMetal.astro`**

```astro
---
// src/components/elements/ProgressBarMetal.astro
interface Props {
  label: string;
  percent: number;
}
const { label, percent } = Astro.props;
---
<div class="progress-bar-metal">
  <span class="progress-bar-metal__label">{label} — {percent}%</span>
  <div class="progress-bar-metal__track">
    <div class="progress-bar-metal__fill" style={`width: ${percent}%`}></div>
  </div>
</div>
```

- [ ] **Step 4: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/elements/TeamItemMetal.astro src/components/elements/ProgressBarMetal.astro
git commit -m "Add TeamItemMetal and ProgressBarMetal elements"
```

---

### Task 25: `PostCard.astro`, `GoogleRatingBox.astro`

**Files:**
- Create: `src/components/elements/PostCard.astro`, `src/components/elements/GoogleRatingBox.astro`

**Interfaces:**
- Produces: `PostCard` props `{ title: string; excerpt: string; image: string; publishDate: string; href: string }` — consumed by the Blog listing page (Task 43). `GoogleRatingBox` props `{ rating: number; reviewCount: number }` — consumed by the Testimonials page (Task 46).

- [ ] **Step 1: Grep + read source** (`post-card`, `google-rating-box` in `main.css`; matching blocks in `ui-kit2.html`).

- [ ] **Step 2: Write `PostCard.astro`**

```astro
---
// src/components/elements/PostCard.astro
interface Props {
  title: string;
  excerpt: string;
  image: string;
  publishDate: string;
  href: string;
}
const { title, excerpt, image, publishDate, href } = Astro.props;
---
<a class="post-card" href={href}>
  <img src={image} alt={title} loading="lazy" />
  <time datetime={publishDate}>{publishDate}</time>
  <h3>{title}</h3>
  <p>{excerpt}</p>
</a>
```

- [ ] **Step 3: Write `GoogleRatingBox.astro`**

```astro
---
// src/components/elements/GoogleRatingBox.astro
interface Props {
  rating: number;
  reviewCount: number;
}
const { rating, reviewCount } = Astro.props;
---
<div class="google-rating-box">
  <strong>{rating.toFixed(1)}</strong>
  <span>{reviewCount} reseñas en Google</span>
</div>
```

- [ ] **Step 4: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/elements/PostCard.astro src/components/elements/GoogleRatingBox.astro
git commit -m "Add PostCard and GoogleRatingBox elements"
```

---

### Task 26: `PreviewVideo.astro`, `ExpertiseItemElite.astro`, `SpecialQuote.astro`, `ContactStrip.astro`

**Files:**
- Create: `src/components/elements/PreviewVideo.astro`, `src/components/elements/ExpertiseItemElite.astro`, `src/components/elements/SpecialQuote.astro`, `src/components/elements/ContactStrip.astro`

**Interfaces:**
- Produces: `PreviewVideo` props `{ posterImage: string; videoSrc: string }`; `ExpertiseItemElite` props `{ icon: string; title: string; description: string }`; `SpecialQuote` props `{ quote: string; author: string }`; `ContactStrip` props `{ phone: string; email: string; address: string }` — all four consumed by the About page (Task 40) and `Footer.astro` (`ContactStrip`, update Task 13's file).

- [ ] **Step 1: Grep + read source** (`preview-video`, `expertise-item-elite`, `special-quote`, `contact-strip` in `main.css`; matching blocks in `ui-kit2.html`).

- [ ] **Step 2: Write `PreviewVideo.astro`**

```astro
---
// src/components/elements/PreviewVideo.astro
interface Props {
  posterImage: string;
  videoSrc?: string;
}
const { posterImage, videoSrc } = Astro.props;
---
<div class="preview-video">
  {videoSrc ? (
    <video poster={posterImage} controls preload="none">
      <source src={videoSrc} type="video/mp4" />
    </video>
  ) : (
    <button type="button" class="preview-video__poster" style={`background-image: url(${posterImage})`} aria-label="Reproducir video">
      <i data-lucide="play"></i>
    </button>
  )}
</div>
```

No real video file exists in the source UI-kit (only the poster image) — leave `videoSrc` unset in every usage until a real video asset is sourced. Do not invent a fake `.mp4` path; a missing/broken media reference is worse than the poster-only fallback above.

- [ ] **Step 3: Write `ExpertiseItemElite.astro`**

```astro
---
// src/components/elements/ExpertiseItemElite.astro
interface Props {
  icon: string;
  title: string;
  description: string;
}
const { icon, title, description } = Astro.props;
---
<div class="expertise-item-elite">
  <i data-lucide={icon}></i>
  <h3>{title}</h3>
  <p>{description}</p>
</div>
```

- [ ] **Step 4: Write `SpecialQuote.astro`**

```astro
---
// src/components/elements/SpecialQuote.astro
interface Props {
  quote: string;
  author: string;
}
const { quote, author } = Astro.props;
---
<blockquote class="special-quote">
  <p>{quote}</p>
  <cite>{author}</cite>
</blockquote>
```

- [ ] **Step 5: Write `ContactStrip.astro`**

```astro
---
// src/components/elements/ContactStrip.astro
interface Props {
  phone: string;
  email: string;
  address: string;
}
const { phone, email, address } = Astro.props;
---
<div class="contact-strip">
  <a href={`tel:${phone}`}>{phone}</a>
  <a href={`mailto:${email}`}>{email}</a>
  <span>{address}</span>
</div>
```

- [ ] **Step 6: Wire `ContactStrip` into `Footer.astro`**

Edit `src/components/sections/Footer.astro` (Task 13) to render `<ContactStrip phone="+51 1 234 5678" email="contacto@finanze.com" address="Lima, Perú" />` in the "About Company" column.

- [ ] **Step 7: Verify + commit**

Run: `pnpm build`. Then:

```bash
git add src/components/elements/PreviewVideo.astro src/components/elements/ExpertiseItemElite.astro src/components/elements/SpecialQuote.astro src/components/elements/ContactStrip.astro src/components/sections/Footer.astro
git commit -m "Add PreviewVideo, ExpertiseItemElite, SpecialQuote, ContactStrip elements"
```

---

## Phase 4 — Content collections

### Task 27: `src/content/config.ts` + seed data for all 6 collections

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/services/{wealth-management,financial-planning,business-consulting,risk-compliance}.md`
- Create: `src/content/projects/{startup-financial-strategy,financial-risk-analysis,corporate-growth-strategy}.md`
- Create: `src/content/testimonials/{ana-torres,carlos-mendez,lucia-flores}.json`
- Create: `src/content/plans/{basic,pro,enterprise}.json`
- Create: `src/content/posts/{top-investment-strategies,tax-planning-guide,risk-management-basics}.md`
- Create: `src/content/team/{maria-gonzalez,jorge-ramirez}.json`

**Interfaces:**
- Produces: `astro:content` collections `services`, `projects`, `testimonials`, `plans`, `posts`, `team` with the schemas below — consumed by every section in Phase 5 and every listing/detail page in Phase 6 via `getCollection('<name>')` / `getEntryBySlug`.

- [ ] **Step 1: Write `src/content/config.ts`**

```ts
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const services = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    icon: z.string(),
    shortDescription: z.string(),
    image: z.string().optional(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.string(),
    image: z.string(),
    shortDescription: z.string(),
  }),
});

const testimonials = defineCollection({
  type: 'data',
  schema: z.object({
    avatar: z.string(),
    name: z.string(),
    role: z.string(),
    rating: z.number().min(1).max(5),
    quote: z.string(),
    stat: z.string().optional(),
    statCaption: z.string().optional(),
  }),
});

const plans = defineCollection({
  type: 'data',
  schema: z.object({
    planName: z.string(),
    icon: z.string(),
    price: z.string(),
    features: z.array(z.string()),
    highlighted: z.boolean(),
  }),
});

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    image: z.string(),
    publishDate: z.string(),
    author: z.string().optional(),
  }),
});

const team = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    role: z.string(),
    photo: z.string(),
  }),
});

export const collections = { services, projects, testimonials, plans, posts, team };
```

- [ ] **Step 2: Seed `services` (4 entries)**

```md
---
title: "Wealth Management"
icon: "trending-up"
shortDescription: "Estrategias de inversión personalizadas para hacer crecer tu patrimonio a largo plazo."
image: "/assets/img/lib/service-image-2-elite.jpg"
---

Nuestro equipo diseña estrategias de gestión patrimonial adaptadas a tus objetivos financieros, combinando análisis de riesgo con oportunidades de crecimiento sostenido.
```

(File: `src/content/services/wealth-management.md`. Repeat this shape for `financial-planning.md` — icon `pie-chart`, image `service-image-3-elite.jpg`; `business-consulting.md` — icon `briefcase`, image `service-image-4-elite.jpg`; `risk-compliance.md` — icon `shield-check`, no image — each with a distinct title/description matching the spec's §8 content hints.)

- [ ] **Step 3: Seed `projects` (3 entries)**

```md
---
title: "Startup financial strategy development"
category: "Estrategia"
image: "/assets/img/lib/project-1.jpg"
shortDescription: "Diseño de estrategia financiera integral para una startup en etapa de crecimiento."
---

Desarrollamos un plan financiero completo, desde proyecciones de flujo de caja hasta estrategia de levantamiento de capital.
```

(File: `src/content/projects/startup-financial-strategy.md`. Repeat for `financial-risk-analysis.md` — category "Riesgo", image `project-2.jpg`; `corporate-growth-strategy.md` — category "Crecimiento", image `project-3.jpg`.)

- [ ] **Step 4: Seed `testimonials` (3 entries)**

```json
{
  "avatar": "/assets/img/lib/post-1.jpg",
  "name": "Ana Torres",
  "role": "CEO, Torres Capital",
  "rating": 5,
  "quote": "Finanze transformó nuestra estrategia financiera por completo.",
  "stat": "65%",
  "statCaption": "Crecimiento en alianzas estratégicas"
}
```

(File: `src/content/testimonials/ana-torres.json`. Repeat for `carlos-mendez.json` and `lucia-flores.json` with distinct names/roles/quotes, `stat`/`statCaption` optional on those two.)

- [ ] **Step 5: Seed `plans` (3 entries)**

```json
{
  "planName": "Basic Plan",
  "icon": "circle",
  "price": "$490",
  "features": ["Diagnóstico financiero inicial", "1 sesión de asesoría mensual", "Reporte trimestral"],
  "highlighted": false
}
```

(File: `src/content/plans/basic.json`. Repeat for `pro.json` — price `"$990"`, `highlighted: true`, more features; `enterprise.json` — price `"Custom"`, `highlighted: false`.)

- [ ] **Step 6: Seed `posts` (3 entries)**

```md
---
title: "Top Investment Strategies for Long Term Wealth"
excerpt: "Cinco estrategias probadas para construir patrimonio a largo plazo."
image: "/assets/img/lib/post-1.jpg"
publishDate: "2026-05-10"
author: "Equipo Finanze"
---

Explorar diversificación, horizonte de inversión y tolerancia al riesgo como pilares de una estrategia de largo plazo.
```

(File: `src/content/posts/top-investment-strategies.md`. Repeat for `tax-planning-guide.md` and `risk-management-basics.md` with distinct titles/excerpts/dates.)

- [ ] **Step 7: Seed `team` (2 entries)**

```json
{
  "name": "María González",
  "role": "Directora de Estrategia Financiera",
  "photo": "/assets/img/lib/post-2.jpg"
}
```

(File: `src/content/team/maria-gonzalez.json`. Repeat for `jorge-ramirez.json` — role "Consultor Senior de Riesgo".)

- [ ] **Step 8: Verify collections load**

Run: `pnpm astro check && pnpm build`
Expected: no schema validation errors.

- [ ] **Step 9: Commit**

```bash
git add src/content
git commit -m "Add content collections config and seed data for all 6 collections"
```

---

## Phase 5 — Sections

> Each section task: grep the relevant class(es) in `main.css`, read the matching block in the reference HTML, port structure, wire any collection query via `getCollection()`, verify with `pnpm build`, commit.

### Task 28: `Hero.astro` (slider) + `src/scripts/heroSlider.ts`

**Files:**
- Create: `src/components/sections/Hero.astro`, `src/scripts/heroSlider.ts`

**Interfaces:**
- Consumes: `Nav` with `theme="dark-hero"` (Task 12), `Button` (Task 18).
- Produces: `Hero` props `{ slides: { title: string; subtitle: string; image: string; ctaLabel: string; ctaHref: string }[] }` — consumed by the Home page (Task 39).

- [ ] **Step 1: Read the source markup**

Open `docs/reference/ui-kit-source/dist/hero-slider.html` for the full isolated `hero-elite-slider` structure (this is cleaner to port from than the combined block in `index.html`).

- [ ] **Step 2: Write `src/scripts/heroSlider.ts`**

```ts
// src/scripts/heroSlider.ts
declare global {
  interface Window {
    Swiper: new (el: string, options: Record<string, unknown>) => unknown;
  }
}

export function initHeroSlider(): void {
  new window.Swiper('.hero-elite-slider', {
    loop: true,
    autoplay: { delay: 6000 },
    effect: 'fade',
    pagination: { el: '.swiper-pagination', clickable: true },
  });
}
```

- [ ] **Step 3: Write `Hero.astro`**

```astro
---
// src/components/sections/Hero.astro
import Nav from './Nav.astro';
import Button from '../elements/Button.astro';

interface Slide {
  title: string;
  subtitle: string;
  image: string;
  ctaLabel: string;
  ctaHref: string;
}
interface Props {
  slides: Slide[];
}
const { slides } = Astro.props;
---
<section class="hero-elite-slider swiper">
  <Nav theme="dark-hero" />
  <div class="swiper-wrapper">
    {slides.map((slide) => (
      <div class="swiper-slide" style={`background-image: url(${slide.image})`}>
        <h1>{slide.title}</h1>
        <p>{slide.subtitle}</p>
        <Button label={slide.ctaLabel} href={slide.ctaHref} />
      </div>
    ))}
  </div>
  <div class="swiper-pagination"></div>
</section>

<script>
  import { initHeroSlider } from '../../scripts/heroSlider';
  initHeroSlider();
</script>
```

- [ ] **Step 4: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/sections/Hero.astro src/scripts/heroSlider.ts
git commit -m "Add Hero slider section"
```

---

### Task 29: `Marquee.astro`

**Files:**
- Create: `src/components/sections/Marquee.astro`

**Interfaces:**
- Produces: `Marquee` props `{ items: string[] }` — consumed by the Home page (Task 39).

- [ ] **Step 1: Read source** (`marquee-section` in `index.html`).

- [ ] **Step 2: Write `Marquee.astro`**

```astro
---
// src/components/sections/Marquee.astro
interface Props {
  items: string[];
}
const { items } = Astro.props;
---
<section class="marquee-section">
  <div class="marquee-section__track">
    {items.map((item) => <span>{item}</span>)}
    {items.map((item) => <span aria-hidden="true">{item}</span>)}
  </div>
</section>
```

- [ ] **Step 3: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/sections/Marquee.astro
git commit -m "Add Marquee section"
```

---

### Task 30: `AboutSection.astro`

**Files:**
- Create: `src/components/sections/AboutSection.astro`

**Interfaces:**
- Consumes: `ExpertiseItemElite` (Task 26).
- Produces: `AboutSection` props `{ heading: string; items: { icon: string; title: string; description: string }[] }` — consumed by the Home page (Task 39) and the About page (Task 40).

- [ ] **Step 1: Read source** (`#about` block in `index.html`).

- [ ] **Step 2: Write `AboutSection.astro`**

```astro
---
// src/components/sections/AboutSection.astro
import ExpertiseItemElite from '../elements/ExpertiseItemElite.astro';

interface Item {
  icon: string;
  title: string;
  description: string;
}
interface Props {
  heading: string;
  items: Item[];
}
const { heading, items } = Astro.props;
---
<section id="about" class="about-section">
  <h2>{heading}</h2>
  <div class="about-section__grid">
    {items.map((item) => (
      <ExpertiseItemElite icon={item.icon} title={item.title} description={item.description} />
    ))}
  </div>
</section>
```

- [ ] **Step 3: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/sections/AboutSection.astro
git commit -m "Add AboutSection"
```

---

### Task 31: `ServicesSection.astro` + `src/scripts/servicesSlider.ts`

**Files:**
- Create: `src/components/sections/ServicesSection.astro`, `src/scripts/servicesSlider.ts`

**Interfaces:**
- Consumes: `CardServiceItem` (Task 22), `getCollection('services')` from `astro:content`.
- Produces: `ServicesSection` props `{ services: CollectionEntry<'services'>[] }` — consumed by the Home page (Task 39).

- [ ] **Step 1: Read source** (`#services` block in `index.html`).

- [ ] **Step 2: Write `src/scripts/servicesSlider.ts`**

```ts
// src/scripts/servicesSlider.ts
declare global {
  interface Window {
    Swiper: new (el: string, options: Record<string, unknown>) => unknown;
  }
}

export function initServicesSlider(): void {
  new window.Swiper('.services-slider', {
    slidesPerView: 1,
    breakpoints: {
      768: { slidesPerView: 2 },
      1024: { slidesPerView: 4 },
    },
  });
}
```

- [ ] **Step 3: Write `ServicesSection.astro`**

```astro
---
// src/components/sections/ServicesSection.astro
import type { CollectionEntry } from 'astro:content';
import CardServiceItem from '../elements/CardServiceItem.astro';

interface Props {
  services: CollectionEntry<'services'>[];
}
const { services } = Astro.props;
---
<section id="services" class="services-section">
  <h2>Nuestros servicios</h2>
  <div class="services-slider swiper">
    <div class="swiper-wrapper">
      {services.map((service) => (
        <div class="swiper-slide">
          <CardServiceItem
            title={service.data.title}
            icon={service.data.icon}
            shortDescription={service.data.shortDescription}
            href={`/servicios/${service.slug}`}
          />
        </div>
      ))}
    </div>
  </div>
  <a class="button-elite" href="/servicios">Ver todos los servicios</a>
</section>

<script>
  import { initServicesSlider } from '../../scripts/servicesSlider';
  initServicesSlider();
</script>
```

- [ ] **Step 4: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/sections/ServicesSection.astro src/scripts/servicesSlider.ts
git commit -m "Add ServicesSection with slider"
```

---

### Task 32: `ProjectsSection.astro` + `src/scripts/projectsSlider.ts`

**Files:**
- Create: `src/components/sections/ProjectsSection.astro`, `src/scripts/projectsSlider.ts`

**Interfaces:**
- Consumes: `CardProjectItem` (Task 22), `getCollection('projects')`.
- Produces: `ProjectsSection` props `{ projects: CollectionEntry<'projects'>[] }` — consumed by the Home page (Task 39).

- [ ] **Step 1: Read source** (`#projects` block in `index.html`).

- [ ] **Step 2: Write `src/scripts/projectsSlider.ts`** (same shape as Task 31 Step 2, targeting `.projects-slider`).

```ts
// src/scripts/projectsSlider.ts
declare global {
  interface Window {
    Swiper: new (el: string, options: Record<string, unknown>) => unknown;
  }
}

export function initProjectsSlider(): void {
  new window.Swiper('.projects-slider', {
    slidesPerView: 1,
    breakpoints: {
      768: { slidesPerView: 2 },
      1024: { slidesPerView: 3 },
    },
  });
}
```

- [ ] **Step 3: Write `ProjectsSection.astro`**

```astro
---
// src/components/sections/ProjectsSection.astro
import type { CollectionEntry } from 'astro:content';
import CardProjectItem from '../elements/CardProjectItem.astro';

interface Props {
  projects: CollectionEntry<'projects'>[];
}
const { projects } = Astro.props;
---
<section id="projects" class="projects-section">
  <h2>Real results for real businesses</h2>
  <div class="projects-slider swiper">
    <div class="swiper-wrapper">
      {projects.map((project) => (
        <div class="swiper-slide">
          <CardProjectItem
            title={project.data.title}
            category={project.data.category}
            image={project.data.image}
            href={`/proyectos/${project.slug}`}
          />
        </div>
      ))}
    </div>
  </div>
  <a class="button-elite" href="/proyectos">Ver todos los proyectos</a>
</section>

<script>
  import { initProjectsSlider } from '../../scripts/projectsSlider';
  initProjectsSlider();
</script>
```

- [ ] **Step 4: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/sections/ProjectsSection.astro src/scripts/projectsSlider.ts
git commit -m "Add ProjectsSection with slider"
```

---

### Task 33: `TestimonialsSection.astro`

**Files:**
- Create: `src/components/sections/TestimonialsSection.astro`

**Interfaces:**
- Consumes: `CardMetric` (Task 23), `getCollection('testimonials')`.
- Produces: `TestimonialsSection` props `{ testimonials: CollectionEntry<'testimonials'>[] }` — consumed by the Home page (Task 39) and Testimonials page (Task 46).

- [ ] **Step 1: Read source** (`#testimonials` block in `index.html`, `testimonial-item` in `ui-kit2.html`).

- [ ] **Step 2: Write `TestimonialsSection.astro`**

```astro
---
// src/components/sections/TestimonialsSection.astro
import type { CollectionEntry } from 'astro:content';
import CardMetric from '../elements/CardMetric.astro';

interface Props {
  testimonials: CollectionEntry<'testimonials'>[];
}
const { testimonials } = Astro.props;
---
<section id="testimonials" class="testimonials-section">
  <h2>Lo que dicen nuestros clientes</h2>
  <div class="testimonials-section__grid">
    {testimonials.map((testimonial) => (
      <article class="testimonial-item">
        <img src={testimonial.data.avatar} alt={testimonial.data.name} loading="lazy" />
        <h3>{testimonial.data.name}</h3>
        <p>{testimonial.data.role}</p>
        <div class="testimonial-item__rating" aria-label={`${testimonial.data.rating} de 5 estrellas`}>
          {Array.from({ length: 5 }).map((_, index) => (
            <i data-lucide="star" class:list={{ 'is-filled': index < testimonial.data.rating }}></i>
          ))}
        </div>
        <p>{testimonial.data.quote}</p>
        {testimonial.data.stat && testimonial.data.statCaption && (
          <CardMetric value={testimonial.data.stat} caption={testimonial.data.statCaption} />
        )}
      </article>
    ))}
  </div>
</section>
```

- [ ] **Step 3: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/sections/TestimonialsSection.astro
git commit -m "Add TestimonialsSection"
```

---

### Task 34: `FaqAccordion.astro` + `src/scripts/faqAccordion.ts`

**Files:**
- Create: `src/components/sections/FaqAccordion.astro`, `src/scripts/faqAccordion.ts`

**Interfaces:**
- Consumes: `toggleFaqItem` from `src/lib/faqAccordion.ts` (Task 6).
- Produces: `FaqAccordion` props `{ items: { question: string; answer: string }[] }` — consumed by the FAQ page (Task 47).

- [ ] **Step 1: Read source** (`faq` accordion block in `ui-kit2.html`).

- [ ] **Step 2: Write `src/scripts/faqAccordion.ts`**

```ts
// src/scripts/faqAccordion.ts
import { toggleFaqItem } from '../lib/faqAccordion';

export function initFaqAccordion(root: HTMLElement): void {
  let openIndex: number | null = null;
  const items = Array.from(root.querySelectorAll<HTMLElement>('[data-faq-item]'));

  items.forEach((item, index) => {
    const trigger = item.querySelector<HTMLButtonElement>('[data-faq-trigger]');
    trigger?.addEventListener('click', () => {
      openIndex = toggleFaqItem(openIndex, index);
      items.forEach((otherItem, otherIndex) => {
        otherItem.classList.toggle('is-open', otherIndex === openIndex);
      });
    });
  });
}
```

- [ ] **Step 3: Write `FaqAccordion.astro`**

```astro
---
// src/components/sections/FaqAccordion.astro
interface Item {
  question: string;
  answer: string;
}
interface Props {
  items: Item[];
}
const { items } = Astro.props;
---
<div class="faq" data-faq>
  {items.map((item) => (
    <div class="faq__item" data-faq-item>
      <button type="button" class="faq__trigger" data-faq-trigger>{item.question}</button>
      <div class="faq__answer">
        <p>{item.answer}</p>
      </div>
    </div>
  ))}
</div>

<script>
  import { initFaqAccordion } from '../../scripts/faqAccordion';
  const faq = document.querySelector<HTMLElement>('[data-faq]');
  if (faq) initFaqAccordion(faq);
</script>
```

- [ ] **Step 4: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/sections/FaqAccordion.astro src/scripts/faqAccordion.ts
git commit -m "Add FaqAccordion section wired to toggleFaqItem"
```

---

### Task 35: `PricingTabs.astro` + `src/scripts/pricingTabs.ts`

**Files:**
- Create: `src/components/sections/PricingTabs.astro`, `src/scripts/pricingTabs.ts`

**Interfaces:**
- Consumes: `getActiveTab` from `src/lib/pricingTabs.ts` (Task 7), `Tabs` element (Task 21), `getCollection('plans')`.
- Produces: `PricingTabs` props `{ plans: CollectionEntry<'plans'>[] }` — consumed by the Planes page (Task 45).

- [ ] **Step 1: Read source** (`pricing-tab-item` in `ui-kit2.html`).

- [ ] **Step 2: Write `src/scripts/pricingTabs.ts`**

```ts
// src/scripts/pricingTabs.ts
import { getActiveTab } from '../lib/pricingTabs';

export function initPricingTabs(root: HTMLElement): void {
  const tabButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tab-button]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-tab-panel]'));
  const tabIds = tabButtons.map((button) => button.dataset.tabId ?? '');
  let activeId = tabIds[0] ?? '';

  function render() {
    tabButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.tabId === activeId);
    });
    panels.forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.tabPanel === activeId);
    });
  }

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeId = getActiveTab(tabIds, button.dataset.tabId ?? '', activeId);
      render();
    });
  });

  render();
}
```

- [ ] **Step 3: Write `PricingTabs.astro`**

```astro
---
// src/components/sections/PricingTabs.astro
import type { CollectionEntry } from 'astro:content';
import Tabs from '../elements/Tabs.astro';

interface Props {
  plans: CollectionEntry<'plans'>[];
}
const { plans } = Astro.props;
const tabs = plans.map((plan) => ({ id: plan.slug, label: plan.data.planName }));
---
<div class="pricing-tabs" data-tabs>
  <Tabs tabs={tabs} activeId={tabs[0]?.id ?? ''} />
  <div class="pricing-tabs__panels">
    {plans.map((plan) => (
      <div class:list={['pricing-tab-item', { 'is-highlighted': plan.data.highlighted }]} data-tab-panel={plan.slug}>
        <i data-lucide={plan.data.icon}></i>
        <h3>{plan.data.planName}</h3>
        <p class="pricing-tab-item__price">{plan.data.price}</p>
        <ul>
          {plan.data.features.map((feature) => <li>{feature}</li>)}
        </ul>
      </div>
    ))}
  </div>
</div>

<script>
  import { initPricingTabs } from '../../scripts/pricingTabs';
  const root = document.querySelector<HTMLElement>('.pricing-tabs');
  if (root) initPricingTabs(root);
</script>
```

- [ ] **Step 4: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/sections/PricingTabs.astro src/scripts/pricingTabs.ts
git commit -m "Add PricingTabs section wired to getActiveTab"
```

---

### Task 36: `TeamGrid.astro`

**Files:**
- Create: `src/components/sections/TeamGrid.astro`

**Interfaces:**
- Consumes: `TeamItemMetal` (Task 24), `getCollection('team')`.
- Produces: `TeamGrid` props `{ members: CollectionEntry<'team'>[] }` — consumed by the Equipo page (Task 44).

- [ ] **Step 1: Write `TeamGrid.astro`**

```astro
---
// src/components/sections/TeamGrid.astro
import type { CollectionEntry } from 'astro:content';
import TeamItemMetal from '../elements/TeamItemMetal.astro';

interface Props {
  members: CollectionEntry<'team'>[];
}
const { members } = Astro.props;
---
<div class="team-grid">
  {members.map((member) => (
    <TeamItemMetal name={member.data.name} role={member.data.role} photo={member.data.photo} />
  ))}
</div>
```

- [ ] **Step 2: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/sections/TeamGrid.astro
git commit -m "Add TeamGrid section"
```

---

### Task 37: `ContactForm.astro` + `src/scripts/contactForm.ts`

**Files:**
- Create: `src/components/sections/ContactForm.astro`, `src/scripts/contactForm.ts`

**Interfaces:**
- Consumes: `validateContactForm`, `ContactFormValues` from `src/lib/contactFormValidation.ts` (Task 9), `FormField`, `Button` (Task 18), `Alert` (Task 19).
- Produces: `ContactForm` component, no props — consumed by the Contacto page (Task 48).

- [ ] **Step 1: Read source** (`form-panel` light variant in `ui-kit2.html`).

- [ ] **Step 2: Write `src/scripts/contactForm.ts`**

```ts
// src/scripts/contactForm.ts
import { validateContactForm, type ContactFormValues } from '../lib/contactFormValidation';

export function initContactForm(form: HTMLFormElement): void {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const values: ContactFormValues = {
      firstName: String(data.get('firstName') ?? ''),
      lastName: String(data.get('lastName') ?? ''),
      phone: String(data.get('phone') ?? ''),
      email: String(data.get('email') ?? ''),
      message: String(data.get('message') ?? ''),
    };
    const result = validateContactForm(values);
    const successAlert = form.querySelector<HTMLElement>('[data-form-success]');
    const errorAlert = form.querySelector<HTMLElement>('[data-form-error]');
    const errorMessage = errorAlert?.querySelector<HTMLElement>('p');
    if (!successAlert || !errorAlert || !errorMessage) return;

    if (result.valid) {
      successAlert.hidden = false;
      errorAlert.hidden = true;
      // TODO: send `values` to a real backend/email service once one is chosen.
      form.reset();
    } else {
      errorMessage.textContent = Object.values(result.errors).join(' ');
      errorAlert.hidden = false;
      successAlert.hidden = true;
    }
  });
}
```

- [ ] **Step 3: Write `ContactForm.astro`**

Feedback uses the `Alert` element (Task 19), same pattern as `Newsletter.astro` (Task 20): both variants pre-rendered hidden, script toggles visibility.

```astro
---
// src/components/sections/ContactForm.astro
import FormField from '../elements/FormField.astro';
import Button from '../elements/Button.astro';
import Alert from '../elements/Alert.astro';
---
<form class="form-panel" data-contact-form>
  <FormField id="contact-first-name" name="firstName" label="Nombre" type="text" required />
  <FormField id="contact-last-name" name="lastName" label="Apellido" type="text" required />
  <FormField id="contact-phone" name="phone" label="Teléfono" type="tel" required />
  <FormField id="contact-email" name="email" label="E-mail" type="email" required />
  <FormField id="contact-message" name="message" label="Mensaje" type="text" as="textarea" required />
  <Button label="Send Message" type="submit" />
  <div data-form-success hidden>
    <Alert variant="success" message="Mensaje enviado. Te contactaremos pronto." />
  </div>
  <div data-form-error hidden>
    <Alert variant="error" message="" />
  </div>
</form>

<script>
  import { initContactForm } from '../../scripts/contactForm';
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  if (form) initContactForm(form);
</script>
```

Note: the error `Alert` is rendered with an empty `message=""` at build time; `scripts/contactForm.ts` fills in the actual per-field error text at runtime by writing to the `<p>` inside `[data-form-error]` (the `<p>` that Task 19's `Alert.astro` renders `{message}` into).

- [ ] **Step 4: Verify + commit**

Run: `pnpm astro check`. Then:

```bash
git add src/components/sections/ContactForm.astro src/scripts/contactForm.ts
git commit -m "Add ContactForm section wired to validateContactForm"
```

---

## Phase 6 — Pages (14 routes)

> Every page task: after writing the file, run `pnpm dev` and visually check the route renders without console errors, then `pnpm build` to confirm static generation succeeds.

### Task 38: Home — `src/pages/index.astro`

**Files:**
- Create: `src/pages/index.astro`

**Interfaces:**
- Consumes: `BaseLayout` (Task 11), `Hero` (Task 28), `Marquee` (Task 29), `AboutSection` (Task 30), `ServicesSection` (Task 31), `ProjectsSection` (Task 32), `TestimonialsSection` (Task 33), `CtaBand` (Task 14), `Footer` (Task 13), `WhatsAppButton` (Task 16), `ScrollTop` (Task 17), `getCollection` from `astro:content` for `services`/`projects`/`testimonials`.

- [ ] **Step 1: Write `src/pages/index.astro`**

```astro
---
// src/pages/index.astro
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Hero from '../components/sections/Hero.astro';
import Marquee from '../components/sections/Marquee.astro';
import AboutSection from '../components/sections/AboutSection.astro';
import ServicesSection from '../components/sections/ServicesSection.astro';
import ProjectsSection from '../components/sections/ProjectsSection.astro';
import TestimonialsSection from '../components/sections/TestimonialsSection.astro';
import CtaBand from '../components/elements/CtaBand.astro';
import Footer from '../components/sections/Footer.astro';
import WhatsAppButton from '../components/WhatsAppButton.astro';
import ScrollTop from '../components/elements/ScrollTop.astro';

const services = await getCollection('services');
const projects = await getCollection('projects');
const testimonials = await getCollection('testimonials');

const heroSlides = [
  {
    title: 'Two decades of financial expertise, built on trust',
    subtitle: 'Estrategias financieras y de consultoría para negocios que buscan crecer con solidez.',
    image: '/assets/img/lib/hero-bg-image-elite.jpg',
    ctaLabel: 'Habla con un asesor',
    ctaHref: '/contacto',
  },
];

const aboutItems = [
  { icon: 'target', title: 'Financial strategy', description: 'Planes financieros a medida para cada etapa de tu negocio.' },
  { icon: 'briefcase', title: 'Advisory services', description: 'Acompañamiento experto en decisiones críticas.' },
  { icon: 'award', title: 'Business excellence', description: 'Procesos y controles que elevan tu operación.' },
];
---
<BaseLayout title="Finanze | Business theme" description="Asesoría financiera y de consultoría para negocios en crecimiento.">
  <Hero slides={heroSlides} />
  <Marquee items={['Investment Advisory', 'Financial Reporting and Analysis', 'Regulatory Compliance Support']} />
  <AboutSection heading="Two decades of financial expertise, built on trust" items={aboutItems} />
  <ServicesSection services={services} />
  <ProjectsSection projects={projects} />
  <TestimonialsSection testimonials={testimonials} />
  <CtaBand heading="¿Listo para dar el siguiente paso?" ctaLabel="Contáctanos" ctaHref="/contacto" />
  <Footer />
  <WhatsAppButton />
  <ScrollTop />
</BaseLayout>
```

- [ ] **Step 2: Verify**

Run: `pnpm dev`, open `/`, check nav, hero slider, marquee scroll, service/project cards, testimonials, footer all render. Run `pnpm build`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "Add Home page"
```

---

### Task 39: About — `src/pages/nosotros.astro`

**Files:**
- Create: `src/pages/nosotros.astro`

**Interfaces:**
- Consumes: `PageLayout` (Task 15), `AboutSection` (Task 30), `CardFeature` (Task 23), `ProgressBarMetal` (Task 24), `PreviewVideo`, `SpecialQuote` (Task 26), `Divider` (Task 20).

- [ ] **Step 1: Write `src/pages/nosotros.astro`**

```astro
---
// src/pages/nosotros.astro
import PageLayout from '../layouts/PageLayout.astro';
import AboutSection from '../components/sections/AboutSection.astro';
import CardFeature from '../components/elements/CardFeature.astro';
import ProgressBarMetal from '../components/elements/ProgressBarMetal.astro';
import PreviewVideo from '../components/elements/PreviewVideo.astro';
import SpecialQuote from '../components/elements/SpecialQuote.astro';
import Divider from '../components/elements/Divider.astro';

const aboutItems = [
  { icon: 'target', title: 'Financial strategy', description: 'Planes financieros a medida para cada etapa de tu negocio.' },
  { icon: 'briefcase', title: 'Advisory services', description: 'Acompañamiento experto en decisiones críticas.' },
  { icon: 'award', title: 'Business excellence', description: 'Procesos y controles que elevan tu operación.' },
];

const featureItems = [
  { icon: 'users', title: 'Equipo experto', description: 'Consultores con más de 20 años de trayectoria combinada.' },
  { icon: 'shield', title: 'Cumplimiento sólido', description: 'Procesos alineados a las normativas vigentes.' },
  { icon: 'trending-up', title: 'Resultados medibles', description: 'Seguimiento constante de indicadores clave.' },
];
---
<PageLayout
  title="Nosotros | Finanze"
  description="Conoce la trayectoria y el equipo detrás de Finanze."
  subHeroTitle="Nosotros"
  breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Nosotros' }]}
  ctaHeading="¿Listo para dar el siguiente paso?"
  ctaLabel="Contáctanos"
  ctaHref="/contacto"
>
  <AboutSection heading="Two decades of financial expertise, built on trust" items={aboutItems} />
  <Divider />
  <section class="about-features">
    {featureItems.map((item) => <CardFeature icon={item.icon} title={item.title} description={item.description} />)}
  </section>
  <ProgressBarMetal label="Satisfacción de clientes" percent={95} />
  <ProgressBarMetal label="Proyectos exitosos" percent={88} />
  <Divider />
  <PreviewVideo posterImage="/assets/img/lib/core-feature-video-image-elite.jpg" />
  <SpecialQuote quote="La solidez financiera se construye con decisiones consistentes, no con atajos." author="Equipo Finanze" />
</PageLayout>
```

- [ ] **Step 2: Verify**

Run: `pnpm dev`, open `/nosotros`. Run `pnpm build`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/nosotros.astro
git commit -m "Add About page"
```

---

### Task 40: Services — `src/pages/servicios/index.astro` + `src/pages/servicios/[slug].astro`

**Files:**
- Create: `src/pages/servicios/index.astro`, `src/pages/servicios/[slug].astro`

**Interfaces:**
- Consumes: `PageLayout` (Task 15), `CardServiceItem` (Task 22), `Stepper` (Task 21), `getCollection`/`getEntryBySlug` for `services`.

- [ ] **Step 1: Write `src/pages/servicios/index.astro`**

```astro
---
// src/pages/servicios/index.astro
import { getCollection } from 'astro:content';
import PageLayout from '../../layouts/PageLayout.astro';
import CardServiceItem from '../../components/elements/CardServiceItem.astro';
import Stepper from '../../components/elements/Stepper.astro';

const services = await getCollection('services');
const steps = [{ label: 'Diagnóstico' }, { label: 'Estrategia' }, { label: 'Implementación' }];
---
<PageLayout
  title="Servicios | Finanze"
  description="Conoce nuestros servicios de asesoría financiera y consultoría."
  subHeroTitle="Servicios"
  breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Servicios' }]}
  ctaHeading="¿Necesitas asesoría personalizada?"
  ctaLabel="Contáctanos"
  ctaHref="/contacto"
>
  <div class="services-section__grid">
    {services.map((service) => (
      <CardServiceItem
        title={service.data.title}
        icon={service.data.icon}
        shortDescription={service.data.shortDescription}
        href={`/servicios/${service.slug}`}
      />
    ))}
  </div>
  <h2>Cómo trabajamos</h2>
  <Stepper steps={steps} activeIndex={0} />
</PageLayout>
```

- [ ] **Step 2: Write `src/pages/servicios/[slug].astro`**

```astro
---
// src/pages/servicios/[slug].astro
import { getCollection, type CollectionEntry } from 'astro:content';
import PageLayout from '../../layouts/PageLayout.astro';

export async function getStaticPaths() {
  const services = await getCollection('services');
  return services.map((service) => ({
    params: { slug: service.slug },
    props: { service },
  }));
}

interface Props {
  service: CollectionEntry<'services'>;
}
const { service } = Astro.props;
const { Content } = await service.render();
---
<PageLayout
  title={`${service.data.title} | Finanze`}
  description={service.data.shortDescription}
  subHeroTitle={service.data.title}
  breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Servicios', href: '/servicios' }, { label: service.data.title }]}
  ctaHeading="¿Necesitas este servicio?"
  ctaLabel="Contáctanos"
  ctaHref="/contacto"
>
  <article class="service-detail">
    <Content />
  </article>
</PageLayout>
```

- [ ] **Step 3: Verify**

Run: `pnpm dev`, open `/servicios` and one detail page (e.g. `/servicios/wealth-management`). Run `pnpm build`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/servicios
git commit -m "Add Servicios listing and detail pages"
```

---

### Task 41: Projects — `src/pages/proyectos/index.astro` + `src/pages/proyectos/[slug].astro`

**Files:**
- Create: `src/pages/proyectos/index.astro`, `src/pages/proyectos/[slug].astro`

**Interfaces:**
- Consumes: `PageLayout` (Task 15), `CardProjectItem` (Task 22), `getCollection`/`getStaticPaths` for `projects`.

- [ ] **Step 1: Write `src/pages/proyectos/index.astro`**

```astro
---
// src/pages/proyectos/index.astro
import { getCollection } from 'astro:content';
import PageLayout from '../../layouts/PageLayout.astro';
import CardProjectItem from '../../components/elements/CardProjectItem.astro';

const projects = await getCollection('projects');
---
<PageLayout
  title="Proyectos | Finanze"
  description="Casos y resultados reales para negocios reales."
  subHeroTitle="Proyectos"
  breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Proyectos' }]}
  ctaHeading="¿Quieres resultados como estos?"
  ctaLabel="Contáctanos"
  ctaHref="/contacto"
>
  <div class="projects-section__grid">
    {projects.map((project) => (
      <CardProjectItem
        title={project.data.title}
        category={project.data.category}
        image={project.data.image}
        href={`/proyectos/${project.slug}`}
      />
    ))}
  </div>
</PageLayout>
```

- [ ] **Step 2: Write `src/pages/proyectos/[slug].astro`**

```astro
---
// src/pages/proyectos/[slug].astro
import { getCollection, type CollectionEntry } from 'astro:content';
import PageLayout from '../../layouts/PageLayout.astro';

export async function getStaticPaths() {
  const projects = await getCollection('projects');
  return projects.map((project) => ({
    params: { slug: project.slug },
    props: { project },
  }));
}

interface Props {
  project: CollectionEntry<'projects'>;
}
const { project } = Astro.props;
const { Content } = await project.render();
---
<PageLayout
  title={`${project.data.title} | Finanze`}
  description={project.data.shortDescription}
  subHeroTitle={project.data.title}
  breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Proyectos', href: '/proyectos' }, { label: project.data.title }]}
  ctaHeading="¿Tienes un proyecto similar?"
  ctaLabel="Contáctanos"
  ctaHref="/contacto"
>
  <article class="project-detail">
    <img src={project.data.image} alt={project.data.title} loading="lazy" />
    <Content />
  </article>
</PageLayout>
```

- [ ] **Step 3: Verify**

Run: `pnpm dev`, open `/proyectos` and a detail page. Run `pnpm build`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/proyectos
git commit -m "Add Proyectos listing and detail pages"
```

---

### Task 42: Blog — `src/pages/blog/index.astro` + `src/pages/blog/[slug].astro`

**Files:**
- Create: `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`

**Interfaces:**
- Consumes: `PageLayout` (Task 15), `PostCard` (Task 25), `getCollection`/`getStaticPaths` for `posts`.

- [ ] **Step 1: Write `src/pages/blog/index.astro`**

```astro
---
// src/pages/blog/index.astro
import { getCollection } from 'astro:content';
import PageLayout from '../../layouts/PageLayout.astro';
import PostCard from '../../components/elements/PostCard.astro';

const posts = (await getCollection('posts')).sort(
  (a, b) => new Date(b.data.publishDate).getTime() - new Date(a.data.publishDate).getTime()
);
---
<PageLayout
  title="Blog | Finanze"
  description="Ideas y estrategias sobre finanzas y consultoría de negocios."
  subHeroTitle="Blog"
  breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Blog' }]}
  ctaHeading="¿Tienes preguntas sobre tu negocio?"
  ctaLabel="Contáctanos"
  ctaHref="/contacto"
>
  <div class="blog-grid">
    {posts.map((post) => (
      <PostCard
        title={post.data.title}
        excerpt={post.data.excerpt}
        image={post.data.image}
        publishDate={post.data.publishDate}
        href={`/blog/${post.slug}`}
      />
    ))}
  </div>
</PageLayout>
```

- [ ] **Step 2: Write `src/pages/blog/[slug].astro`**

```astro
---
// src/pages/blog/[slug].astro
import { getCollection, type CollectionEntry } from 'astro:content';
import PageLayout from '../../layouts/PageLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('posts');
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

interface Props {
  post: CollectionEntry<'posts'>;
}
const { post } = Astro.props;
const { Content } = await post.render();
---
<PageLayout
  title={`${post.data.title} | Finanze`}
  description={post.data.excerpt}
  subHeroTitle={post.data.title}
  breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Blog', href: '/blog' }, { label: post.data.title }]}
  ctaHeading="¿Quieres asesoría personalizada?"
  ctaLabel="Contáctanos"
  ctaHref="/contacto"
>
  <article class="post-detail">
    <img src={post.data.image} alt={post.data.title} loading="lazy" />
    <p class="post-detail__meta">
      <time datetime={post.data.publishDate}>{post.data.publishDate}</time>
      {post.data.author && <span> — {post.data.author}</span>}
    </p>
    <Content />
  </article>
</PageLayout>
```

- [ ] **Step 3: Verify**

Run: `pnpm dev`, open `/blog` and a detail page. Run `pnpm build`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/blog
git commit -m "Add Blog listing and detail pages"
```

---

### Task 43: Team — `src/pages/equipo.astro`

**Files:**
- Create: `src/pages/equipo.astro`

**Interfaces:**
- Consumes: `PageLayout` (Task 15), `TeamGrid` (Task 36), `getCollection` for `team`.

- [ ] **Step 1: Write `src/pages/equipo.astro`**

```astro
---
// src/pages/equipo.astro
import { getCollection } from 'astro:content';
import PageLayout from '../layouts/PageLayout.astro';
import TeamGrid from '../components/sections/TeamGrid.astro';

const members = await getCollection('team');
---
<PageLayout
  title="Equipo | Finanze"
  description="Conoce a los consultores detrás de Finanze."
  subHeroTitle="Nuestro equipo"
  breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Equipo' }]}
  ctaHeading="¿Quieres trabajar con nosotros?"
  ctaLabel="Contáctanos"
  ctaHref="/contacto"
>
  <TeamGrid members={members} />
</PageLayout>
```

- [ ] **Step 2: Verify**

Run: `pnpm dev`, open `/equipo`. Run `pnpm build`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/equipo.astro
git commit -m "Add Equipo page"
```

---

### Task 44: Plans — `src/pages/planes.astro`

**Files:**
- Create: `src/pages/planes.astro`

**Interfaces:**
- Consumes: `PageLayout` (Task 15), `PricingTabs` (Task 35), `getCollection` for `plans`.

- [ ] **Step 1: Write `src/pages/planes.astro`**

```astro
---
// src/pages/planes.astro
import { getCollection } from 'astro:content';
import PageLayout from '../layouts/PageLayout.astro';
import PricingTabs from '../components/sections/PricingTabs.astro';

const plans = await getCollection('plans');
---
<PageLayout
  title="Planes | Finanze"
  description="Elige el plan de asesoría financiera que se ajuste a tu negocio."
  subHeroTitle="Planes"
  breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Planes' }]}
  ctaHeading="¿No estás seguro qué plan elegir?"
  ctaLabel="Contáctanos"
  ctaHref="/contacto"
>
  <PricingTabs plans={plans} />
</PageLayout>
```

- [ ] **Step 2: Verify**

Run: `pnpm dev`, open `/planes`, click through tabs. Run `pnpm build`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/planes.astro
git commit -m "Add Planes page"
```

---

### Task 45: Testimonials — `src/pages/testimonios.astro`

**Files:**
- Create: `src/pages/testimonios.astro`

**Interfaces:**
- Consumes: `PageLayout` (Task 15), `TestimonialsSection` (Task 33), `GoogleRatingBox` (Task 25), `getCollection` for `testimonials`.

- [ ] **Step 1: Write `src/pages/testimonios.astro`**

```astro
---
// src/pages/testimonios.astro
import { getCollection } from 'astro:content';
import PageLayout from '../layouts/PageLayout.astro';
import TestimonialsSection from '../components/sections/TestimonialsSection.astro';
import GoogleRatingBox from '../components/elements/GoogleRatingBox.astro';

const testimonials = await getCollection('testimonials');
---
<PageLayout
  title="Testimonios | Finanze"
  description="Lo que dicen nuestros clientes sobre trabajar con Finanze."
  subHeroTitle="Testimonios"
  breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Testimonios' }]}
  ctaHeading="Únete a nuestros clientes satisfechos"
  ctaLabel="Contáctanos"
  ctaHref="/contacto"
>
  <GoogleRatingBox rating={4.9} reviewCount={128} />
  <TestimonialsSection testimonials={testimonials} />
</PageLayout>
```

- [ ] **Step 2: Verify**

Run: `pnpm dev`, open `/testimonios`. Run `pnpm build`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/testimonios.astro
git commit -m "Add Testimonios page"
```

---

### Task 46: FAQ — `src/pages/faq.astro`

**Files:**
- Create: `src/pages/faq.astro`

**Interfaces:**
- Consumes: `PageLayout` (Task 15), `FaqAccordion` (Task 34), `CardGhost` (Task 23).

- [ ] **Step 1: Write `src/pages/faq.astro`**

```astro
---
// src/pages/faq.astro
import PageLayout from '../layouts/PageLayout.astro';
import FaqAccordion from '../components/sections/FaqAccordion.astro';
import CardGhost from '../components/elements/CardGhost.astro';

const items = [
  { question: '¿Qué servicios ofrece Finanze?', answer: 'Wealth management, planificación financiera, consultoría de negocios y gestión de riesgo y cumplimiento.' },
  { question: '¿Cómo empiezo a trabajar con ustedes?', answer: 'Agenda una llamada inicial desde la página de contacto y evaluamos tu caso.' },
  { question: '¿Trabajan con empresas de cualquier tamaño?', answer: 'Sí, adaptamos nuestros planes a startups, pymes y corporaciones.' },
  { question: '¿Ofrecen seguimiento continuo?', answer: 'Sí, todos nuestros planes incluyen reportes y sesiones periódicas de seguimiento.' },
  { question: '¿Cómo protegen la confidencialidad de mi información?', answer: 'Seguimos protocolos estrictos de manejo de datos financieros confidenciales.' },
];
---
<PageLayout
  title="Preguntas frecuentes | Finanze"
  description="Resolvemos las dudas más comunes sobre nuestros servicios."
  subHeroTitle="Preguntas frecuentes"
  breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'FAQ' }]}
  ctaHeading="¿Tienes otra pregunta?"
  ctaLabel="Contáctanos"
  ctaHref="/contacto"
>
  <FaqAccordion items={items} />
  <CardGhost
    title="¿No encontraste tu respuesta?"
    description="Escríbenos y te responderemos a la brevedad."
    ctaLabel="Contáctanos"
    ctaHref="/contacto"
  />
</PageLayout>
```

- [ ] **Step 2: Verify**

Run: `pnpm dev`, open `/faq`, click each accordion item to confirm one-open-at-a-time behavior. Run `pnpm build`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/faq.astro
git commit -m "Add FAQ page"
```

---

### Task 47: Contact — `src/pages/contacto.astro`

**Files:**
- Create: `src/pages/contacto.astro`

**Interfaces:**
- Consumes: `PageLayout` (Task 15), `ContactForm` (Task 37).

- [ ] **Step 1: Write `src/pages/contacto.astro`**

```astro
---
// src/pages/contacto.astro
import PageLayout from '../layouts/PageLayout.astro';
import ContactForm from '../components/sections/ContactForm.astro';
---
<PageLayout
  title="Contacto | Finanze"
  description="Escríbenos y conversemos sobre tu estrategia financiera."
  subHeroTitle="Contacto"
  breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Contacto' }]}
  ctaHeading="Estamos para ayudarte"
  ctaLabel="Ver planes"
  ctaHref="/planes"
>
  <ContactForm />
</PageLayout>
```

- [ ] **Step 2: Verify**

Run: `pnpm dev`, open `/contacto`, submit the form with invalid and then valid data, confirm the success/error feedback text changes accordingly. Run `pnpm build`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/contacto.astro
git commit -m "Add Contacto page"
```

---

### Task 48: 404 — `src/pages/404.astro`

**Files:**
- Create: `src/pages/404.astro`

**Interfaces:**
- Consumes: `BaseLayout` (Task 11), `Nav`, `Footer` (Tasks 12–13).

- [ ] **Step 1: Write `src/pages/404.astro`**

```astro
---
// src/pages/404.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Nav from '../components/sections/Nav.astro';
import Footer from '../components/sections/Footer.astro';
---
<BaseLayout title="Página no encontrada | Finanze" description="La página que buscas no existe.">
  <Nav theme="internal" />
  <section class="not-found">
    <h1>404</h1>
    <p>La página que buscas no existe.</p>
    <a class="button-elite" href="/">Volver al inicio</a>
  </section>
  <Footer />
</BaseLayout>
```

- [ ] **Step 2: Verify**

Run: `pnpm build`, confirm `dist/404.html` exists: `ls dist/404.html`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/404.astro
git commit -m "Add 404 page"
```

---

## Phase 7 — Docker & deployment

### Task 49: Dockerfile, docker-compose.yml, nginx config

**Files:**
- Create: `Dockerfile`, `docker-compose.yml`, `nginx.conf`

**Interfaces:**
- Consumes: `pnpm-workspace.yaml` (Task 1), `.env.example` (Task 16) for the `PUBLIC_WHATSAPP_NUMBER` build arg.

- [ ] **Step 1: Check the lockfile version**

Run: `node -e "console.log(require('./pnpm-lock.yaml'.replace('.yaml','')))"` — actually just open `pnpm-lock.yaml` and read the `lockfileVersion:` line at the top, note it for Step 2.

- [ ] **Step 2: Write `Dockerfile`**

```dockerfile
# Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG PUBLIC_WHATSAPP_NUMBER=
ENV PUBLIC_WHATSAPP_NUMBER=$PUBLIC_WHATSAPP_NUMBER
RUN pnpm build

FROM nginx:alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
```

(Substitute the pnpm version from Step 1 if different from `9.15.0`.)

- [ ] **Step 3: Write `nginx.conf`**

```nginx
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    error_page 404 /404.html;

    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /_astro/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri.html $uri/ =404;
    }
}
```

- [ ] **Step 4: Write `docker-compose.yml`**

```yaml
services:
  web:
    build:
      context: .
      args:
        PUBLIC_WHATSAPP_NUMBER: ${PUBLIC_WHATSAPP_NUMBER:-}
    ports:
      - "${PORT:-8080}:8080"
    restart: unless-stopped
```

- [ ] **Step 5: Build and run the container**

Run: `docker compose build && docker compose up -d`
Expected: container starts; `curl http://localhost:8080` returns the Home page HTML.

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/nonexistent-page`
Expected: `404` and the body matches the custom 404 page content.

Run: `docker compose down`

- [ ] **Step 6: Commit**

```bash
git add Dockerfile docker-compose.yml nginx.conf
git commit -m "Add Docker multi-stage build and nginx serve config"
```

---

## Phase 8 — Final review (controller step, not a subagent task)

After Task 49 passes, run a **whole-branch review on the most capable model available** (per CLAUDE.md's documented working process) before considering the port done. Specifically check for:
- Any invented CSS class not present in `public/assets/css/main.css` (grep every `class="..."`/`class:list={...}` value used across `src/components` and `src/pages` against `main.css`).
- Consistent prop/type names across component boundaries (spot-check a few `Consumes`/`Produces` pairs from this plan against the actual code).
- `docker compose build` succeeds from a clean checkout (`git clone` into a scratch dir and build there, not just the working tree).
