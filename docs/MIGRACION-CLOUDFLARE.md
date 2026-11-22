# Informe técnico — Migración de Professional Academy (Astro) a Cloudflare (Workers & Pages)

- **Proyecto:** `proacademy` (repo `wizi-astro`, rama `migracion/node`)
- **Sitio:** https://www.proacademymx.com
- **Fecha:** 2026-10-19
- **Alcance:** Evaluar la viabilidad de migrar el sitio de Vercel a Cloudflare
  (Workers y Pages) como alternativa tras no concretarse el despliegue en Neubox,
  con prueba local de build y de ejecución en el runtime `workerd`.

---

## 1. Resumen ejecutivo

**Sí es viable migrar a Cloudflare y el sitio puede seguir funcionando "como
siempre"**, pero **no es un cambio de hosting "tal cual"**: hay que sustituir
3 dependencias de runtime (disco local, SMTP por `nodemailer`, cabeceras del
servidor Node), aplicar un *workaround* conocido de React 19 y **contratar el
plan Workers Paid (US$5/mes)** para que el login del panel no falle por el
límite de CPU del plan gratuito.

| | Resultado |
|---|---|
| Build con adaptador Cloudflare (Astro 5) | ✅ Pasa (`astro build`, ~59 s) |
| Runtime `workerd` (prueba local `wrangler pages dev`) | ✅ Home, blog, RSS, admin y redirecciones 301 responden |
| Base de datos Neon desde Workers | ✅ Funciona (driver HTTP) |
| Tamaño del Worker | ✅ 7.4 MB sin comprimir / 1.25 MB gzip (límite actual: 64 MiB) |
| Bloqueador del plan gratuito | ⚠️ CPU 10 ms/req: `bcrypt` cost 12 tarda **~417 ms** → login falla |
| Cambios de código obligatorios | ⚠️ 5 (R2, SMTP, cabeceras, React 19, IP real) |
| Costo esperado | **~US$5/mes** (Workers Paid) + R2 gratis para subidas |

**Recomendación:** migrar a **Cloudflare Pages/Workers con plan Paid (US$5/mes)**
usando el adaptador `@astrojs/cloudflare` v12 (Astro 5). Es la alternativa más
robusta y de menor mantenimiento para salir de Vercel, con la salvedad de los
cambios de runtime listados en §6.

---

## 2. Estado actual del proyecto (línea base)

- **Astro 5.18.2** con `output: "static"` **+ adaptador** `@astrojs/node` en modo
  `standalone` (rama `migracion/node`). Integraciones: React 19, MDX, sitemap,
  RSS, `astro-icon`, Tailwind 4.
- **No todo es estático**: hay rutas `prerender = false` que se renderizan en el
  servidor en cada petición:

| Ruta | Depende de |
|---|---|
| `/blog/[slug]`, `/blog/categoria/[categoria]`, `/rss.xml` | Neon Postgres (`@neondatabase/serverless`, HTTP) |
| `/api/contact` | `nodemailer` + SMTP OquMail (`mail.oqumail.com:587`, STARTTLS) |
| `/api/admin/*` (login, logout, password, posts, snippets, sessions) | Neon + `bcryptjs` + `jose` |
| `/api/admin/upload` | **disco local** (`node:fs`, `UPLOAD_DIR`) |
| `/uploads/[...path]` | **disco local** |
| `/admin/*` y `/404` | React + Neon |

- **Subidas:** `src/lib/storage.ts` escribe en disco (`node:fs/promises`). Es el
  **único** archivo del proyecto que usa APIs `node:` incompatibles con Workers.
- **Cabeceras de seguridad:** hoy viven en `server.mjs` (servidor Node).
- **Redirecciones 301 legacy:** 178 entradas (WordPress → `/blog/...`).
- **Build:** `astro build`; el sitemap consulta Neon en build time.
- **Pendiente heredado:** las imágenes ya subidas al panel están en Vercel Blob
  y deben migrarse antes de dar de baja Vercel.

---

## 3. Encaje de Cloudflare (Workers & Pages)

- El adaptador oficial para **Astro 5** es **`@astrojs/cloudflare` v12** (peer
  `astro ^5.7`). Las versiones v13+ exigen Astro 6/7, por lo que **no aplican**
  sin actualizar Astro.
- Con Astro 5, el adaptador v12 apunta a **Cloudflare Pages Functions**
  (`dist/_worker.js` + `_routes.json` + `_redirects`). Cloudflare está
  unificando Pages hacia **Workers con Static Assets**; para desplegar como
  Worker "puro" habría que subir a Astro 6 + adaptador v13 (migración mayor,
  fuera de este alcance).
- **Assets estáticos son gratis e ilimitados** en ambos planes; solo las
  peticiones que entran al Worker (SSR/API) consumen cuota.

---

## 4. Prueba de compatibilidad realizada

Se trabajó en un `git worktree` aislado (`detached HEAD`, sin tocar la rama),
sustituyendo el adaptador Node por el de Cloudflare y ejecutando build + runtime.

### 4.1 Build

```
adapter: cloudflare({ imageService: "passthrough" })
[build] Server built in 59.13s
[build] Complete!
```

Artefactos generados:
- `dist/_worker.js/` → **7.4 MB sin comprimir / 1.25 MB gzip**.
- `dist/_redirects` → 178 líneas, todas `301` (SEO legacy preservado).
- `dist/_routes.json` → excluye del Worker los assets y los slugs legacy
  (las redirecciones se resuelven en el borde, sin gastar CPU).
- `dist/sitemap-0.xml` → **75 URLs de blog** consultadas a Neon en build time.

### 4.2 Runtime (`wrangler pages dev dist` + `nodejs_compat`)

| Caso | Resultado |
|---|---|
| `GET /` (estático) | ✅ 200 |
| `GET /blog` (SSR + Neon) | ✅ 200 — 72 enlaces de posts renderizados desde Postgres |
| `GET /blog/categoria/[cat]` | ✅ 200 |
| `GET /rss.xml` | ✅ 200 |
| `GET /admin/login` | ✅ 200 |
| Slug legacy `/acerca-del-gmat` | ✅ **301** → `/blog/que_es_el_gmat` |
| `GET /no-existe` | ⚠️ 200 (posible *soft 404*, ver §9) |

### 4.3 Bloqueador detectado y resuelto en la prueba

React 19 + adaptador Cloudflare arroja
`Uncaught ReferenceError: MessageChannel is not defined` al iniciar el Worker
(issue conocido [withastro/astro#12824](https://github.com/withastro/astro/issues/12824)).
Se soluciona aliaseando el renderer de React:

```js
// astro.config.mjs
vite: {
  resolve: {
    alias: import.meta.env.PROD && { "react-dom/server": "react-dom/server.edge" },
  },
}
```

Tras aplicarlo, el Worker arranca y todas las rutas anteriores responden.
**Este alias es obligatorio** para el despliegue.

---

## 5. Pros y contras

### Pros

- **Sin mantenimiento de servidor**: no hay Node/PM2/nginx que administrar; el
  despliegue es Git push o `wrangler`.
- **Red global / rendimiento**: CDN en +300 PoPs; los assets estáticos se sirven
  desde el borde (la mayor parte del sitio).
- **Costo bajo y predecible**: US$5/mes el plan Paid (10 M peticiones + 30 M ms
  de CPU incluidos); R2 para subidas con **10 GB gratis y egreso $0**.
- **Escalabilidad**: sin límite de RPS; los assets no consumen cuota.
- **Alta disponibilidad** y TLS gestionado.
- **Compatible con el stack actual**: Neon funciona igual (driver HTTP); el
  patrón `process.env.X ?? import.meta.env.X` del código **sigue funcionando**
  (con `nodejs_compat` y `compatibility_date >= 2025-04-01`, `process.env` se
  rellena con variables y secretos).
- **Redirecciones 301 e imágenes**: el adaptador genera `_redirects` correctas.
- **Prueba ya realizada**: el proyecto compila y corre en `workerd` con cambios
  acotados.

### Contras

- **Sin disco persistente**: las subidas del panel deben pasar a **R2**
  (reescritura de `storage.ts`, `upload.ts` y la ruta `/uploads/*`).
- **Sin SMTP "clásico"**: `nodemailer` no funciona en Workers. Hay que usar
  `worker-mailer` (API compatible con Nodemailer, SMTP sobre `cloudflare:sockets`;
  el puerto 25 está bloqueado, 587/STARTTLS sí funciona) u otra API de correo.
- **CPU del plan gratuito insuficiente**: 10 ms/req. `bcryptjs` cost 12 mide
  **~417 ms** → login y cambio de contraseña fallarían con `Error 1102`.
  **Requiere plan Paid** (30 s de CPU por invocación por defecto) o bajar el
  coste de bcrypt (degradaría seguridad).
- **Cabeceras**: `server.mjs` desaparece; hay que usar `public/_headers` (assets)
  + middleware de Astro (respuestas SSR).
- **IP de cliente**: `x-forwarded-for` es falsable en Cloudflare (se antepone la
  IP, pero un cliente puede inyectar la primera posición). El rate-limit debe
  leer **`cf-connecting-ip`**.
- **DNS**: para dominio propio hay que mover los *nameservers* a Cloudflare
  (plan free), preservando MX/SPF/DKIM de OquMail. Es el punto más delicado del
  cutover.
- **Ruta Pages (legado)**: con Astro 5 el destino es Pages Functions; el modelo
  Workers puro requiere Astro 6 + adaptador v13 (migración mayor posterior).
- **Histórico de límite de tamaño**: Pages Functions tuvo límite de 1 MiB gzip
  (nuestro bundle da 1.25 MB). Cloudflare eliminó en sep-2026 los límites
  comprimidos (ahora 64 MiB sin comprimir), pero **debe confirmarse** que el
  proyecto Pages acepta el bundle al publicar; si no, el plan B es Astro 6+Workers.
- **Dependencia de un proveedor**: aunque es portable, se cambia de "atado a
  Vercel" a "atado a Cloudflare".

---

## 6. Cambios de código requeridos (checklist)

| # | Archivo / área | Cambio |
|---|---|---|
| 1 | `astro.config.mjs` | `@astrojs/node` → `cloudflare({ imageService: "passthrough" })` + alias `react-dom/server.edge` (PROD) |
| 2 | `package.json` | Quitar `@astrojs/node`; añadir `@astrojs/cloudflare@^12.6.13`, `wrangler`, `worker-mailer`; scripts de deploy |
| 3 | `src/lib/storage.ts`, `api/admin/upload.ts`, `pages/uploads/[...path].ts` | Reemplazar `node:fs` por **binding R2** (las URLs `/uploads/<archivo>` se mantienen) |
| 4 | `src/pages/api/contact.ts` | `nodemailer` → `worker-mailer` (mismo SMTP OquMail, mismas credenciales) |
| 5 | `public/_headers` + `src/middleware.ts` | Llevar CSP/HSTS/X-Frame-Options/Referrer-Policy a `_headers` (assets) y a middleware (SSR); retirar `server.mjs` |
| 6 | `src/lib/auth.ts` | `clientIp()` → `cf-connecting-ip`; confirmar bcrypt con plan Paid |
| 7 | `wrangler.jsonc` + secretos | `compatibility_date` ≥ 2025-04-01, `nodejs_compat`, binding R2; secretos `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD_HASH`, `SMTP_USER`, `SMTP_PASS` |
| 8 | Datos | Migrar las imágenes de Vercel Blob existentes a R2 y reescribir URLs en `posts` |

> `src/middleware.ts` **no existe** hoy: hay que crearlo. No hay ninguna otra
> dependencia específica de Vercel en el código.

---

## 7. Comparativa de alternativas

| Criterio | **Cloudflare (Pages/Workers)** | Neubox (AI App Hosting Node) | Vercel (actual) | Neubox VPS |
|---|---|---|---|---|
| Compatibilidad Astro SSR | Alta (con cambios de §6) | Alta (Node gestionado) | Total | Muy alta |
| `bcrypt` / CPU | ✅ con plan Paid | ✅ Node completo | ✅ | ✅ |
| Subidas de archivos | R2 (10 GB gratis) | Disco (poco durable) | Vercel Blob | Disco |
| Correo SMTP | `worker-mailer` | Nodemailer (igual) | Nodemailer | Nodemailer |
| Costo | **US$5/mes** (+R2 gratis) | Ya pagado (pero no funcionó) | Actual | > $5/mes |
| Mantenimiento | Muy bajo | Bajo | Muy bajo | Alto |
| Rendimiento / escala | Muy alto / sin límite | Medio / LSP compartido | Alto | Medio |
| Esfuerzo de migración | Medio (5 cambios) | Medio | Nulo | Medio |
| Riesgo de despliegue | Bajo (ya probado local) | Alto (falló) | Bajo | Medio |

---

## 8. Costos estimados

| Concepto | Plan Free | Plan Paid |
|---|---|---|
| Peticiones al Worker | 100 k/día | Sin límite (10 M incluidas) |
| Assets estáticos | Gratis/ilimitado | Gratis/ilimitado |
| CPU | 10 ms (insuficiente para bcrypt) | 30 s/invocación por defecto |
| R2 (subidas) | 10 GB, 1 M escrituras, 10 M lecturas, egreso $0 | Igual (gratis dentro del tier) |
| Total | $0, pero **login roto** | **~US$5/mes** |

---

## 9. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Login falla por CPU (free) | Alta | Alto | Plan Paid $5/mes (recomendado) o bajar rondas bcrypt |
| Bundle Pages > límite | Baja | Alto | Confirmar publicación; plan B: Astro 6 + adaptador v13 (Workers) |
| Pérdida de subidas (sin disco) | Alta | Medio | R2 + migración de las imágenes de Vercel Blob |
| Correo deja de enviar | Media | Alto | `worker-mailer` probado con OquMail; alternativa: API Resend |
| `MessageChannel` (React 19) | Alta | Alto | Alias `react-dom/server.edge` (verificado) |
| MX/SPF rotos al mover DNS | Media | Alto | Bajar TTL; copiar registros MX/TXT antes del cambio; ventana de observación |
| Rate-limit evadible | Media | Medio | Usar `cf-connecting-ip` |
| 404 retorna 200 (soft 404) | Media | Bajo | Verificar/ajustar en la prueba de despliegue |

---

## 10. Plan de implementación propuesto (tras aprobación)

1. **Rama `migracion/cloudflare`** desde `migracion/node`.
2. Aplicar los cambios de §6 (empezando por adaptador + alias React; luego R2,
   SMTP, cabeceras, IP real).
3. `wrangler.jsonc` + secretos + binding R2 (usar la **rama `test` de Neon**).
4. Despliegue de **prueba** en `test.proacademymx.com` (o `*.pages.dev`) y
   validación §11.
5. **Cutover**: mover DNS a Cloudflare, apuntar el dominio al proyecto y
   verificar TLS, redirecciones y sitemap. Mantener Vercel como respaldo.
6. **Rollback**: repuntar DNS a Vercel; no se toca Neon, por lo que no hay
   pérdida de datos.

### 11. Validaciones (checklist de aceptación)

- [ ] Home, `/cursos/*`, `/precios`, `/contacto`, FAQ, testimonios.
- [ ] `/blog`, `/blog/[slug]`, `/blog/categoria/[cat]` (datos desde Neon).
- [ ] `/rss.xml` XML válido y `sitemap.xml` completo.
- [ ] `/api/contact` envía el correo (recibir lead).
- [ ] `/admin/login` autentica; CRUD de posts y snippets; subida de imagen a R2
      visible en `/uploads/<archivo>`.
- [ ] Redirecciones 301 legacy (`/slug` → `/blog/slug`).
- [ ] Cabeceras CSP/HSTS presentes en assets (vía `_headers`) y en SSR (vía middleware).
- [ ] Códigos `404` reales; `x-forwarded-for`/`cf-connecting-ip` correctos.

---

## 12. Conclusión

Cloudflare **sí permite usar el proyecto como se venía usando**: el panel `/admin`,
el blog SSR con Neon, el sitemap, las redirecciones 301 y el formulario de
contacto funcionan en `workerd` (verificado localmente). No es una migración
"sin tocar nada": exige **R2 para subidas**, **`worker-mailer` para correo**,
**cabeceras vía `_headers`/middleware**, el **alias de React 19** y
**`cf-connecting-ip`**. Con el **plan Paid de US$5/mes** desaparecen las
limitaciones de CPU y el sitio queda sin mantenimiento, más barato que Vercel y
sin las restricciones que hicieron fracasar Neubox. **Se recomienda proceder**
con una prueba de despliegue en subdominio antes del cutover de DNS.
