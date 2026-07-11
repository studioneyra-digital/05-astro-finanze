# ui-design.md | fundamentos del diseño de interfaces

Directrices para la correcta construcción del UI Design, UI-Kit, Design System y Templates del proyecto.

---

## Estructura y Composición (Layout)

Por definir

## Concepto de diseño

### Concepto:

Por definir

### Enfoque visual:
Por definir

### Elementos Clave
Por definir

---

## Elementos Gráficos e Iconografía

Por definir

---


## UI Kit (`ui-kit.html`)

Página de referencia de componentes. Sidebar fijo de 228px con overflow vertical y navegación activa vía `IntersectionObserver`. Todos los styles (css) que dan forma a los componentes deben estar escritos en el archivo "main.css", dentro de la carpeta "assets/css".

### Estructura inicial del UI kit

```
FOUNDATIONS
  Brand            → #brand
  Colores          → #colors
  Tipografía       → #typography
  Espaciado        → #spacing
  Radius & Sombras → #radius-shadows

ELEMENTOS
  Botones          → #buttons
  Badges & Tags    → #badges
  Cards            → #cards
  Iconos Sociales  → #social-icons
  Formularios      → #forms

COMPONENTES
  Navegación       → #navbar
  Section Header   → #section-header
  Stats            → #stats
  Awards List      → #awards
  Testimonials     → #testimonials
  Pricing Tab Item → #pricing-tab-item
```
> **Importante** se agregaran elementos y componentes conforme avance el proyecto. Cada componente construido debe tener un snippets de codigo en la parte inferior.

---

## Logo

Colocar en `assets/img/logos/` la versión **dark** y **white** (SVG/PNG). Usar la blanca en el nav sobre hero oscuro y en el footer; la oscura en el nav de páginas internas.

---

## Paleta de colores

Todos los valores confirmados midiendo el sitio de referencia. Usar **siempre las variables CSS**, nunca valores hardcodeados.

| Variable CSS | Hex / Valor | Uso |
|---|---|---|
| `--color-primary` | #2b46e0 | botones, acentos, iconos, CTA |
| `--color-primary-dark` | #15152B | Hover |
| `--color-secondary` | #15152B | texto oscuro sobre claro, btn--dark |
| `--color-text-primary` | #15152B | Texto principal (headings sobre fondo claro) |
| `--color-text-secondary` | #948A7C | Cuerpo de texto, párrafos |
| `--color-text-muted` | Por definir | Metadatos, captions, labels |
| `--color-text-inverse` | rgba(255,255,255,.72) | Texto sobre fondos oscuros |
| `--color-bg-main` | #F5F4F1 | Fondo global del sitio |
| `--color-bg-white` | #FFFFFF | Secciones blancas, cards |
| `--color-bg-dark` | Por definir | Secciones oscuras, footer |
| `--color-bg-surface` | #2B46E0 | Superficies cobalt (uso puntual) |
| `--color-border-default` | #EBE9E4 | Bordes sobre fondos claros |
| `--color-border-light` | #ffffff | Bordes sobre fondos oscuros |

---

## Tipografía

Google Fonts — importadas en la **primera línea** de `assets/css/main.css` vía `@import`:


| Variable CSS | Fuente | Uso |
|---|---|---|
| `--font-display` | 'Space Grotesk' | Titulares, display, hero |
| `--font-body` | 'DM Sans' | Nav, párrafos, UI en general |
| `--font-accent` | 'Space Grotesk' | Wordmarks, números decorativos, acentos tipográficos |


### Escala tipográfica (variables CSS)

| Variable | Valor | Uso |
|---|---|---|
| `--text-display` | `clamp(64px, 9vw, 110px)` | Hero headline — clase `.display` |
| `--text-giant` | `clamp(44px, 7vw, 80px)` | Section titles (`.section-header__title`) |
| `--text-h1` | `clamp(36px, 5vw, 64px)` | `h1` |
| `--text-h2` | `clamp(28px, 4vw, 48px)` | `h2` |
| `--text-h3` | `clamp(22px, 3vw, 36px)` | `h3` |
| `--text-h4` | `clamp(20px, 2.5vw, 28px)` | `h4`, card titles |
| `--text-h5` | `22px` | `h5` |
| `--text-h6` | `18px` | `h6` |
| `--text-body-lg` | `18px` | Párrafos estándar (`p`, `.body-text`) |
| `--text-body` | `16px` | UI secundaria |
| `--text-sm` | `14px` | Captions, labels |
| `--text-xs` | `12px` | Overlines, badges, eyebrows |

**Pesos disponibles:**

| Variable | Valor |
|---|---|
| `--weight-light` | `200` |
| `--weight-regular` | `300` |
| `--weight-medium` | `500` |
| `--weight-semibold` | `600` |
| `--weight-bold` | `700` |

---

## Espaciado

Escala de 10 pasos. Nunca usar valores arbitrarios en píxeles.

| Variable | Valor | Uso frecuente |
|---|---|---|
| `--space-1` | `4px` | Gaps mínimos |
| `--space-2` | `8px` | Gap entre ícono y texto |
| `--space-3` | `12px` | Gap entre items de lista |
| `--space-4` | `16px` | Padding interno pequeño |
| `--space-5` | `24px` | Padding estándar, separación de bloques |
| `--space-6` | `32px` | Separación de secciones internas |
| `--space-7` | `48px` | Padding de cards |
| `--space-8` | `64px` | `margin-bottom` de section headers |
| `--space-9` | `96px` | `--section-pad-y` (padding de secciones) |
| `--space-10` | `128px` | Separaciones grandes |

---

## Componentes / secciones para Index


1. **Nav scroll**: `.is-scrolled` al pasar 60px → backdrop-filter + borde inferior. Wordmark, menú off-canvas (Bootstrap) en móvil, botón "Agendar" persistente en todos los viewports.
2. **Hero** — headline display, subtítulo, CTA primario.
3. **Footer** — 

---

## Tokens adicionales

```css
/* Border radius */
--radius-xs:    4px;
--radius-sm:    8px;   /* inputs, tags pequeños */
--radius-md:   16px;   /* cards */
--radius-lg:   24px;
--radius-xl:   40px;
--radius-full: 100px;  /* botones pill, badges */

/* Sombras */
--shadow-sm:  0 2px 8px rgba(0,0,0,0.06);    /* hover suave */
--shadow-md:  0 8px 32px rgba(0,0,0,0.10);   /* hover activo */
--shadow-lg:  0 24px 64px rgba(0,0,0,0.14);  /* modales */

/* Transiciones */
--ease-fast: 150ms ease;
--ease-base: 250ms ease;
--ease-slow: 420ms cubic-bezier(0.16, 1, 0.3, 1);
```