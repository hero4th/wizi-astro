# Reporte de corrección e indexación del blog

- **Sitio:** https://proacademymx.com
- **Repositorio:** `wizi-astro` (rama `propuesta-blog-estatico`)
- **Fecha de intervención:** 2026-10-26, actualizado 2026-10-29
- **Alcance:** artículos publicados del blog, sus imágenes destacadas, canonicales,
  sitemap, `robots.txt`, redirecciones de dominio/barra final y sitemaps
  heredados de WordPress.
- **Fuera de alcance:** cambios editoriales de contenido, rediseño, migración de
  hosting/DNS y verificación manual en Google Search Console.

---

## 1. Resumen ejecutivo

Se revisaron los **73 artículos publicados** en Postgres y el respaldo estático
`src/data/blog-fallback.json`. Los problemas encontrados no impedían que los
artículos respondieran, pero sí generaban señales de indexación contradictorias
y una experiencia deficiente:

1. **59 de 73 artículos** repetían la imagen destacada al inicio del cuerpo.
2. **9 artículos semilla compartían solo 3 imágenes** destacadas.
3. El canonical, el sitemap y `robots.txt` usaban `https://www.proacademymx.com`,
   mientras que el dominio que responde sin redirección es el apex
   `https://proacademymx.com`.
4. Había un título exactamente duplicado y dos pares de títulos solapados.
5. El fallback y la base de datos podían renderizar versiones distintas del HTML.
6. La auditoría visual del **2026-10-29** encontró **dos pares de artículos con
   la misma fotografía** aunque la URL del archivo fuera distinta:
   `tecnica-estudio-examenes-admision` / `digital-sat-guia-completa` y
   `neurociencia-para-examen-udg-como-concentrarte-para-aprobar` /
   `mejora-tu-puntaje-en-la-prueba-paa-con-un-diagnostico`.
7. Los sitemaps heredados de WordPress (`/sitemap_index.xml`, `/post-sitemap.xml`,
   etc.) devolvían 404 y seguían apareciendo en rojo en Google Search Console.
8. El canonical y el sitemap publicaban rutas sin barra final, pero Netlify
   responde 200 en la variante con barra (`/blog/slug/`) y 301 en la variante
   sin barra. Eso convertía cada canonical en una redirección.

Todo lo anterior quedó corregido en código, en Postgres y en el fallback. La
validación local recorrió **73/73 artículos con HTTP 200**, canonical único,
imagen destacada única y JSON-LD absoluto. Además, **las 73 imágenes destacadas
son únicas por URL y por huella visual** (0 pares idénticos, 0 pares con
diferencia media < 8). El despliegue a producción y la operación en Search
Console siguen pendientes de ejecución manual.

| Métrica | Antes | Después |
|---|---:|---:|
| Artículos publicados | 73 | 73 |
| Artículos con figura destacada al inicio del HTML | 59 | 0 |
| Artículos con referencias a `www.proacademymx.com` | 14 | 0 |
| Títulos exactamente duplicados | 1 par | 0 |
| Imágenes destacadas compartidas entre los 9 semilla | 3 imágenes / 9 artículos | 0 |
| Imágenes destacadas únicas por URL | — | 73/73 |
| Pares de imágenes visualmente duplicadas | 2 pares | 0 |
| URLs del sitemap bajo `www` | 122 | 0 |
| URLs del sitemap sin barra final (excepto `/`) | 121 | 0 |
| Canonicales distintos en 73 artículos locales | — | 73 únicos |

---

## 2. Método y fuentes

- **Producción:** comprobaciones HTTP sobre `https://proacademymx.com` y
  `https://www.proacademymx.com`.
- **Postgres:** inventario de las 73 filas publicadas (`draft = false`,
  `noindex = false`) antes y después de la migración.
- **Respaldos previos:** `/tmp/opencode/proacademy-posts-before-0005-2026-10-26T16-02-21-325Z.json`
  (73 filas completas, antes de `0005`) y
  `/tmp/opencode/proacademy-image-fix-backup-2026-10-29T15-21-30-269Z.json`
  (2 filas antes de `0007`).
- **Fallback:** `src/data/blog-fallback.json`, usado cuando Postgres no responde.
- **Auditoría visual:** descarga de las 73 imágenes destacadas (producción y
  build local), comparación SHA-256 y comparación perceptual 64×64 (MAE) para
  detectar la misma fotografía aunque tuviera otra URL o resolución.
- **Build local:** `npm run build`, con generación de sitemap y `_redirects`.
- **Render real:** servidor local de Astro contra los datos de Postgres/fallback,
  con extracción de canonical, `<img>` y JSON-LD de cada artículo.

No se modificaron slugs, URLs públicas, enlaces internos ni redirecciones
heredadas. Tampoco se actualizó `updated_date` por estos cambios técnicos.

---

## 3. Problemas encontrados y causa raíz

### 3.1 Imagen destacada duplicada

WordPress incluía la imagen destacada como primer `<figure>` del contenido
(`wp-block-post-featured-image`). La plantilla de Astro ya la muestra como hero,
así que el lector veía la misma imagen dos veces. En 59 artículos la figura
estaba al inicio del HTML; en otros casos la misma imagen aparecía dentro del
cuerpo con otro tamaño (`-1024x683`) o dentro de otra figura.

**Causa:** el HTML importado conservó la figura original y la plantilla añadió
su propio hero sin deduplicar.

### 3.2 Imágenes destacadas compartidas

Los 9 artículos semilla se repartían solo tres archivos:

- `blog-sat.webp` en 4 artículos.
- `blog-toefl.webp` en 3 artículos.
- `blog-gre.webp` en 2 artículos.

**Causa:** la recuperación inicial reutilizó un conjunto mínimo de imágenes para
los artículos que no tenían una featured image propia.

La validación por URL de `0005` no detectó dos casos porque usaban archivos
distintos con el mismo contenido visual:

| Artículo A | Artículo B | Resultado de la comparación |
|---|---|---|
| `tecnica-estudio-examenes-admision` (`/images/study-plan.webp`, 1000×1000) | `digital-sat-guia-completa` (`/images/blog-sat.webp`, 1024×1024) | Misma fotografía, MAE 0.65 |
| `neurociencia-para-examen-udg-como-concentrarte-para-aprobar` (`tips-para-concentrarse-en-el-examen-udg.webp`) | `mejora-tu-puntaje-en-la-prueba-paa-con-un-diagnostico` (`mejora-…-PAA.webp`) | Archivos idénticos byte a byte (SHA-256 igual, MAE 0.00) |

Un tercer par (`gmat-o-gre…` / `simuladores-del-examen-ceneval-exani-ii`) tenía
un dHash parecido, pero la comparación 64×64 dio MAE 65.34: son imágenes
distintas y no requerían cambio.

**Causa:** el CMS conservaba dos archivos para la misma fotografía y la primera
corrección solo comparó nombres de archivo/URL, no el contenido de la imagen.

### 3.3 Dominio y canonical inconsistentes

Producción ya servía el sitio en el apex y redirigía `www` con 301, pero:

- `SITE.url`, canonicales, JSON-LD, sitemap y `robots.txt` usaban `www`.
- La portada del blog aparecía como `/blog/`.
- Los artículos aceptaban `/blog/slug/` con HTTP 200 además de `/blog/slug`.

**Causa:** el dominio canónico quedó fijado al host antiguo y la normalización de
barra final no se aplicaba a las rutas SSR del blog. Un canonical que apunta a
una URL redirigida envía a Google una señal contradictoria.

Después de corregir el host quedó un segundo desajuste: el canonical y el
sitemap publicaban `/blog/slug` (sin barra), pero Netlify sirve la versión con
barra como **200** y redirige la variante sin barra con **301**. Es decir, el
canonical de cada artículo seguía siendo una redirección. Lo mismo ocurría con
las páginas estáticas (`/precios`, `/cursos`, etc.).

### 3.4 Sitemaps heredados en 404

Los archivos de sitemap de WordPress (`/sitemap_index.xml`, `/post-sitemap.xml`,
`/page-sitemap.xml`, `/category-sitemap.xml`, `/wp-sitemap.xml`, `/sitemap.xml`)
devolvían 404. Google Search Console los conservaba como entradas en rojo
(«No se ha podido obtener») con fecha de última lectura de julio.

**Causa:** la migración a Astro publicó el sitemap nuevo en
`/sitemap-index.xml`, pero no dejó redirecciones para las rutas antiguas.

### 3.5 Títulos duplicados o solapados

- `mejor-curso-toefl-ibt-2026` compartía título exacto con otro artículo.
- `simuladores-toefl-ibt-gratis` y
  `examenes-de-practica-toefl-ibt-donde-encontrar-simuladores` tenían títulos
  casi idénticos, con la misma intención de búsqueda.

**Causa:** importación de dos versiones editoriales del mismo tema sin
diferenciar el ángulo. Se corrigieron los títulos, no los slugs.

### 3.6 Fallback desincronizado

El fallback podía conservar HTML, títulos o imágenes anteriores a la corrección
en Postgres.

**Causa:** el JSON se genera/actualiza por separado de la base. Ahora se
sincronizó con las 73 filas y el render aplica la misma deduplicación a ambas
fuentes.

### 3.7 Redirecciones de barra final y cadenas

Netlify normaliza `/ruta` → `/ruta/` con 301. Las redirecciones heredadas de
WordPress apuntaban a `/blog/slug` (sin barra), así que una URL antigua hacía
**dos saltos**: `/slug` → `/blog/slug` → `/blog/slug/`.

**Causa:** los destinos se generaron antes de alinear el canonical con la forma
que Netlify sirve con 200. Se corrigieron los destinos para que apunten
directamente a `/blog/slug/`.

---

## 4. Correcciones aplicadas

### 4.1 Deduplicación en render

Nuevo módulo `src/lib/blog-images.ts`:

- `imageKey()` obtiene el nombre de archivo y elimina sufijos de redimensionado
  de WordPress (`-1024x683`).
- `stripFeaturedImageDuplicates()` elimina la figura o el `<img>` del cuerpo
  cuando coincide con la imagen destacada, sin tocar imágenes distintas.

Se aplica en `src/lib/blog.ts` tanto a filas de Postgres como al fallback, por lo
que protege también contenido antiguo o importado antes de la migración.

### 4.2 Migración de datos `0005`

`netlify/database/migrations/0005_normalize_blog_indexing.sql` es idempotente y:

1. Cambia `https://www.proacademymx.com` por `https://proacademymx.com` en
   `canonical_url`, `html` y `body`.
2. Elimina la primera figura `wp-block-post-featured-image` del HTML y del body.
3. Asigna imágenes únicas a los 9 artículos semilla, con dimensiones y `alt`.
4. Diferencia los títulos duplicados/solapados conservando los slugs.

No se editaron migraciones ya aplicadas. Antes de ejecutarla se guardó el
respaldo completo de las 73 filas citado en la sección 2.

### 4.3 Migración de datos `0007` (imágenes visualmente duplicadas)

`netlify/database/migrations/0007_unique_blog_featured_images.sql` es idempotente
y corrige los dos pares que seguían compartiendo fotografía:

| Artículo | Imagen anterior | Imagen nueva |
|---|---|---|
| `tecnica-estudio-examenes-admision` | `/images/study-plan.webp` | `/images/methodology.webp` (1024×1024) |
| `neurociencia-para-examen-udg-como-concentrarte-para-aprobar` | `tips-para-concentrarse-en-el-examen-udg.webp` | `estudiando-para-la-prueba-paa.webp` (1280×853) |

También actualiza `image_width`, `image_height` y `image_alt`. La imagen nueva de
neurociencia ya existía dentro del cuerpo del artículo; la deduplicación del
render elimina esa copia y la muestra solo una vez como hero. No se cambiaron
slugs ni URLs.

Respaldo previo de las dos filas:
`/tmp/opencode/proacademy-image-fix-backup-2026-10-29T15-21-30-269Z.json`.

### 4.4 Sincronización del fallback

`src/data/blog-fallback.json` quedó alineado con Postgres en título, imagen,
dimensiones, `alt`, `html` y `body` para los 73 artículos. Ya no contiene:

- referencias a `www.proacademymx.com`;
- figuras destacadas al inicio del HTML;
- títulos duplicados;
- imágenes destacadas compartidas.

### 4.5 Dominio canónico apex y barra final

- `src/data/site.ts`: `SITE.url = "https://proacademymx.com"`.
- `astro.config.mjs`: `site` y sitemap en apex; el sitemap serializa cada ruta
  no raíz con una sola barra final.
- `public/robots.txt`: sitemap en apex.
- `src/lib/blog-links.ts`: enlaces internos generados en apex.
- `src/lib/schema.ts`: `Article.url` e `image` absolutos en apex.
- `src/components/SEO.astro`: canonical normalizado a apex, sin query ni hash y
  con barra final en toda ruta no raíz. Los canonicales externos se respetan.
- Email de contacto y política de privacidad actualizados al apex.

### 4.6 Redirecciones

`netlify.toml` añade o fija:

- `https://www.proacademymx.com/*` → `https://proacademymx.com/:splat` (301).
- `/sitemap_index.xml`, `/wp-sitemap.xml`, `/sitemap.xml`, `/page-sitemap.xml`,
  `/post-sitemap.xml` y `/category-sitemap.xml` → `/sitemap-index.xml` (301).

No se añaden reglas de barra final para el blog: Netlify ya redirige `/ruta` a
`/ruta/` con 301 y sirve esta última con 200. Las 178 redirecciones heredadas de
WordPress se conservan en `dist/_redirects` y todas apuntan directamente a
`/blog/<slug>/`; los 68 permalinks raíz antiguos ya no pasan por una variante
intermedia sin barra.

### 4.7 Endpoints de administración

La deduplicación también se aplica al crear, editar e importar artículos en
`src/pages/api/admin/posts.ts`, `posts/[id].ts` e `import.ts`, para que el
problema no reaparezca en contenido nuevo.

### 4.8 Pruebas

`scripts/blog-indexing.test.mjs` cubre:

1. Eliminación de la figura destacada al inicio.
2. Eliminación de la misma imagen en otra figura.
3. Eliminación de variantes redimensionadas.
4. Comportamiento sin imagen y idempotencia.

---

## 5. Datos antes/después

### 5.1 Imágenes únicas asignadas a los artículos semilla (estado final)

| Artículo (slug) | Imagen después |
|---|---|
| `digital-sat-guia-completa` | `/images/blog-sat.webp` |
| `paa-tec-de-monterrey-puntaje` | `/images/program-paa.webp` |
| `proceso-admision-universidades-eua` | `/images/sat/checklist.webp` |
| `universidades-mas-demandadas-mexico` | `/images/sat/estudiante.webp` |
| `mejor-curso-toefl-ibt-2026` | `/images/blog-toefl.webp` |
| `recursos-gratuitos-ingles-academico` | `/images/ibt-guia.webp` |
| `simuladores-toefl-ibt-gratis` | `/images/ibt-laptop.webp` |
| `gre-vs-gmat-cual-presentar` | `/images/blog-gre.webp` |
| `tecnica-estudio-examenes-admision` | `/images/methodology.webp` |

### 5.2 Títulos diferenciados

| Slug (sin cambios) | Título nuevo |
|---|---|
| `mejor-curso-toefl-ibt-2026` | Mejor curso TOEFL iBT en 2026: cómo elegir y qué comparar |
| `simuladores-toefl-ibt-gratis` | Simuladores TOEFL iBT gratuitos: cuáles valen la pena en 2026 |
| `examenes-de-practica-toefl-ibt-donde-encontrar-simuladores` | Exámenes de práctica TOEFL iBT: dónde encontrar simuladores en 2026 |

### 5.3 Auditoría de Postgres y del fallback después de `0007`

```
published: 73
leadingFeaturedFigures: 0
withWww: 0
duplicateTitles: []
imagenes destacadas distintas por URL: 73/73
pares de imagen visualmente duplicados (MAE < 8): 0
badCanonical: 0
```

Los dos artículos corregidos por `0007` coinciden exactamente entre Postgres y
`src/data/blog-fallback.json` en `image`, `image_width`/`imageHeight`, `alt` y
dimensiones. No hay diferencias de imagen entre ambas fuentes en los 73 artículos.

Las imágenes nuevas tampoco se parecen a ninguna otra del blog: la más cercana a
`/images/methodology.webp` tiene MAE 57.20 y la más cercana a
`estudiando-para-la-prueba-paa.webp` tiene MAE 40.52 (cuanto mayor, más distintas).

---

## 6. Evidencia de validación

### 6.1 Pruebas automatizadas

```sh
node --test scripts/blog-indexing.test.mjs
```

Resultado: **4 pruebas, 4 pass, 0 fail**.

```sh
node --test scripts/blog-recovery/recovery.test.mjs
```

Resultado: **5 pruebas, 4 pass, 1 skip, 0 fail**. El skip corresponde al snapshot
histórico, que no está incluido en el repositorio.

`npm run check` termina con **0 errores, 0 warnings y 9 hints** (atributos
`is:inline`, imports sin usar en endpoints). Los hints no afectan al build ni al
render y quedan fuera del alcance de esta intervención.

### 6.2 Build y sitemap

```sh
npm run build
```

Build completado correctamente. Generó:

- `dist/sitemap-index.xml` apuntando a
  `https://proacademymx.com/sitemap-0.xml`.
- `dist/sitemap-0.xml` con **122 URLs**.
- `dist/_redirects` con **178 reglas heredadas**.
- `dist/robots.txt` con el sitemap en apex.

Comprobación del sitemap local:

```
urls: 122
www: 0
sin barra final (excepto /): 0
blog artículos: 73
categorías: 25
admin/api/gracias: 0
/blog/: sí
/blog/<slug>/: 73
```

### 6.3 Render de los 73 artículos

Validación local artículo por artículo:

```
checked: 73
HTML generado: 73
canonicales únicos: 73
canonical faltante o múltiple: 0
canonical con barra final: 73
canonical distinto del esperado: 0
og:image únicas: 73
pares de imagen visualmente duplicados: 0
imágenes destacadas renderizadas una sola vez: 73
H1 único: 73
meta description: 73
noindex en sitemap: 0
JSON-LD con URL relativa: 0
JSON-LD con imagen relativa: 0
referencias a www: 0
```

Ejemplo verificado:

```
URL:       https://proacademymx.com/blog/mejor-curso-toefl-ibt-2026/
canonical: https://proacademymx.com/blog/mejor-curso-toefl-ibt-2026/
Article:   https://proacademymx.com/blog/mejor-curso-toefl-ibt-2026
image:     https://proacademymx.com/images/blog-toefl.webp
imágenes de la featured en el HTML: 1
```

En el artículo de neurociencia, el cuerpo conserva la referencia a
`estudiando-para-la-prueba-paa-1024x682.webp`, pero el render la elimina: el
HTML final contiene una sola copia, como hero, con la URL sin sufijo de tamaño.

### 6.4 Categorías

```
checked: 25
HTTP 200: 25
canonical único: 25
referencias a www: 0
```

### 6.5 Páginas estáticas y portada

- Las 23 URLs del sitemap que no son artículos ni categorías existen en `dist`.
- Portada: canonical `https://proacademymx.com/` (la raíz conserva `/`).
- `/precios/`, `/mapa-del-sitio/` y `/preguntas-frecuentes/` tienen canonical con
  barra final y sin `www`, igual que la URL que sirve Netlify con 200.

### 6.6 Producción antes del despliegue

| Comprobación | Resultado actual (código anterior) |
|---|---|
| `https://proacademymx.com/` | 200 |
| `https://www.proacademymx.com/blog` | 301 → apex |
| `https://proacademymx.com/blog` | 301 → `/blog/` |
| `https://proacademymx.com/blog/` | 200 |
| `https://proacademymx.com/blog/mejor-curso-toefl-ibt-2026` | 301 → versión con barra |
| `https://proacademymx.com/blog/mejor-curso-toefl-ibt-2026/` | 200 |
| Canonical del artículo en producción | `https://proacademymx.com/blog/...` (sin barra) |
| Sitemap de producción | 122 URLs, todas sin barra final |
| `robots.txt` de producción | Sitemap correcto en apex |
| `/sitemap_index.xml`, `/post-sitemap.xml`, `/sitemap.xml`, `/wp-sitemap.xml` | 404 |
| Artículos que repiten la featured image en el HTML | 64 |

Producción todavía ejecuta la versión anterior del código: los canonicales y el
sitemap apuntan a URLs que responden 301, los sitemaps heredados dan 404 y 64
artículos repiten la imagen destacada en el cuerpo. Todo esto se corrige con el
siguiente despliegue; no requiere cambios adicionales en el CMS. El conteo de 64
incluye variantes redimensionadas y figuras situadas más abajo, por eso es mayor
que las 59 figuras iniciales contabilizadas en `0005`.

---

## 7. Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/data/site.ts` | Dominio canónico apex |
| `src/components/SEO.astro` | Canonical en apex y con barra final (forma 200 de Netlify) |
| `src/lib/schema.ts` | `Article.url` e `image` absolutos en apex |
| `src/lib/blog-images.ts` | Nuevo: deduplicación de imagen destacada |
| `src/lib/blog.ts` | Deduplicación en Postgres y fallback |
| `src/lib/blog-links.ts` | Enlaces internos en apex |
| `src/data/blog-fallback.json` | 73 artículos sincronizados, incluidas las 2 imágenes de `0007` |
| `netlify/database/migrations/0005_normalize_blog_indexing.sql` | Normalización idempotente de host, HTML, imágenes y títulos |
| `netlify/database/migrations/0007_unique_blog_featured_images.sql` | Nuevo: imágenes únicas para los 2 pares visualmente duplicados |
| `netlify.toml` | 301 de host y de sitemaps heredados |
| `astro.config.mjs` | `site`/sitemap en apex, rutas con barra y redirecciones heredadas directas |
| `public/robots.txt` | Sitemap en apex |
| `src/pages/api/admin/posts.ts` | Deduplicación al crear |
| `src/pages/api/admin/posts/[id].ts` | Deduplicación al editar |
| `src/pages/api/admin/import.ts` | Deduplicación al importar |
| `src/pages/api/contact.ts` | Logo y enlace en apex |
| `src/pages/politica-de-privacidad.astro` | Dominio mostrado en apex |
| `scripts/blog-indexing.test.mjs` | 4 pruebas de deduplicación |
| `scripts/blog-recovery/prepare.mjs` | Dominio apex |
| `scripts/blog-recovery/recovery.test.mjs` | Expectativas en apex |
| `docs/GOOGLE-SEARCH-CONSOLE.md` | Runbook de sitemap, inspección y seguimiento |
| `docs/BLOG-INDEXING-REPORT.md` | Este reporte, actualizado 2026-10-29 |

---

## 8. Pendientes y acciones externas

### 8.1 Bloqueantes para ver el cambio en producción

1. **Desplegar** la rama actual en Netlify.
2. **Purgar el caché de Netlify** si el despliegue no invalida las respuestas
   edge del blog. El blog usa `Netlify-CDN-Cache-Control` con etiqueta `blog`;
   las publicaciones desde el admin ya purgan esa etiqueta, pero un despliegue
   puede requerir purga manual para el HTML anterior.
3. Confirmar que las migraciones `0005` y `0007` corren en el entorno de
   producción. Ambas ya están aplicadas en la base actual y son idempotentes;
   Netlify Database las reejecuta en el despliegue sin volver a cambiar filas.

### 8.2 Verificación posterior al despliegue

```sh
curl -I https://proacademymx.com/blog
curl -I https://proacademymx.com/blog/
curl -I https://proacademymx.com/blog/mejor-curso-toefl-ibt-2026
curl -I https://proacademymx.com/blog/mejor-curso-toefl-ibt-2026/
curl -I https://proacademymx.com/sitemap_index.xml
curl -I https://proacademymx.com/post-sitemap.xml
curl -s https://proacademymx.com/robots.txt
curl -s https://proacademymx.com/sitemap-index.xml
```

Resultados esperados:

- `/blog` y `/blog/slug` → 301 a la versión con barra final.
- `/blog/` y `/blog/slug/` → 200.
- Canonical del artículo en apex, con barra final y sin `www`.
- Sitemap con 122 URLs, todas con barra final salvo la raíz y 0 bajo `www`.
- `/sitemap_index.xml`, `/post-sitemap.xml`, `/sitemap.xml`, `/wp-sitemap.xml`,
  `/page-sitemap.xml` y `/category-sitemap.xml` → 301 a `/sitemap-index.xml`.
- Imágenes destacadas únicas en las 73 fichas y una sola copia por artículo.

### 8.3 Google Search Console

Requiere acceso manual a la cuenta:

1. Crear o conservar una propiedad que cubra el apex. Se recomienda una
   propiedad de **Dominio** (`proacademymx.com`) verificada por DNS, porque
   cubre apex y `www`. Alternativa: propiedad de prefijo de URL
   `https://proacademymx.com/` con el archivo
   `google34f3ca96c55007c0.html`, que ya responde 200.
2. Enviar `https://proacademymx.com/sitemap-index.xml`.
3. Eliminar de «Sitemaps» las entradas antiguas en rojo
   (`/sitemap_index.xml`, `/post-sitemap.xml`, `/page-sitemap.xml`,
   `/category-sitemap.xml`, `/sitemap.xml`, `/wp-sitemap.xml`).
4. Usar **Inspección de URL** en 3–5 artículos corregidos con la URL con barra
   final y solicitar indexación.
5. Revisar «Páginas» para confirmar que las variantes sin barra se consolidan en
   el canonical con barra.
6. Vigilar durante 2–4 semanas: páginas indexadas, «Duplicada, Google eligió
   otra canónica», errores de sitemap y Core Web Vitals.

El detalle operativo está en `docs/GOOGLE-SEARCH-CONSOLE.md`.

### 8.4 Riesgos y notas

- **Redundancia de redirección de host:** producción ya redirigía `www` → apex
  antes de este cambio. La regla añadida en `netlify.toml` documenta y fija ese
  comportamiento; no cambia el destino.
- **Barra final:** el canonical y el sitemap usan la forma con barra porque es
  la que Netlify sirve con 200. Los enlaces internos y el JSON-LD todavía pueden
  aparecer sin barra; generan un 301 y no bloquean la indexación, pero conviene
  normalizarlos en una limpieza posterior.
- **`astro dev` y `/blog`:** el servidor de desarrollo puede mostrar
  comportamientos de normalización distintos a Netlify. La comprobación válida
  es la de producción después del despliegue.
- **Imágenes en `cms.proacademymx.com`:** se conservan en su host original. Si
  ese host dejara de responder, los artículos perderían imágenes; no es un
  problema de indexación del HTML.
- **Imágenes repetidas en el cuerpo:** la deduplicación es por nombre de archivo
  sin sufijo de tamaño. Si en el futuro se sube la misma foto con otro nombre,
  la comparación por URL no la detectará; conviene revisar visualmente al subir
  contenido nuevo.

### 8.5 Seguimiento no bloqueante

Estos puntos se detectaron en la auditoría, no impiden la indexación y no se
modificaron para no ampliar el alcance:

| Punto | Estado / acción sugerida |
|---|---|
| Título duplicado entre `/blog/categoria/paa/` y `/blog/categoria/paa-examen-de-admision-udg/` | Diferenciar el título editorial de una de las categorías. |
| 39 imágenes de cuerpo con `alt` vacío | Completar `alt` desde el CMS en la próxima revisión editorial. |
| Imágenes de cuerpo compartidas entre varios artículos (32 archivos) | Es contenido editorial reutilizado (tablas, capturas, infografías), no la imagen destacada. Se revisará solo si se busca unicidad visual también dentro del cuerpo. |
| Enlaces internos y JSON-LD sin barra final | Normalizar en una limpieza técnica posterior; hoy resuelven con 301. |
| Sitemap sin `lastmod` | Añadir la fecha de actualización si se quiere mejorar el rastreo. |
| `/blog/categoria/uncategorised/` indexable | Reasignar esos artículos o excluir la categoría del sitemap. |
| Google Search Console | Requiere acción manual del responsable de la propiedad. |

---

## 9. Criterios de aceptación

- [x] Los 73 artículos se generan sin errores en validación local.
- [x] La imagen destacada no se repite en el HTML renderizado.
- [x] Los 9 artículos semilla tienen imágenes únicas.
- [x] Las 73 imágenes destacadas son únicas por URL.
- [x] Las 73 imágenes destacadas son únicas por huella visual (0 pares con MAE < 8).
- [x] Los 2 pares de imágenes visualmente duplicadas quedaron corregidos en Postgres y fallback.
- [x] Los títulos duplicados/solapados están diferenciados sin cambiar slugs.
- [x] Canonical y sitemap usan el apex y la forma con barra que responde 200.
- [x] JSON-LD y `robots.txt` usan el apex.
- [x] El sitemap no incluye `www`, admin, API ni `/gracias`.
- [x] Las redirecciones heredadas se conservan y apuntan directo a la URL final.
- [x] Los sitemaps heredados de WordPress tienen 301 al sitemap actual.
- [x] Postgres y el fallback están sincronizados.
- [x] Pruebas y build completados.
- [ ] Cambios desplegados en producción.
- [ ] Caché de Netlify purgado y verificaciones post-despliegue ejecutadas.
- [ ] Propiedad y sitemap validados en Google Search Console.

---

## 10. Respaldo y reversión

- Respaldo previo a `0005`:
  `/tmp/opencode/proacademy-posts-before-0005-2026-10-26T16-02-21-325Z.json`
  (73 filas completas).
- Respaldo previo a `0007`:
  `/tmp/opencode/proacademy-image-fix-backup-2026-10-29T15-21-30-269Z.json`
  (las 2 filas afectadas, con imagen, dimensiones, `alt` y HTML completos).
  Ambos son archivos locales temporales: si se necesitan conservar, moverlos a
  almacenamiento privado antes de limpiar `/tmp`.
- Las migraciones `0005` y `0007` no eliminan columnas ni filas; solo normalizan
  valores. Para revertir imágenes basta restaurar `image`, `image_width`,
  `image_height`, `image_alt` y `updated_at` desde el respaldo de `0007`.
- Los cambios de código se pueden revertir con Git; no hay cambios en slugs ni
  en la estructura de rutas.
