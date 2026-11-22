# Propuesta técnica — WordPress (headless) + Astro estático en Neubox

- **Proyecto:** `proacademy` (repo `wizi-astro`)
- **Sitio:** https://www.proacademymx.com
- **Fecha:** 2026-10-19
- **Objetivo:** Unificar hosting, base de datos, dominio y panel en **Neubox**, manteniendo un **SEO de primer nivel** mediante un front-end **100 % estático** generado con Astro.
- **Estado:** Propuesta para evaluación y aprobación (no implementada).

---

## 1. Resumen ejecutivo

Se propone volver a la arquitectura **headless WordPress + Astro estático**:

- **WordPress** (ya activo en `cms.proacademymx.com`, sobre MySQL de Neubox) se usa como **panel de contenido** (posts, categorías, imágenes, usuarios).
- **Astro** genera el sitio público como **HTML/CSS/JS estático** en el build y se **sube a Neubox** (`public_html`).
- **Dominio y correo (OquMail)** permanecen en Neubox; solo cambian los registros A/CNAME del dominio principal para apuntar a Neubox en lugar de Vercel.
- **No hay Node en producción**, no hay VPS y no hay base de datos fuera de Neubox.

**Beneficios:** una sola plataforma (Neubox), MySQL local, SEO estático superior, sin costos de Vercel/Netlify/Neon.
**Costo principal:** publicar deja de ser instantáneo (rebuild de 1-3 min) y se retira el panel `/admin` de Astro en favor de WordPress.

---

## 2. Objetivo y alcance

### Incluye
- Sitio público (`/`, `/cursos`, `/precios`, `/blog`, `/contacto`, etc.) como estático.
- Blog generado desde WordPress en build time.
- Panel de contenido en WordPress.
- Formulario de contacto operativo desde hosting compartido.
- Redirecciones 301, sitemap, RSS, robots y metadatos SEO.
- Pipeline de build + publicación automática al publicar en WordPress.
- Plan de cutover y reversión.

### No incluye
- Rediseño visual.
- Migración a otro CMS distinto de WordPress.
- Cambios de contenido editorial.
- Reescritura del front en otro framework.

---

## 3. Estado actual (línea base verificada)

| Componente | Situación hoy |
|---|---|
| Front | Astro 5.18.2, `output: "static"`, adaptador **`@astrojs/vercel`** |
| Blog | **SSR** desde **Neon Postgres** (`src/lib/db.ts`, `src/lib/blog.ts`) |
| Panel | `/admin` propio en Astro/React (Tiptap) contra Neon |
| Subidas | **`@vercel/blob`** (`src/pages/api/admin/upload.ts`) |
| Contacto | `/api/contact` con `nodemailer` + SMTP OquMail |
| 301 legacy | 178 reglas en `astro.config.mjs` → `dist/_redirects` |
| Sitemap/RSS | Sitemap consulta Neon en build; RSS en `/rss.xml` |
| WordPress | **Activo** en `cms.proacademymx.com` (API REST responde, contenido hasta ago-2026) |
| Base MySQL | Existe en Neubox (datos históricos de WordPress) |
| Dominio | `@`/`www` → Vercel; `cms` → Neubox; **MX/correo → OquMail (Neubox)** |

### Hallazgos relevantes

1. **WordPress sigue en línea** y expone `/wp-json/wp/v2/posts`: es una fuente de contenido válida y ya alojada en Neubox.
2. El contenido **actual** del blog vive en **Neon** (73 posts). Los 64 históricos provienen de WordPress; hay que **conciliar los más recientes** antes de cambiar la fuente.
3. `src/lib/wordpress.ts` hoy solo conserva **helpers de limpieza de HTML**; el *loader* de WordPress en build time **ya no existe** y hay que reimplementarlo.
4. `package.json` ejecuta `node scripts/patch-redirects.mjs`, pero **ese archivo no está en `master`** (solo aparece en la rama `migracion/node`). **Prerrequisito:** arreglar el build antes de empezar.

---

## 4. Arquitectura propuesta

```
                         ┌──────────────────── NEUBOX ────────────────────┐
                         │                                                │
  Visitante ───────────► │  Apache  →  public_html/  (HTML/CSS/JS estático)│
                         │                ▲                               │
                         │                │ FTP/rsync (build)             │
                         │                                                │
                         │  cms.proacademymx.com  (WordPress + MySQL)     │
                         │    ├─ panel de contenido                       │
                         │    ├─ medios (imágenes)                        │
                         │    └─ REST /wp-json/wp/v2  ──┐                 │
                         │                              │                 │
                         │  MX / correo OquMail         │                 │
                         └──────────────────────────────┼─────────────────┘
                                                        │ fetch (build)
                         ┌──────────────────────────────┼─────────────────┐
                         │  GitHub Actions / equipo     ▼                 │
                         │    npm run build  →  Astro genera dist/        │
                         │    sube dist/ a Neubox (FTP)                   │
                         └────────────────────────────────────────────────┘
```

**Principio:** en producción **solo Apache + PHP/WordPress + MySQL** en Neubox. Node existe únicamente en la máquina de build (GitHub Actions o local).

---

## 5. Componentes

### 5.1 WordPress como CMS (Neubox / MySQL)
- Se mantiene en `cms.proacademymx.com`, con `noindex` para que no compita en buscadores.
- Los editores usan el panel de WordPress (Gutenberg) en lugar de `/admin`.
- Las imágenes se suben a la **biblioteca de medios** de WordPress (disco de Neubox).
- La API REST (`/wp-json/wp/v2/posts`, `/categories`, `/media`) es la fuente de datos del build.

### 5.2 Astro como generador estático
- Se elimina `@astrojs/vercel` y el modo SSR del sitio público.
- `/blog/[slug]` y `/blog/categoria/[cat]` pasan a `getStaticPaths()` leyendo de WordPress **en build**.
- Se elimina la dependencia de Neon en el front.
- Imágenes remotas (WordPress) optimizadas en build; ya están autorizados los dominios en `astro.config.mjs → image.remotePatterns`.
- Se reintroduce un **loader de WordPress** (REST, paginado, con normalización y limpieza de HTML usando los helpers de `src/lib/wordpress.ts`).

### 5.3 Panel y APIs
- `/admin` de Astro se **retira**.
- `/api/contact` se reemplaza por un endpoint **PHP** (`contacto.php`) con PHPMailer y el mismo SMTP OquMail.
- Las subidas ya no usan `@vercel/blob`: las gestiona WordPress.

### 5.4 Hosting en Neubox (Apache)
- Los archivos de `dist/` se publican en `public_html`.
- **Redirecciones 301** en `.htaccess` (Apache), generadas a partir de `legacy-redirects.mjs` + `recovered-blog-redirects.mjs`.
- `404` real controlado por `.htaccess`/Apache.
- HTTPS gestionado por Neubox.
- Cache de assets estáticos (`_astro/*`) vía `.htaccess`.

### 5.5 Pipeline de build y publicación
- **GitHub Actions** (o build local) ejecuta `npm ci && npm run build`.
- El build obtiene posts de `https://cms.proacademymx.com/wp-json/wp/v2/...` por HTTPS (sin exponer MySQL a Internet).
- Los artefactos se suben a Neubox por **FTP/rsync** con credenciales guardadas como *secrets*.
- **Trigger:** al publicar/editar en WordPress, un mu-plugin llama a un webhook (GitHub `repository_dispatch`) que dispara el workflow.
- Alternativa sin CI: `npm run build` local + subida por FTP.

### 5.6 Dominio y correo
- El dominio **no se transfiere**.
- En Neubox: `@` y `www` → IP de Neubox (sitio estático); `cms` → Neubox (WordPress); **MX/TXT de OquMail intactos**.
- Se baja el TTL antes del cutover.

---

## 6. Flujo de publicación (paso a paso)

```
1. Editor entra a cms.proacademymx.com/wp-admin
2. Crea/edita un post y pulsa "Publicar"
3. WordPress guarda en MySQL (Neubox) y dispara el webhook
4. GitHub Actions inicia el workflow
5. `npm ci && npm run build`:
     - Astro consulta la API REST de WordPress
     - genera HTML estático de todos los posts/categorías
     - genera sitemap.xml y rss.xml
6. El workflow sube `dist/` a `public_html` de Neubox (FTP/rsync)
7. El sitio público queda actualizado (1-3 min desde la publicación)
```

**Consideración de experiencia:** la publicación no es instantánea. Si el jefe necesita ver el cambio al segundo, se puede mostrar un aviso o dejar una vista previa en `cms.proacademymx.com`.

---

## 7. Estrategia SEO (prioridad del cliente)

El SEO **no lo da WordPress**, lo da el **HTML estático de Astro**. Esta arquitectura conserva y mejora lo que ya funciona.

| Factor SEO | Cómo se garantiza |
|---|---|
| Renderizado | HTML estático completo (sin depender de JS) |
| Velocidad / Core Web Vitals | Archivos estáticos servidos por Apache; sin cómputo por petición |
| URLs | Se mantienen exactamente (`/blog/<slug>`, categorías) |
| Redirecciones 301 | `.htaccess` con las 178 reglas (y variantes con/sin `/`) |
| `title` / `meta` / `canonical` | Se conservan los componentes actuales |
| Open Graph / Twitter | Se conservan |
| Datos estructurados | JSON-LD actual (Article, Breadcrumb, Organization, etc.) |
| Sitemap | `sitemap-index.xml` + `sitemap-0.xml` generados en build |
| RSS | `/rss.xml` generado en build |
| `robots.txt` | Se conserva, excluyendo `/admin` y el CMS |
| 404 | Página real con HTTP 404 (no *soft 404*) |
| Backend CMS | `cms.proacademymx.com` con `noindex` |

### Checklist de validación SEO (pre-cutover)
- [ ] Las 178 redirecciones responden **301** (probar con y sin barra final).
- [ ] El sitemap lista **todos** los posts publicados (73) y categorías, sin URLs de admin.
- [ ] `/rss.xml` es XML válido y lista los posts.
- [ ] Cada post tiene `title`, `meta description`, `canonical`, OG y JSON-LD.
- [ ] `robots.txt` correcto; `cms` con `noindex`.
- [ ] HTTP 404 real en URLs inexistentes.
- [ ] Sin enlaces internos rotos ni imágenes 404.
- [ ] Core Web Vitals (Lighthouse) igual o mejor que hoy.
- [ ] Search Console sin errores nuevos tras el cutover.

---

## 8. Fases de implementación

| Fase | Actividades | Entregable | Estimación |
|---|---|---|---|
| **0. Prerrequisitos** | Arreglar `scripts/patch-redirects.mjs`; respaldo de Neon y de MySQL; inventario de los 73 posts; confirmar acceso a WP/Neubox | Baseline estable + respaldos | 0.5-1 día |
| **1. Conciliar contenido** | Verificar qué posts están solo en Neon y pasarlos a WordPress; validar categorías, imágenes y slugs | WordPress = fuente única de verdad | 1-2 días |
| **2. Loader WordPress** | Reimplementar el *loader* REST en build (paginado, normalización, limpieza HTML) | `src/lib/wordpress-loader.ts` + rutas estáticas | 2-3 días |
| **3. Front estático** | Quitar SSR/adaptador; `getStaticPaths`; eliminar Neon del front; ajustar imágenes y build | `dist/` 100 % estático | 2-3 días |
| **4. Contacto PHP** | `contacto.php` con PHPMailer + SMTP OquMail; validación y anti-spam básico | Formulario operativo sin Node | 1 día |
| **5. SEO y .htaccess** | Generar `.htaccess` con 301, cache, 404, HTTPS; sitemap/RSS; robots | Redirecciones y SEO validados | 1-2 días |
| **6. Pipeline CI + webhook** | Workflow de GitHub Actions, secrets FTP, mu-plugin de WordPress | Publicación automática | 1-2 días |
| **7. Pruebas** | Staging en subdominio; validación funcional y SEO; Lighthouse | Checklist firmado | 1-2 días |
| **8. Cutover** | TTL bajo, cambiar A/CNAME a Neubox, verificación, monitoreo | Sitio en producción en Neubox | 1 día |

**Total estimado:** **9-14 días laborables** (≈ 2-3 semanas), sujeto a la conciliación de contenido.

---

## 9. Esfuerzo y costos

| Concepto | Costo |
|---|---|
| Hosting Neubox | **Ya pagado** (sin incremento) |
| WordPress | Gratis |
| GitHub Actions | Gratis para repos públicos; ~2.000 min/mes en privados (el build usa ~2-3 min) |
| Neon | **Se puede dar de baja** tras verificar (ahorro) |
| Vercel | **Se puede dar de baja** tras el cutover (ahorro) |
| Netlify | No se contrata |

**Resultado:** costo operativo **igual o menor** al actual, con todo en Neubox.

---

## 10. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Posts solo en Neon se pierden al cambiar de fuente | Media | Alto | Inventario y conciliación en Fase 1 + respaldos |
| Pérdida de SEO por 301 mal migradas | Media | Alto | Generar y probar las 178 reglas; comparar con producción |
| Publicación no instantánea | Alta | Bajo | Comunicar el flujo; opcional vista previa en WP |
| WordPress comprometido (seguridad) | Media | Alto | Actualizaciones, 2FA, plugins mínimos, backups, `noindex` |
| Build falla y deja el sitio desactualizado | Media | Medio | Alertas del workflow; posibilidad de build local; último `dist/` como respaldo |
| Credenciales FTP en CI | Baja | Alto | Secrets cifrados; cuenta FTP dedicada con permisos mínimos |
| Imágenes remotas rompen el build | Media | Medio | Validar `remotePatterns` y disponibilidad de `cms` antes de publicar |
| Cambio de DNS mal aplicado | Baja | Alto | TTL bajo, registrar valores previos, rollback documentado |

---

## 11. Plan de cutover y reversión

### Antes del cutover
1. Completar y aprobar el checklist SEO y funcional en **staging** (p. ej. `test.proacademymx.com`).
2. Respaldar: export de WordPress (contenido + MySQL), dump de Neon y el `dist/` actual.
3. Bajar el **TTL** de los registros de 3600 s a **300 s** (24 h antes).
4. Registrar los valores DNS actuales de Vercel.

### Cutover
5. Publicar el `dist/` final en `public_html` de Neubox.
6. En la zona DNS de Neubox, cambiar **A/CNAME** de `@` y `www` a Neubox. **No tocar MX/TXT de OquMail ni el registro de `cms`.**
7. Esperar propagación (~5 min con TTL bajo).
8. Verificar HTTPS, home, blog, 301, sitemap, RSS, formulario de contacto y admin de WordPress.
9. Reenviar `sitemap-index.xml` en Search Console y monitorear errores.

### Rollback
10. Si algo falla, **restaurar los A/CNAME de Vercel** (el sitio vuelve en minutos).
11. Como Neon y OquMail no se tocan, **no hay pérdida de datos** durante el rollback.

> El rollback es de **DNS**, no de datos. Mantener Vercel activo al menos 1-2 semanas después del cutover.

---

## 12. Criterios de aceptación

- [ ] El sitio público corre **sin Node** en Neubox (solo Apache + estáticos).
- [ ] La base de datos y el panel están en **Neubox (MySQL + WordPress)**.
- [ ] Los **73 posts** publicados se ven idénticos (contenido, imágenes, categorías).
- [ ] Las **178 redirecciones** responden 301 correctamente.
- [ ] Sitemap, RSS, robots, canonical, OG y JSON-LD validados.
- [ ] El formulario de contacto envía correo por SMTP OquMail.
- [ ] Publicar en WordPress actualiza el sitio en **≤ 3 min**.
- [ ] `cms.proacademymx.com` responde y tiene `noindex`.
- [ ] Dominio y correo permanecen operativos; **MX intactos**.
- [ ] Documentación y procedimiento de rollback entregados.

---

## 13. Prerrequisitos y decisiones abiertas

**Prerrequisitos**
- Acceso de administrador a WordPress (`cms.proacademymx.com/wp-admin`).
- Acceso a cPanel/Neubox (DNS, FTP, MySQL).
- Respaldo de Neon y credenciales del proyecto.
- Confirmar el estado de los posts recientes (¿están en WP o solo en Neon?).

**Decisiones a tomar**
1. ¿Se acepta que publicar tarde 1-3 min (rebuild) en lugar de ser instantáneo?
2. ¿Se retira definitivamente el panel `/admin` de Astro?
3. ¿Build en **GitHub Actions** (recomendado) o build manual + FTP?
4. ¿Se da de baja Neon y Vercel al finalizar, o se mantienen como respaldo temporal?

---

## 14. Recomendación

Para el objetivo de **unificar todo en Neubox sin VPS, con MySQL local y SEO superior**, esta es la opción con **menor esfuerzo y menor riesgo** frente a reescribir en Laravel o PHP puro, porque:

- reutiliza el **diseño y el SEO** del front Astro actual;
- reutiliza **WordPress + MySQL** que ya están funcionando;
- elimina Node, Neon, Vercel y dependencias de runtime;
- el único costo es el **rebuild al publicar**.

**Se recomienda aprobar y ejecutar la Fase 0 (prerrequisitos y respaldos) antes de cualquier cambio.**
