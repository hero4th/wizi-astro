# Professional Academy — Plataforma web

Rebuild completo de [proacademymx.com](https://www.proacademymx.com): plataforma de
preparación para TOEFL iBT, SAT, GRE, GMAT y PAA.

## Stack

- **Astro 5** (output estático, adapter Vercel)
- **React 19** (islas: formulario de leads)
- **Tailwind CSS v4** (tokens en `src/styles/global.css` vía `@theme`)
- **GSAP + Lenis** (scroll choreography y smooth scrolling)
- **Swiper** (carrusel de testimonios)
- **MDX + Content Collections** (blog)

## Comandos

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # genera dist/
npm run preview
npm run check     # astro check (tipos)
```

## Estructura

```
src/
  pages/          rutas (home, cursos/[slug], blog, precios, etc.)
  components/     UI compartida + home/ (secciones de la portada)
  layouts/        Base.astro (SEO, analytics, header/footer, motion)
  content/blog/   posts MDX (frontmatter validado en content.config.ts)
  data/           sitio, programas, FAQs, testimonios, categorías
  lib/schema.ts   constructores JSON-LD (Organization, Course, FAQ, etc.)
  scripts/        motion.ts: motor global Lenis + GSAP (data-attributes)
  styles/         global.css: design tokens y utilidades
```

## Sistema de motion (declarativo)

Atributos disponibles en cualquier elemento:

| Atributo | Efecto |
|---|---|
| `data-reveal` | fade + rise al entrar al viewport |
| `data-reveal-line` | reveal de titular por líneas (`.line-mask > .line-inner`) |
| `data-counter="100"` | contador animado |
| `data-parallax="-80"` | deriva vertical en scroll |
| `data-magnetic` | botón magnético (solo pointer fino) |

`prefers-reduced-motion` desactiva todo automáticamente.

## Analytics

Todos los trackers se activan solo en producción y solo si su variable existe:

| Variable | Servicio |
|---|---|
| `PUBLIC_GTM_ID` | Google Tag Manager (si existe, GA4 va dentro de GTM) |
| `PUBLIC_GA4_ID` | Google Analytics 4 directo |
| `PUBLIC_CLARITY_ID` | Microsoft Clarity (heatmaps y grabaciones) |
| `PUBLIC_META_PIXEL_ID` | Meta Pixel |
| `PUBLIC_LINKEDIN_PARTNER_ID` | LinkedIn Insight Tag |

Eventos personalizados: los elementos con `data-event="nombre"` y el formulario
de leads hacen push a `dataLayer` (evento `generate_lead`).

## Leads

`src/components/LeadForm.tsx` valida en cliente y entrega el lead por WhatsApp
(canal de venta actual). Para conectar un CRM o endpoint propio, reemplaza el
bloque `window.open(...)` por un `fetch` a tu API; la validación y el honeypot
ya están resueltos.

## SEO

- Metadata dinámica + canonical + OpenGraph + Twitter Cards en `SEO.astro`
- JSON-LD: Organization, WebSite, LocalBusiness, Course, FAQPage, BreadcrumbList, Article
- `sitemap-index.xml` automático (@astrojs/sitemap), `robots.txt`, RSS en `/rss.xml`

## Deploy (Vercel)

1. Sube el repo a GitHub e importa en Vercel (framework: Astro, sin config extra).
2. Define las variables `PUBLIC_*` de analytics en el proyecto.
3. `vercel.json` ya incluye headers de seguridad (CSP, HSTS, etc.) y cache
   inmutable para `/_astro/*`.

## CMS

El contenido vive en Content Collections (`src/content/blog`) y en los datos
tipados de `src/data/`. Para migrar a Sanity/Contentful/Strapi basta con
reemplazar el loader de la colección o las constantes por llamadas al CMS;
los componentes consumen interfaces, no archivos.
