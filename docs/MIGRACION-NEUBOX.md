# Informe técnico — Migración de Professional Academy (Astro) de Vercel a Neubox

- **Proyecto:** `proacademy` (repo `hero4th/wizi-astro`)
- **Sitio:** https://www.proacademymx.com
- **Fecha:** 2026-10-15
- **Alcance:** Evaluar viabilidad técnica y operativa de migrar el sitio de Vercel a
  Neubox (plan `tellit`), comparar alternativas y recomendar un camino.

---

## 1. Configuración actual del proyecto

### 1.1 Stack
- **Astro 5.12** con `output: "static"` **+ adaptador** `@astrojs/vercel` 8.2.
- Integraciones: `@astrojs/react` (React 19), `@astrojs/mdx`, `@astrojs/sitemap`,
  `@astrojs/rss`, `astro-icon`, Tailwind 4 (`@tailwindcss/vite`).
- **Panel de administración propio (CMS)** montado dentro de Astro:
  - Editor TipTap, gestión de posts y snippets, subida de imágenes.
  - Autenticación con **bcrypt + JWT (`jose`)** en cookie httpOnly.
  - Datos en **Postgres (Neon)** vía `@neondatabase/serverless` (transporte HTTP).
- Formulario de contacto envía correo por **nodemailer** (SMTP OquMail, `mail.oqumail.com:587`).
- Imágenes de blog servidas desde el WordPress headless (`cms.proacademymx.com`)
  declaradas en `image.remotePatterns`.

### 1.2 Naturaleza del renderizado (clave)
Aunque `output` es `static`, **no todo el sitio es estático**. Las siguientes rutas
declaran `prerender = false` y **se renderizan en servidor en cada petición**:

| Ruta | Propósito | Depende de |
|---|---|---|
| `/blog/[slug]` | Artículo desde Postgres | Node + Neon |
| `/blog/categoria/[categoria]` | Listado por categoría | Node + Neon |
| `/rss.xml` | Feed RSS | Node + Neon |
| `/api/contact` | Envía lead por SMTP | Node + SMTP |
| `/api/admin/login`, `logout`, `password` | Sesión del panel | Node + Neon |
| `/api/admin/posts`, `posts/[id]`, `snippets`, `sessions` | CRUD del CMS | Node + Neon |
| `/api/admin/upload` | Subida de imágenes | Node + **Vercel Blob** |
| `/admin/*` | UI del panel | Node |
| `/404` | Página de error dinámica | Node |

El resto (home, `/cursos/*`, `/precios`, `/contacto`, FAQ, testimonios,
políticas, mapa del sitio) es **estático**.

### 1.3 Base de datos
Esquema en `scripts/db-schema.sql`: tablas `posts`, `snippets`,
`login_attempts`, `admin_credentials`, `admin_action_attempts`. **Postgres**,
gestionado en Neon. El driver es HTTP, por lo que **no requiere pooling TCP** y
es portable a cualquier runtime Node.

### 1.4 Build y redirecciones
- Script de build: `astro build && node scripts/patch-redirects.mjs`.
- `scripts/patch-redirects.mjs` reescribe **`.vercel/output/config.json`** para
  ajustar las redirecciones 301 heredadas de WordPress. **Es específico del
  adaptador Vercel** (ver §3).
- Redirecciones 301 legacy definidas en `astro.config.mjs`
  (`legacy-redirects.mjs`, `recovered-blog-redirects.mjs`).
- El sitemap incluye las URLs del blog **en tiempo de build** consultando Neon
  (`scripts/get-blog-sitemap-urls.mjs`).

### 1.5 Cabeceras de seguridad
`vercel.json` define CSP, HSTS, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy` y `Cache-Control` para `/_astro/*`.

---

## 2. Requerimientos de alojamiento

1. **Runtime Node.js persistente** (SSR + API + panel). Astro 5 exige Node
   `18.17.1+`, `20.3+` o `22`.
2. **Salida a Internet** (HTTPS saliente) hacia Neon, SMTP y las imágenes de WP.
3. **Almacenamiento persistente** para las imágenes subidas (hoy en Vercel Blob).
4. **Configuración de variables de entorno** en el panel del proveedor.
5. **Dominio + TLS** (AutoSSL/Let's Encrypt).
6. **Recursos suficientes de build** (React + TipTap + `sharp` es un build pesado).
7. **Soporte de redirecciones y cabeceras HTTP** personalizadas.

---

## 3. Dependencias de Vercel a reemplazar

| Dependencia | Ubicación | Reemplazo propuesto |
|---|---|---|
| `@astrojs/vercel` (adapter + image service) | `astro.config.mjs:6,30` | `@astrojs/node` modo `standalone` |
| `@vercel/blob` (`put`) | `src/pages/api/admin/upload.ts:4` | Disco local + ruta que sirva `/uploads/*` |
| Optimización de imágenes Vercel (`imageService:true`) | `astro.config.mjs:32` | `sharp` (default de Astro) |
| `vercel.json` (CSP/headers) | raíz | `src/middleware.ts` + `.htaccess` |
| `patch-redirects.mjs` → `.vercel/output/config.json` | `package.json` build | Redirecciones nativas de Astro / `.htaccess` |
| Variables del Vercel Marketplace (Neon) | panel Vercel | Variables manuales en Neubox |

> Solo **2 archivos de código** tocan APIs de Vercel directamente
> (`upload.ts` y `db.ts`); el resto es Astro estándar. La migración de código es
> acotada.

---

## 4. Verificación de compatibilidad con Neubox

### 4.1 Infraestructura observada
- Cuenta tipo **team user** de `proacade`, dominio `proacademymx.com`,
  home `/home/proacade`.
- **CloudLinux v9.8**, cPanel **138.0.15**, Apache **2.4.69**,
  MariaDB 10.6, PHP Selector, **NGINX Caching activo**, WordPress Toolkit,
  Installatron (existe una instalación WordPress "Professional Academy").
- En el tema **Jupiter** **no** aparece "Setup Node.js App" ni "Node.js Selector".

### 4.2 Capacidad encontrada: “AI App Hosting”
En el nuevo tema **Meridian**, cPanel ofrece **AI App Hosting** para **Node.js**:
- Despliegue desde **Git o archivo ZIP**.
- **Compilación e inicio automáticos.**
- “Control total sobre el entorno y el tiempo de ejecución”.
- Publicación vía MCP.

**Conclusión:** el plan `tellit` **sí puede** alojar el sitio completo (sitio
público + panel `/admin` + APIs) como aplicación Node.js.

### 4.3 Puntos de atención (no bloqueantes)
- **`sharp`**: debe compilar/instalar binarios nativos en CloudLinux (linux x64).
  Verificar en la prueba.
- **Límites LVE** (RAM/CPU) del hosting compartido durante `astro build`.
- **Persistencia de archivos subidos**: el disco de la cuenta es persistente,
  pero puede reiniciarse en redeploys; ubicar los uploads fuera del directorio de
  build.
- **Neon**: funciona sin cambios (driver HTTP, no requiere puerto TCP a Postgres).
- **Postgres local**: no existe en Neubox (MariaDB, no Postgres), pero **no se
  necesita** al seguir usando Neon.

---

## 5. Comparación de alternativas

| Criterio | A. Neubox AI App Hosting | B. Neubox VPS | C. PaaS (Netlify/Cloudflare/Render) | D. Quedarse en Vercel | E. Híbrido (estático Neubox + backend externo) |
|---|---|---|---|---|---|
| Compatibilidad Astro SSR | Alta (Node gasionado) | Muy alta (control total) | Muy alta (soporte nativo) | Total | Media (backend separado) |
| Costo | Ya pagado (incluido) | Mayor (VPS) | Bajo/medio (free tiers) | Actual | Ya pagado + backend |
| Rendimiento | Medio (recursos compartidos) | Alto | Alto | Alto | Alto para estático |
| Mantenimiento | Bajo | Alto (servidor, PM2, nginx, parches) | Muy bajo | Muy bajo | Medio |
| Escalabilidad | Limitada | Media (según plan) | Alta | Alta | Alta |
| Facilidad de despliegue | Alta (Git/ZIP + auto build) | Media (CI/manual) | Muy alta (Git) | Muy alta | Media |
| Control del entorno | Medio | Total | Bajo | Bajo | Medio |
| Independencia de Vercel | Sí | Sí | Sí | **No** | Sí |

---

## 6. Recomendación

**Recomendación principal: Alternativa A — Neubox AI App Hosting**, dado que:
- Cumple el objetivo declarado: **todo en Neubox** y **salir de Vercel**.
- Ya está pagado e integrado en el cPanel existente.
- La migración de código es acotada (§3).

**Plan de contingencia: Alternativa B (VPS Neubox)** si en la prueba el `build`
excede los límites LVE del hosting compartido o si `sharp` no compila. La
migración de código es idéntica.

**No recomendado:** Alternativa E (híbrido), porque contradice el objetivo de
“todo en Neubox”.

---

## 7. Procedimiento de migración propuesto

### Etapa 0 — Preparación (rama de trabajo)
1. Crear rama `migracion/node`.
2. `astro.config.mjs`: sustituir `@astrojs/vercel` por `@astrojs/node`
   (`mode: "standalone"`), eliminar `imageService: true`.
3. `src/pages/api/admin/upload.ts`: reemplazar `@vercel/blob` por escritura en
   disco (`<home>/uploads/`) y crear una ruta que sirva `/uploads/*`.
4. Añadir `src/middleware.ts` con los headers de `vercel.json`; eliminar
   `vercel.json`.
5. `package.json`: `"start": "node ./dist/server/entry.mjs"`, `engines.node`,
   y quitar `@astrojs/vercel` / `@vercel/blob`; añadir `@astrojs/node`.
6. Ajustar/retirar la dependencia de `patch-redirects.mjs` (es de Vercel) y
   dejar las redirecciones 301 en Astro/`.htaccess`.
7. Verificación local: `npm run build && npm start` + smoke test de rutas.

### Etapa 1 — Despliegue de prueba en `test.proacademymx.com`
8. Crear subdominio `test.proacademymx.com` en cPanel.
9. En **AI App Hosting**: conectar repo (o subir ZIP), definir comando de build
   (`npm ci && npm run build`), comando de arranque (`npm start`), versión de Node.
10. Configurar variables de entorno (§8).
11. Validar según §9.

### Etapa 2 — Cutover a producción
12. Repuntar `proacademymx.com`/`www` al app Node.
13. Verificar TLS, DNS, redirecciones y sitemap.
14. Mantener Vercel activo (read-only) como respaldo durante la ventana de
    observación.

---

## 8. Variables de entorno necesarias

| Variable | Valor / Cómo obtenerla |
|---|---|
| `DATABASE_URL` | Cadena de conexión de Neon (dashboard de Neon o `vercel env pull`) |
| `SESSION_SECRET` | Regenerar: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `ADMIN_PASSWORD_HASH` | Regenerar si hace falta: `node -e "console.log(require('bcryptjs').hashSync('TU_PASSWORD',12))"` (o mantener la de Neon) |
| `SMTP_USER` | `contacto@proacademymx.com` |
| `SMTP_PASS` | Contraseña del buzón OquMail |

> `DATABASE_URL` es la más crítica. Si no se tiene, se puede recuperar desde
> Vercel (`vercel env pull .env.production`) antes de dar de baja el proyecto.
> Como el panel guarda el hash en la tabla `admin_credentials`, las sesiones y la
> contraseña siguen funcionando aunque no se vuelva a definir
> `ADMIN_PASSWORD_HASH`.

---

## 9. Validaciones (checklist de aceptación)

- [ ] Home, `/cursos/*`, `/precios`, `/contacto`, FAQ, testimonios cargan.
- [ ] `/blog` lista posts; `/blog/[slug]` y `/blog/categoria/[categoria]` renderizan.
- [ ] `/rss.xml` responde con XML válido.
- [ ] Formulario `/api/contact` envía correo (recibir el lead).
- [ ] `/admin/login` autentica; CRUD de posts y snippets funciona.
- [ ] Subida de imagen en `/api/admin/upload` y su visualización.
- [ ] Redirecciones 301 legacy (`/slug` → `/blog/slug`) responden 301.
- [ ] `sitemap.xml` incluye posts y categorías.
- [ ] Headers de seguridad (CSP/HSTS) presentes.
- [ ] TLS válido en `test.proacademymx.com`.

---

## 10. Reversión (rollback)

1. **Antes del cutover:** no hay impacto; producción sigue en Vercel.
2. **Durante/después del cutover:** repuntar el DNS de `proacademymx.com`/`www`
   de vuelta a Vercel (registros A/CNAME originales).
3. Mantener el proyecto de Vercel y sus variables **sin eliminar** hasta cerrar
   la ventana de observación.
4. La base Neon no se modifica, por lo que no hay pérdida de datos.

---

## 11. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| `build` excede límites LVE | Media | Alto | Optimizar build / migrar a VPS (B) |
| `sharp` no compila en CloudLinux | Baja | Medio | Ajustar versión de Node / usar binario prebuilt |
| Pérdida de uploads en redeploy | Media | Medio | Guardar en carpeta del home, fuera de `dist`; respaldos |
| Exposición de secretos | Baja | Alto | Solo por variables del panel; nunca en el repo |
| Corte de DNS mal propagado | Baja | Alto | Bajar TTL antes del cutover; probar en subdominio |

---

## 12. Conclusión

La migración a Neubox **es viable** mediante **AI App Hosting (Node.js)**. El
trabajo de código es acotado y se concentra en: cambiar el adaptador, reemplazar
Vercel Blob por almacenamiento local, mover cabeceras a middleware y ajustar el
build. El principal riesgo es el **build en hosting compartido**, mitigable con
la alternativa VPS Neubox si fuera necesario.

---

## 13. Estado de implementación (Etapa 0 — completada)

Rama: `migracion/node`.

### Cambios realizados

| Archivo | Cambio |
|---|---|
| `package.json` | `@astrojs/vercel` y `@vercel/blob` fuera; `@astrojs/node@^9.5.5` dentro. `build` = `astro build`; `start` = `node server.mjs`; `engines.node >=20.3.0`. |
| `astro.config.mjs` | Adapter `node({ mode: "standalone" })`; eliminado `imageService`; `trailingSlash: "ignore"`. |
| `server.mjs` *(nuevo)* | Servidor propio que envuelve el `handler` de `@astrojs/node` y aplica todas las cabeceras de seguridad (CSP/HSTS/…) a **todas** las respuestas, incluidos los archivos estáticos (el adapter solo soporta CSP nativo). |
| `src/lib/storage.ts` *(nuevo)* | Guarda/lee imágenes en disco (`UPLOAD_DIR`, por defecto `./uploads`), con protección contra *path traversal*. |
| `src/pages/uploads/[...path].ts` *(nuevo)* | Sirve las imágenes subidas (sustituye las URLs del CDN de Vercel Blob). |
| `src/pages/api/admin/upload.ts` | `put()` de `@vercel/blob` → `saveUpload()`; devuelve `{ url: "/uploads/<archivo>" }`. |
| `vercel.json` *(eliminado)* | Cabeceras movidas a `server.mjs`. |
| `scripts/patch-redirects.mjs` *(eliminado)* | Ya no aplica: el adapter de Node gestiona las redirecciones 301 (con o sin barra final). |
| `.gitignore` | Ignora `/uploads/` (raíz), no `src/pages/uploads/`. |
| `.env.example` | Instrucciones adaptadas a Neubox + `UPLOAD_DIR`. |

### Pruebas locales (`npm run build` + `node --env-file=.env server.mjs`)

| Caso | Resultado |
|---|---|
| Build de Astro | ✅ completó (~36 s de server) |
| `astro check` | ✅ 0 errores |
| `GET /` (estático) | ✅ 200 + cabeceras de seguridad (CSP/HSTS/X-Frame-Options/…) |
| `GET /blog` (SSR+DB) | ✅ 200 |
| `GET /blog/<slug>` (SSR+DB) | ✅ 200 |
| `GET /blog/categoria/<cat>` | ✅ 200 |
| `GET /rss.xml` | ✅ 200 `application/xml` |
| `GET /admin/login` | ✅ 200 |
| `GET /<slug-legacy>` y `/<slug-legacy>/` | ✅ 301 → `/blog/<slug>` (ambas formas) |
| `GET /_astro/*` | ✅ `Cache-Control: immutable` |
| `GET /uploads/<archivo>` | ✅ 200 con MIME correcto |
| Path traversal en `/uploads/..` | ✅ bloqueado (404) |
| `GET /no-existe` | ✅ 404 |

### Pendiente para el despliegue

1. Conectar el repo en **AI App Hosting**: build = `npm ci && npm run build`,
   start = `npm start`, Node ≥ 20.
2. Cargar las variables de entorno (§8) usando la **branch `test` de Neon**.
3. Definir `UPLOAD_DIR` a una ruta persistente del home (p.ej.
   `/home/proacade/uploads`) para que las subidas sobrevivan a los redeploys.
4. Validar el checklist de §9 en `test.proacademymx.com`.

> **Dato pendiente:** las imágenes ya subidas al panel en producción viven en
> Vercel Blob (URLs absolutas guardadas en la tabla `posts`). Al dar de baja
> Vercel dejarían de cargar. Antes del cutover hay que decidir entre copiarlas al
> disco nuevo y reescribir las URLs, o mantener la cuenta de Blob. Las imágenes
> del WordPress (`cms.proacademymx.com`) no se ven afectadas.
