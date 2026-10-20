# Informe técnico — Migración de Professional Academy (Astro) a Netlify

- **Proyecto:** `proacademy` (repo `wizi-astro`, rama `master`)
- **Sitio:** https://www.proacademymx.com
- **Fecha:** 2026-10-19
- **Alcance:** Evaluar la viabilidad de migrar el sitio de Vercel a **Netlify** como
  alternativa tras no concretarse el despliegue en Neubox.

---

## 1. Resumen ejecutivo

**Sí es viable y el proyecto puede seguir usándose casi "como siempre".** Netlify
ejecuta las funciones de servidor sobre **Node.js (AWS Lambda)**, no sobre un
runtime de borde con límite de CPU, así que **`nodemailer` (SMTP OquMail) y
`bcryptjs` funcionan sin cambios ni planes especiales**. Solo hay que sustituir
**una** dependencia de Vercel (subida de archivos: `@vercel/blob` → **Netlify
Blobs**) y trasladar cabeceras/redirecciones a la configuración de Netlify.

| | Resultado |
|---|---|
| Adaptador | `@astrojs/netlify` v8.2.10 (compatible con Astro 5) |
| Runtime | Node.js serverless (no hay límite de CPU tipo Cloudflare) |
| `nodemailer` / SMTP | ✅ Funciona tal cual |
| `bcryptjs` cost 12 (login/admin) | ✅ Funciona tal cual (sin plan Paid) |
| Neon Postgres | ✅ Funciona (driver HTTP, código sin cambios) |
| Redirecciones 301 legacy (178) | ✅ El adaptador genera `dist/_redirects` |
| Subidas (`@vercel/blob`) | ⚠️ Cambiar a **Netlify Blobs** (1 archivo) |
| Cabeceras de seguridad (`vercel.json`) | ⚠️ Pasar a `netlify.toml` / `public/_headers` |
| DNS | ✅ Solo registros A/CNAME; **no** se mueven nameservers → MX de OquMail intacto |
| Cambios de código obligatorios | **~2** (Blobs + cabeceras) + rebuild hook |

**Recomendación:** es la **alternativa con menos cambios de código y sin
mantenimiento de servidor** de las evaluadas, manteniendo el runtime Node
completo. Plan **Free** probablemente suficiente para el tráfico actual
(sitio corporativo + blog); escalar a **Personal (US$9/mes)** o **Pro
(US$20/mes)** si se agotan los créditos.

---

## 2. Estado actual del proyecto (línea base)

- **Astro 5.18.2** con `output: "static"` **+ adaptador `@astrojs/vercel`**
  (`webAnalytics: false`, `imageService: true`) en la rama `master`.
  Integraciones: React 19, MDX, sitemap, RSS, `astro-icon`, Tailwind 4.
- **No todo es estático.** Hay rutas `prerender = false` que se renderizan en
  servidor en cada petición:

| Ruta | Depende de |
|---|---|
| `/blog/[slug]`, `/blog/categoria/[categoria]`, `/rss.xml` | Neon Postgres (`@neondatabase/serverless`, HTTP) |
| `/api/contact` | `nodemailer` + SMTP OquMail (`mail.oqumail.com:587`, STARTTLS) |
| `/api/admin/*` (login, logout, password, posts, snippets, sessions) | Neon + `bcryptjs` + `jose` |
| `/api/admin/upload` | **`@vercel/blob`** (almacenamiento de Vercel) |
| `/admin/*` | React + Neon |

- **Imágenes:** subidas al panel se guardan en Vercel Blob y su URL queda dentro
  del HTML del post. La optimización de imágenes la presta `@vercel` con
  `imageService`.
- **Cabeceras de seguridad (CSP/HSTS/X-Frame-Options/etc.):** viven en
  `vercel.json`.
- **Redirecciones 301 legacy:** 178 entradas (WordPress → `/blog/...`) definidas
  en `astro.config.mjs` (`redirects`).
- **Sitemap:** consulta Neon en **build time** (`get-blog-sitemap-urls.mjs`).
- **Rebuild del blog:** WordPress (Neubox/cPanel) llama a un **Deploy Hook de
  Vercel** al publicar (`docs/HEADLESS-WORDPRESS.md`).
- **Build:** `astro build && node scripts/patch-redirects.mjs`.

> **Dato clave:** el único import de Vercel en el código es
> `@vercel/blob` (`src/pages/api/admin/upload.ts:4`). El resto de dependencias de
> Vercel son de configuración (adaptador, cabeceras, hooks).

---

## 3. Encaje de Netlify

- El adaptador oficial para **Astro 5** es **`@astrojs/netlify`** (v8.x). Genera
  `.netlify/functions-internal/` (funciones serverless) y, si se usa `middlewareMode: 'edge'`,
  `.netlify/edge-functions/`.
- **Funciones serverless = Node.js (AWS Lambda)**: no hay restricción de
  milisegundos de CPU como en Workers. `nodemailer` (sockets TCP) y `bcryptjs`
  funcionan sin cambios.
- **Netlify Image CDN**: el adaptador la usa **por defecto** (`imageCDN: false`
  para desactivar). Sustituye directamente a `imageService: true` de Vercel.
  Los dominios remotos permitidos ya están en `astro.config.mjs`
  (`image.remotePatterns`), que es justo lo que Netlify Image CDN necesita.
- **Netlify Blobs** (`@netlify/blobs`): almacén de blobs/clave-valor
  cero-configuración, integrado en Functions. Es el reemplazo natural de
  Vercel Blob para las subidas del panel.
- **Redirecciones:** con `output: "static"` + adaptador, Astro emite
  `dist/_redirects` a partir del `redirects` del config → las **178 redirecciones
  301 se conservan** sin trabajo manual.
- **Cabeceras:** `public/_headers` (assets) o `[[headers]]` en `netlify.toml`
  (todo). Hay que traducir el bloque de `vercel.json`.
- **Cliente IP:** Netlify añade `x-forwarded-for` (lo que ya lee
  `src/lib/auth.ts`), pero la cabecera recomendada es `x-nf-client-connection-ip`.
  Ajuste menor de 1 línea.

---

## 4. Pros y contras

### Pros

- **Runtime Node completo:** sin límite de CPU; `bcrypt`/SMTP sin problemas ni
  plan obligatorio. Es la gran ventaja frente a Cloudflare Workers.
- **Cambios de código mínimos:** en la práctica **1 dependencia de runtime**
  (`@vercel/blob` → `@netlify/blobs`). El resto del proyecto (Neon, `jose`,
  `nodemailer`, `bcrypt`, React 19) funciona igual.
- **Sin mantenimiento de servidor:** no hay Node/PM2/nginx que administrar;
  deploy por Git push o Netlify CLI.
- **Servicios integrados equivalentes a los de Vercel:** Image CDN + Blobs.
- **DNS sencillo:** se mantienen los **nameservers en Neubox** y solo se añaden
  registros A/CNAME. **No se tocan los MX de OquMail** (el mayor riesgo de
  Cloudflare no aplica aquí).
- **Deploy Previews / ramas** y **build hooks** para el rebuild desde WordPress.
- **Escalabilidad y CDN** gestionados; HTTPS automático.
- **Plan Free** muy razonable para el tráfico de un sitio corporativo + blog.

### Contras

- **Sin disco persistente:** las subidas deben vivir en Blobs (igual que hoy en
  Vercel Blob).
- **Cold starts** en funciones serverless (latencia de la primera petición tras
  inactividad; menor que en Render free pero existe).
- **Blobs con consistencia eventual por defecto** (los cambios pueden tardar
  hasta ~60 s en propagarse globalmente; irrelevante para subidas).
- **Modelo de facturación por créditos** (más difícil de predecir que el flat de
  Vercel/Cloudflare). Deploys, ancho de banda, peticiones y cómputo consumen
  créditos. Hay que vigilar el consumo si crece el tráfico.
- **Función timeout** acotado (por defecto ~10 s free / 26 s de pago): el envío
  de correo SMTP es rápido, pero conviene no encadenar tareas lentas.
- **Cliente IP:** cambiar a `x-nf-client-connection-ip` para el rate-limit.
- **Se cambia una dependencia de proveedor** (Vercel → Netlify), aunque el
  código queda portable.

---

## 5. Cambios requeridos (checklist)

| # | Archivo / área | Cambio |
|---|---|---|
| 1 | `astro.config.mjs` | `@astrojs/vercel` → `@astrojs/netlify` (v8). Retirar `webAnalytics`/`imageService`. |
| 2 | `package.json` | Quitar `@astrojs/vercel` y `@vercel/blob`; añadir `@astrojs/netlify`, `@netlify/blobs`. |
| 3 | `src/pages/api/admin/upload.ts` | `put()` de `@vercel/blob` → `getStore().set()` de `@netlify/blobs` (misma URL lógica). |
| 4 | `netlify.toml` + `public/_headers` | Traducir CSP/HSTS/X-Frame-Options/Referrer-Policy/Permissions-Policy y el `Cache-Control` de `/_astro/*`. |
| 5 | `src/lib/auth.ts` | `clientIp()` → leer `x-nf-client-connection-ip` (fallback a `x-forwarded-for`). |
| 6 | WordPress (mu-plugin) | Sustituir el Deploy Hook de Vercel por un **Build Hook** de Netlify. |
| 7 | Env vars | `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD_HASH`, `SMTP_USER`, `SMTP_PASS`, `PUBLIC_*`. |
| 8 | Datos | Migrar las imágenes ya subidas a Vercel Blob hacia Netlify Blobs (o dejarlas accesibles durante la transición). |

> No hace falta `src/middleware.ts`: las cabeceras se resuelven en la config de
> Netlify. No hay alias de React ni `_routes.json` como en Cloudflare.

---

## 6. Costos estimados

Netlify factura por **créditos** (1 crédito ≈ US$0.0067 al ritmo de los packs de pago):

| Plan | Precio | Créditos incluidos |
|---|---|---|
| **Free** | US$0 | 300 créditos/mes |
| **Personal** | US$9/mes | 1.000 créditos/mes |
| **Pro** | US$20/mes | 3.000 créditos/mes (miembros ilimitados) |

Consumo aproximado de un sitio como este:

| Concepto | Coste | Comentario |
|---|---|---|
| Deploy de producción | 15 créditos | ~20 builds/mes dentro de Free |
| Ancho de banda | 20 créditos/GB | Tráfico bajo → decenas de GB |
| Peticiones web | 2 créditos/10k | Assets servidos por CDN |
| Cómputo | 10 créditos/GB-hora | Funciones de corta duración |

**Estimación:** con el tráfico de un sitio corporativo y un blog de ~73 posts, el
plan **Free (300 créditos)** puede bastar; si el tráfico de leads/SEO crece,
**Personal (US$9/mes)** es el siguiente escalón.

---

## 7. Comparativa con las otras alternativas

| Criterio | **Netlify** | Cloudflare (Pages/Workers) | Railway/Render (Node) | Vercel (actual) |
|---|---|---|---|---|
| Cambios de código | **Bajos (~2)** | Medio (5) | Bajos (adaptador Node) | Nulo |
| `bcrypt` / CPU | ✅ Node | ⚠️ requiere plan Paid | ✅ Node | ✅ |
| Subidas | Netlify Blobs | R2 (~10 GB gratis) | Disco/volumen o S3 | Vercel Blob |
| Correo SMTP | `nodemailer` ✅ | `worker-mailer` | `nodemailer` ✅ | `nodemailer` ✅ |
| Mantenimiento | Muy bajo | Muy bajo | **Medio/Alto** | Muy bajo |
| DNS / MX | A/CNAME, MX intacto | **Mover nameservers** (riesgo MX) | A/CNAME, MX intacto | A/CNAME |
| Costo | Free → US$9-20/mes | US$5/mes (flat) | ~US$7+/mes siempre-on | Actual |
| Cold start | Sí (leve) | No | No (si no duerme) | Sí |

---

## 8. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Subidas rotas al migrar de Blob | Alta | Medio | Reescribir `upload.ts` a Netlify Blobs **antes** del cutover; migrar blobs existentes |
| Cabeceras de seguridad ausentes | Media | Medio | Trasladar TODO `vercel.json` a `netlify.toml`/`_headers` y verificar con `curl -I` |
| Build hook de WordPress no actualizado | Media | Medio | Crear Build Hook en Netlify y actualizar el mu-plugin |
| Consumo de créditos inesperado | Media | Bajo | Monitorizar uso; alertas; subir de plan si hace falta |
| Cold start en `/blog` o `/admin` | Media | Bajo | Aceptable en este tipo de sitio; `cacheOnDemandPages` para páginas de blog |
| Rate-limit evadible | Baja | Medio | Usar `x-nf-client-connection-ip` |

---

## 9. Plan de implementación propuesto (tras aprobación)

1. Ramo `migracion/netlify` desde `master`.
2. Aplicar §5 (empezando por adaptador; luego Blobs, cabeceras, IP, build hook).
3. Conectar el repo a Netlify; definir variables de entorno (usar la **rama
   `test` de Neon** para las pruebas).
4. Despliegue de prueba en `test.proacademymx.com` o `*.netlify.app` y
   validación §10.
5. **Cutover:** añadir `proacademymx.com` + `www` en Netlify y crear los
   registros A/CNAME en Neubox (**dejar intactos los registros MX de OquMail**).
   Mantener Vercel como respaldo.
6. **Rollback:** repuntar DNS a Vercel; Neon no se toca → sin pérdida de datos.

### 10. Validaciones (checklist de aceptación)

- [ ] Home, `/cursos/*`, `/precios`, `/contacto`, FAQ, testimonios.
- [ ] `/blog`, `/blog/[slug]`, `/blog/categoria/[cat]` (datos desde Neon).
- [ ] `/rss.xml` válido y `sitemap.xml` completo.
- [ ] `/api/contact` envía el correo (recibir lead).
- [ ] `/admin/login` autentica; CRUD de posts y snippets; subida a **Blobs**
      visible en el post.
- [ ] Redirecciones 301 legacy (`/slug` → `/blog/slug`).
- [ ] Cabeceras CSP/HSTS presentes en assets y en respuestas SSR.
- [ ] Códigos `404` reales; IP de cliente correcta en el rate-limit.
- [ ] Build Hook desde WordPress reconstruye el sitio.

---

## 11. Conclusión

Netlify **es la alternativa de menor esfuerzo** que permite seguir usando el
proyecto prácticamente como hoy: Node completo (SMTP y `bcrypt` sin cambios),
Neon, React 19, redirecciones y sitemap. Solo exige cambiar la subida de
imágenes a **Netlify Blobs** y trasladar las **cabeceras** de `vercel.json`.
No obliga a mover nameservers (los **MX de OquMail quedan intactos**) y no
requiere plan de pago para que funcione el login. **Se recomienda como opción
principal**, con Railway/Render como alternativa "sin reescritura de runtime" y
Cloudflare como opción de menor coste a mayor escala.
