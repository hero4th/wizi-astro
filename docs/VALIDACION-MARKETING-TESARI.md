# Validación técnica — Páginas de Tesari Marketing

**Fecha:** 2026-10-29
**Rutas:** `/marketing-tesari/` y `/marketing-tesari/privacidad/`
**Entorno validado:** build local (Astro) y servidor de desarrollo
**Estado:** contenido y SEO validados en local. **Pendiente de publicación en producción y solicitud de indexación en Google Search Console.**

---

## 1. Contenido

| Criterio | Resultado | Evidencia |
| --- | --- | --- |
| Página principal creada | ✅ | `src/pages/marketing-tesari/index.astro` |
| Página de privacidad creada | ✅ | `src/pages/marketing-tesari/privacidad.astro` |
| Contenido del documento aprobado, completo | ✅ | 11 bloques en la página principal y 23 en privacidad, sin faltantes (comparación automática contra el `.docx`) |
| Se distingue lo disponible de lo previsto | ✅ | Se indica que GA4 y Search Console están disponibles y que Google Ads, Keyword Planner y Claude están **previstos** y no se presentan como servicio activo |
| Coherencia entre ambas páginas | ✅ | Mismo alcance, proveedores, almacenamiento y correo de contacto |
| Un solo `H1` por página | ✅ | Principal: «Tesari Marketing» — Privacidad: «Privacidad de Tesari Marketing» |
| Jerarquía de encabezados | ✅ | Principal: 3 `H2` — Privacidad: 5 `H2` |

## 2. Enlaces

| Enlace | Destino | Estado |
| --- | --- | --- |
| «Política de privacidad de Tesari Marketing» (pie de la página principal) | `/marketing-tesari/privacidad/` | ✅ verificado con clic real en navegador |
| «política de privacidad específica de Tesari Marketing» (cuerpo) | `/marketing-tesari/privacidad/` | ✅ |
| «Acerca de Tesari Marketing» (pie de privacidad) | `/marketing-tesari/` | ✅ verificado con clic real en navegador |
| Política de privacidad de Pro Academy | `https://proacademymx.com/politica-de-privacidad` | ✅ (Netlify redirige 301 a la versión con `/` final) |
| Política comercial de la API de Anthropic | `https://privacy.claude.com/...` | ✅ |
| Correo de contacto | `mailto:contacto@proacademymx.com` | ✅ |

## 3. SEO e indexación

| Elemento | `/marketing-tesari/` | `/marketing-tesari/privacidad/` |
| --- | --- | --- |
| `<title>` | Tesari Marketing \| Herramienta interna de planeación publicitaria | Privacidad de Tesari Marketing \| Professional Academy |
| Meta description | ✅ única | ✅ única |
| Canonical | `https://proacademymx.com/marketing-tesari/` | `https://proacademymx.com/marketing-tesari/privacidad/` |
| `meta robots` | Ausente (indexable) | Ausente (indexable) |
| `X-Robots-Tag` | Sin bloqueo | Sin bloqueo |
| Open Graph / Twitter Card | ✅ | ✅ |
| JSON-LD | Organization + WebSite + BreadcrumbList | Organization + WebSite + BreadcrumbList |
| `robots.txt` | `Allow: /`, solo bloquea `/admin`, `/api`, `/gracias` | Igual |
| Sitemap XML | ✅ `sitemap-0.xml` incluye la URL con `/` final | ✅ incluida |
| Acceso sin autenticación | ✅ página estática | ✅ página estática |

## 4. Build

- `npm run build`: correcto; genera `dist/marketing-tesari/index.html` y `dist/marketing-tesari/privacidad/index.html`.
- `npm run check`: 0 errores, 0 warnings.
- Ambas rutas responden **HTTP 200** en el servidor local.
- Consola del navegador: solo errores de red de Google Analytics por el túnel local; sin errores de renderizado.

## 5. Accesibilidad (Lighthouse)

| Página | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- |
| `/marketing-tesari/` | 96 | 100 | 100 |
| `/marketing-tesari/privacidad/` | 96 | 100 | 100 |

Corrección aplicada: los enlaces y el *eyebrow* usaban `teal-400` sobre fondo claro (contraste 1.71:1). Se cambiaron a `teal-700` (contraste 5.21:1). Las páginas ya no tienen fallos de contraste propios.

Único hallazgo restante: el texto legal del footer compartido (`text-ink-400` sobre `#060a0a`, contraste 3.57:1) no alcanza 4.5:1. Es un problema previo del componente `Footer.astro` que afecta a todo el sitio, no a estas páginas.

## 6. Pendientes para cerrar los criterios de aceptación

| Pendiente | Motivo |
| --- | --- |
| **Publicar en producción** | Hoy `https://proacademymx.com/marketing-tesari/` y `/marketing-tesari/privacidad/` responden **404**: los cambios no se han commiteado ni desplegado. |
| **Solicitar indexación en Google Search Console** | Requiere acceso a la propiedad y acción manual; no se puede automatizar desde el repositorio. |
| **Enlazar las páginas desde el sitio** | Actualmente solo se enlazan entre sí; no hay enlaces desde otras páginas (son huérfanas y dependen del sitemap para su descubrimiento). |
| **Validar en producción** | Repetir las comprobaciones de canonical, sitemap y HTTP 200 una vez desplegado. |

## 7. Limitaciones

- La indexación efectiva depende de la evaluación y los tiempos de Google; la publicación y el envío del sitemap no la garantizan.
- El `og:image` de ambas páginas usa la imagen por defecto del sitio (`/og-default.png`); no se creó una imagen social específica.
- No se modificó el menú principal ni el footer, por decisión de contenido.
