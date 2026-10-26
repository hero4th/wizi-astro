# Reporte de corrección e indexación del blog

- **Sitio:** https://proacademymx.com
- **Repositorio:** `wizi-astro` (rama `master`)
- **Fecha de intervención:** 2026-10-26
- **Alcance:** artículos publicados del blog, sus imágenes destacadas, canonicales,
  sitemap, `robots.txt` y redirecciones de dominio/barra final.
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
4. El sitemap publicaba la portada del blog como `/blog/`, con barra final.
5. Había un título exactamente duplicado y dos pares de títulos solapados.
6. El fallback y la base de datos podían renderizar versiones distintas del HTML.

Todo lo anterior quedó corregido en código, en Postgres y en el fallback. La
validación local recorrió **73/73 artículos con HTTP 200**, canonical único,
imagen destacada única y JSON-LD absoluto. El despliegue a producción y la
operación en Search Console siguen pendientes de ejecución manual.

| Métrica | Antes | Después |
|---|---:|---:|
| Artículos publicados | 73 | 73 |
| Artículos con figura destacada al inicio del HTML | 59 | 0 |
| Artículos con referencias a `www.proacademymx.com` | 14 | 0 |
| Títulos exactamente duplicados | 1 par | 0 |
| Imágenes destacadas compartidas entre los 9 semilla | 3 imágenes / 9 artículos | 0 |
| URLs del sitemap bajo `www` | 122 | 0 |
| URLs del sitemap con barra final en `/blog...` | 1 | 0 |
| Canonicales distintos en 73 artículos locales | — | 73 únicos |

---

## 2. Método y fuentes

- **Producción:** comprobaciones HTTP sobre `https://proacademymx.com` y
  `https://www.proacademymx.com`.
- **Postgres:** inventario de las 73 filas publicadas (`draft = false`,
  `noindex = false`) antes y después de la migración.
- **Respaldo previo:** `/tmp/opencode/proacademy-posts-before-0005-2026-10-26T16-02-21-325Z.json`
  (73 filas completas, tomado antes de aplicar `0005`).
- **Fallback:** `src/data/blog-fallback.json`, usado cuando Postgres no responde.
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

### 3.3 Dominio y canonical inconsistentes

Producción ya servía el sitio en el apex y redirigía `www` con 301, pero:

- `SITE.url`, canonicales, JSON-LD, sitemap y `robots.txt` usaban `www`.
- La portada del blog aparecía como `/blog/`.
- Los artículos aceptaban `/blog/slug/` con HTTP 200 además de `/blog/slug`.

**Causa:** el dominio canónico quedó fijado al host antiguo y la normalización de
barra final no se aplicaba a las rutas SSR del blog. Un canonical que apunta a
una URL redirigida envía a Google una señal contradictoria.

### 3.4 Títulos duplicados o solapados

- `mejor-curso-toefl-ibt-2026` compartía título exacto con otro artículo.
- `simuladores-toefl-ibt-gratis` y
  `examenes-de-practica-toefl-ibt-donde-encontrar-simuladores` tenían títulos
  casi idénticos, con la misma intención de búsqueda.

**Causa:** importación de dos versiones editoriales del mismo tema sin
diferenciar el ángulo. Se corrigieron los títulos, no los slugs.

### 3.5 Fallback desincronizado

El fallback podía conservar HTML, títulos o imágenes anteriores a la corrección
en Postgres.

**Causa:** el JSON se genera/actualiza por separado de la base. Ahora se
sincronizó con las 73 filas y el render aplica la misma deduplicación a ambas
fuentes.

### 3.6 Redirecciones de barra final

Astro aceptaba variantes con y sin barra final en rutas SSR. No existía una regla
explícita que colapsara `/blog/.../` a `/blog/...`.

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

No se editaron migraciones ya aplicadas (`0001`–`0004`). Antes de ejecutarla se
guardó el respaldo completo de las 73 filas citado en la sección 2.

### 4.3 Sincronización del fallback

`src/data/blog-fallback.json` quedó alineado con Postgres en título, imagen,
dimensiones, `alt`, `html` y `body` para los 73 artículos. Ya no contiene:

- referencias a `www.proacademymx.com`;
- figuras destacadas al inicio del HTML;
- títulos duplicados;
- imágenes destacadas compartidas.

### 4.4 Dominio canónico apex

- `src/data/site.ts`: `SITE.url = "https://proacademymx.com"`.
- `astro.config.mjs`: `site` y sitemap en apex.
- `public/robots.txt`: sitemap en apex.
- `src/lib/blog-links.ts`: enlaces internos generados en apex.
- `src/lib/schema.ts`: `Article.url` e `image` absolutos y sin barra final.
- `src/components/SEO.astro`: canonical normalizado a apex, sin query, sin hash
  y sin barra final salvo la raíz.
- Email de contacto y política de privacidad actualizados al apex.

### 4.5 Redirecciones

`netlify.toml` añade:

- `https://www.proacademymx.com/*` → `https://proacademymx.com/:splat` (301).
- `/blog/` → `/blog` (301).
- `/blog/*/` → `/blog/:splat` (301).

Las redirecciones heredadas de WordPress se conservan: el build genera 178
reglas en `dist/_redirects` (356 variantes con/sin barra final).

### 4.6 Endpoints de administración

La deduplicación también se aplica al crear, editar e importar artículos en
`src/pages/api/admin/posts.ts`, `posts/[id].ts` e `import.ts`, para que el
problema no reaparezca en contenido nuevo.

### 4.7 Pruebas

`scripts/blog-indexing.test.mjs` cubre:

1. Eliminación de la figura destacada al inicio.
2. Eliminación de la misma imagen en otra figura.
3. Eliminación de variantes redimensionadas.
4. Comportamiento sin imagen y idempotencia.

---

## 5. Datos antes/después

### 5.1 Imágenes únicas asignadas a los 9 artículos semilla

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
| `tecnica-estudio-examenes-admision` | `/images/study-plan.webp` |

### 5.2 Títulos diferenciados

| Slug (sin cambios) | Título nuevo |
|---|---|
| `mejor-curso-toefl-ibt-2026` | Mejor curso TOEFL iBT en 2026: cómo elegir y qué comparar |
| `simuladores-toefl-ibt-gratis` | Simuladores TOEFL iBT gratuitos: cuáles valen la pena en 2026 |
| `examenes-de-practica-toefl-ibt-donde-encontrar-simuladores` | Exámenes de práctica TOEFL iBT: dónde encontrar simuladores en 2026 |

### 5.3 Auditoría de Postgres después de `0005`

```
published: 73
leadingFeaturedFigures: 0
withWww: 0
duplicateTitles: []
sharedImages: []
badCanonical: 0
```

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

Resultado: **9 pruebas, 8 pass, 1 skip, 0 fail**. El skip corresponde al snapshot
histórico, que no está incluido en el repositorio.

`npm run check` reporta 3 errores **preexistentes** en
`src/layouts/Base.astro` (tipado del snippet de Google Analytics:
`dataLayer`/`gtag`). No están relacionados con estos cambios y no afectan al
build ni al render; se dejan fuera del alcance de esta intervención.

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
blog/categoría: 99
categorías: 25
admin/api/gracias: 0
blog con barra final: 0
```

### 6.3 Render de los 73 artículos

Validación local artículo por artículo:

```
checked: 73
HTTP 200: 73
canonicales únicos: 73
canonical faltante o múltiple: 0
canonical distinto del esperado: 0
imágenes destacadas duplicadas: 0
JSON-LD con URL relativa: 0
JSON-LD con imagen relativa: 0
referencias a www: 0
```

Ejemplo verificado:

```
URL:       https://proacademymx.com/blog/mejor-curso-toefl-ibt-2026
canonical: https://proacademymx.com/blog/mejor-curso-toefl-ibt-2026
Article:   https://proacademymx.com/blog/mejor-curso-toefl-ibt-2026
image:     https://proacademymx.com/images/blog-toefl.webp
imágenes de la featured en el HTML: 1
```

### 6.4 Categorías

```
checked: 25
HTTP 200: 25
canonical único: 25
referencias a www: 0
```

### 6.5 Páginas estáticas y portada

- Las 23 URLs estáticas del sitemap existen en `dist`.
- Portada: canonical `https://proacademymx.com/` (la raíz sí conserva `/`).
- `/precios`, `/mapa-del-sitio` y `/preguntas-frecuentes` tienen canonical sin
  barra final y sin `www`.

### 6.6 Producción antes del despliegue

| Comprobación | Resultado actual |
|---|---|
| `https://proacademymx.com/` | 200 |
| `https://www.proacademymx.com/blog` | 301 → apex |
| `https://proacademymx.com/blog` | 200 |
| `https://proacademymx.com/blog/mejor-curso-toefl-ibt-2026` | 200 |
| Archivo de verificación de Google | 200 |
| Canonical del artículo en producción | `https://www.proacademymx.com/...` (versión anterior) |
| Sitemap de producción | 122 URLs, todas con `www` |
| `robots.txt` de producción | Sitemap con `www` |

Producción todavía ejecuta la versión anterior del código. Las correcciones
descritas se verán en el dominio solo después del despliegue.

---

## 7. Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/data/site.ts` | Dominio canónico apex |
| `src/components/SEO.astro` | Canonical normalizado |
| `src/lib/schema.ts` | `Article.url` e `image` absolutos, sin barra final |
| `src/lib/blog-images.ts` | Nuevo: deduplicación de imagen destacada |
| `src/lib/blog.ts` | Deduplicación en Postgres y fallback |
| `src/lib/blog-links.ts` | Enlaces internos en apex |
| `src/data/blog-fallback.json` | 73 artículos sincronizados |
| `netlify/database/migrations/0005_normalize_blog_indexing.sql` | Nuevo: normalización idempotente |
| `netlify.toml` | 301 de host y barra final del blog |
| `astro.config.mjs` | `site`/sitemap en apex |
| `public/robots.txt` | Sitemap en apex |
| `src/pages/api/admin/posts.ts` | Deduplicación al crear |
| `src/pages/api/admin/posts/[id].ts` | Deduplicación al editar |
| `src/pages/api/admin/import.ts` | Deduplicación al importar |
| `src/pages/api/contact.ts` | Logo y enlace en apex |
| `src/pages/politica-de-privacidad.astro` | Dominio mostrado en apex |
| `scripts/blog-indexing.test.mjs` | Nuevo: 4 pruebas |
| `scripts/blog-recovery/prepare.mjs` | Dominio apex |
| `scripts/blog-recovery/recovery.test.mjs` | Expectativas en apex |

---

## 8. Pendientes y acciones externas

### 8.1 Bloqueantes para ver el cambio en producción

1. **Desplegar** la rama actual en Netlify.
2. **Purgar el caché de Netlify** si el despliegue no invalida las respuestas
   edge del blog. El blog usa `Netlify-CDN-Cache-Control` con etiqueta `blog`;
   las publicaciones desde el admin ya purgan esa etiqueta, pero un despliegue
   puede requerir purga manual para el HTML anterior.
3. Confirmar que la migración `0005` corre en el entorno de producción. Si el
   proceso de migraciones no es automático, aplicarla una sola vez; es
   idempotente.

### 8.2 Verificación posterior al despliegue

```sh
curl -I https://proacademymx.com/blog
curl -I https://proacademymx.com/blog/mejor-curso-toefl-ibt-2026
curl -I https://proacademymx.com/blog/mejor-curso-toefl-ibt-2026/
curl -I https://proacademymx.com/blog/
curl -s https://proacademymx.com/robots.txt
curl -s https://proacademymx.com/sitemap-index.xml
```

Resultados esperados:

- `/blog` y `/blog/slug` → 200.
- `/blog/` y `/blog/slug/` → 301 a la versión sin barra final.
- `robots.txt` y sitemap en `https://proacademymx.com`.
- Canonical del artículo en apex, sin `www` y sin barra final.
- Sitemap con 122 URLs y 0 bajo `www`.

### 8.3 Google Search Console

Requiere acceso manual a la cuenta:

1. Crear o conservar una propiedad que cubra el apex. Se recomienda una
   propiedad de **Dominio** (`proacademymx.com`) verificada por DNS, porque
   cubre apex y `www`. Alternativa: propiedad de prefijo de URL
   `https://proacademymx.com/` con el archivo
   `google34f3ca96c55007c0.html`, que ya responde 200.
2. Enviar `https://proacademymx.com/sitemap-index.xml`.
3. Usar **Inspección de URL** en 3–5 artículos corregidos y solicitar indexación.
4. Revisar «Páginas» para confirmar que las variantes con `www` y con barra
   final se consolidan en el canonical apex.
5. Vigilar durante 2–4 semanas: páginas indexadas, «Duplicada, Google eligió
   otra canónica», errores de sitemap y Core Web Vitals.

El detalle operativo está en `docs/GOOGLE-SEARCH-CONSOLE.md`.

### 8.4 Riesgos y notas

- **Redundancia de redirección de host:** producción ya redirigía `www` → apex
  antes de este cambio. La regla añadida en `netlify.toml` documenta y fija ese
  comportamiento; no cambia el destino.
- **Barra final en páginas estáticas:** `/precios/` sigue respondiendo 200 con
  canonical a `/precios`. No bloquea la indexación porque el canonical es
  único, pero se puede añadir una regla específica si se quiere eliminar también
  esa variante.
- **`astro dev` y `/blog`:** el servidor de desarrollo responde 301 de `/blog`
  a sí mismo por la normalización de rutas índice de Astro. Producción responde
  200; debe confirmarse tras el despliegue. No se detectó una regla de
  redirección propia que cause el bucle.
- **Imágenes en `cms.proacademymx.com`:** se conservan en su host original. Si
  ese host dejara de responder, los artículos perderían imágenes; no es un
  problema de indexación del HTML.

---

## 9. Criterios de aceptación

- [x] Los 73 artículos cargan sin errores en validación local.
- [x] La imagen destacada no se repite en el HTML renderizado.
- [x] Los 9 artículos semilla tienen imágenes únicas.
- [x] Los títulos duplicados/solapados están diferenciados sin cambiar slugs.
- [x] Canonical, JSON-LD, sitemap y `robots.txt` usan el apex.
- [x] El sitemap no incluye `www`, admin, API ni `/gracias`.
- [x] Las redirecciones heredadas se conservan.
- [x] Postgres y el fallback están sincronizados.
- [x] Pruebas y build completados.
- [ ] Cambios desplegados en producción.
- [ ] Caché de Netlify purgado y verificaciones post-despliegue ejecutadas.
- [ ] Propiedad y sitemap validados en Google Search Console.

---

## 10. Respaldo y reversión

- Respaldo previo a la migración:
  `/tmp/opencode/proacademy-posts-before-0005-2026-10-26T16-02-21-325Z.json`.
  Contiene las 73 filas completas. Es un archivo local temporal: si se necesita
  conservarlo, moverlo a almacenamiento privado antes de limpiar `/tmp`.
- La migración `0005` no elimina columnas ni filas; solo normaliza valores. Para
  revertir datos habría que restaurar las columnas afectadas desde el respaldo.
- Los cambios de código se pueden revertir con Git; no hay cambios en slugs ni
  en la estructura de rutas.
