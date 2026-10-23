# Informe técnico — Migración de Professional Academy (Astro) a Railway / Render

- **Proyecto:** `proacademy` (repo `wizi-astro`, rama `master`)
- **Sitio:** https://www.proacademymx.com
- **Fecha:** 2026-10-19
- **Alcance:** Evaluar la viabilidad de migrar el sitio de Vercel a un PaaS de
  contenedores/Node gestionado (**Railway** o **Render**) como alternativa tras
  no concretarse el despliegue en Neubox.

---

## 1. Resumen ejecutivo

**Sí es viable y es la opción más cercana a "usar el proyecto como siempre".**
Railway y Render ejecutan un **proceso Node persistente** (no funciones
serverless ni runtime de borde), por lo que **todo el stack actual funciona sin
reescrituras de runtime**: `nodemailer` (SMTP OquMail), `bcryptjs`, `jose`,
Neon Postgres, `node:fs` para subidas y las cabeceras del servidor. El único
trabajo es **cambiar el adaptador `@astrojs/vercel` por `@astrojs/node`**
(justo el enfoque de la rama `migracion/node`), reapuntar la subida de archivos
a **disco persistente** (o seguir usando almacenamiento de objetos) y reemplazar
el Deploy Hook.

| | Resultado |
|---|---|
| Adaptador | `@astrojs/node` (modo `standalone`) — ya probado en la rama `migracion/node` |
| Runtime | **Node.js completo y persistente** |
| `nodemailer` / SMTP | ✅ Sin cambios |
| `bcryptjs` cost 12 | ✅ Sin cambios |
| Neon Postgres | ✅ Sin cambios (driver HTTP) |
| Subidas (`@vercel/blob`) | ⚠️ Disco persistente (volumen) o S3/R2/Blobs |
| Cabeceras (`vercel.json`) | ⚠️ A `server.mjs` / middleware |
| Redirecciones 301 | ✅ Astro las maneja |
| DNS | ✅ Solo A/CNAME; **no** se mueven nameservers → MX de OquMail intacto |
| Cambios de código | **Bajos** (adaptador + storage), sin cambios de runtime |
| Costo | ~US$5-7/mes mínimo **siempre encendido** (free tiers se duermen) |

**Recomendación:** elegir Railway/Render si el objetivo es **fidelidad total al
comportamiento actual** y se acepta **administrar/operar un servicio** (y pagar
por él de forma continua). Si se prefiere "cero operación", Netlify es mejor
opción; si se busca el menor costo fijo a escala, Cloudflare.

---

## 2. Estado actual del proyecto (línea base)

- **Astro 5.18.2**, `output: "static"` **+ adaptador `@astrojs/vercel`** en
  `master`. En la rama `migracion/node` el mismo proyecto ya usa **`@astrojs/node`**
  en modo `standalone`.
- Rutas `prerender = false` (SSR/API):

| Ruta | Depende de |
|---|---|
| `/blog/[slug]`, `/blog/categoria/[categoria]`, `/rss.xml` | Neon Postgres (HTTP) |
| `/api/contact` | `nodemailer` + SMTP OquMail (`mail.oqumail.com:587`) |
| `/api/admin/*` | Neon + `bcryptjs` + `jose` |
| `/api/admin/upload` | `@vercel/blob` (en `master`) / `node:fs` (en `migracion/node`) |
| `/admin/*` | React + Neon |

- **Cabeceras de seguridad:** en `vercel.json` (en `migracion/node` viven en
  `server.mjs`).
- **Redirecciones 301 legacy:** 178 entradas en `astro.config.mjs`.
- **Sitemap:** consulta Neon en build time.
- **Rebuild del blog:** Deploy Hook de Vercel llamado desde WordPress.
- **Build:** `astro build && node scripts/patch-redirects.mjs`.

> **Dato clave:** un proceso Node persistente elimina de raíz todos los
> problemas de runtime de las plataformas serverless/edge: no hay límite de CPU
> por petición, no hay CPU-limit de bcrypt, no hay `node:fs` prohibido, no hay
> `MessageChannel` de React 19 ni `worker-mailer`.

---

## 3. Encaje de Railway y Render

### 3.1 Enfoque común

El sitio se despliega como **servicio Node continuo**:

- Build: `npm ci && npm run build`
- Start: `node ./dist/server/entry.mjs` (salida de `@astrojs/node` standalone)
- El adaptador sirve **los assets estáticos + las rutas SSR/API** desde el mismo
  proceso. Neon (HTTP) y el SMTP funcionan sin cambios.
- Las cabeceras se aplican en `server.mjs` o en un `src/middleware.ts` de Astro.

### 3.2 Railway

- Detecta el proyecto Node automáticamente (**Nixpacks**) o despliega un
  **Dockerfile**.
- **Pricing por uso**: plan **Hobby US$5/mes** (incluye US$5 de consumo), luego
  pago por uso (vCPU/GB-RAM-hora). Los **volúmenes** (disco persistente) se
  facturan aparte.
- No tiene "free tier" permanente (solo prueba). Siempre encendido.
- Deploy por Git push o CLI; variables de entorno y dominios desde el panel.

### 3.3 Render

- **Web Service** Node (o Docker). Start command igual que en Railway.
- **Instancias free se duermen tras ~15 min de inactividad** (cold start de
  ~30-60 s): **no recomendable** para un sitio comercial. Para "siempre
  encendido" hay que usar instancia **de pago (~US$7/mes)**.
- **Discos persistentes** disponibles solo en planes de pago (se facturan por GB).
- Build hooks y deploys automáticos desde Git; HTTPS automático.

### 3.4 Subidas de archivos

Dos caminos válidos:

1. **Disco persistente** (Railway volume / Render disk) montado en `UPLOAD_DIR`,
   con la ruta `/uploads/[...path]` de la rama `migracion/node`. Requiere
   backup propio del volumen.
2. **Almacenamiento de objetos** (S3, R2 o Netlify Blobs) si se prefiere no
   depender del disco del servicio; en ese caso se conserva parte del patrón
   actual de Vercel Blob.

---

## 4. Pros y contras

### Pros

- **Máxima fidelidad:** el proyecto funciona **como se venía usando**, sin
  reescribir runtime. `nodemailer`, `bcrypt`, `jose`, `node:fs`, Neon y las
  cabeceras funcionan nativamente.
- **Sin límites de CPU por petición:** `bcrypt` cost 12 sin problemas.
- **Disco persistente opcional:** permite volver al patrón original de subidas a
  `UPLOAD_DIR` (como en `migracion/node`), con control total de los archivos.
- **Sin cold-start** si el servicio está siempre encendido (diferencia clave con
  serverless y con el free tier de Render).
- **Cualquier paquete npm** funciona (no hay restricciones de edge/workers).
- **DNS simple:** solo A/CNAME; los **MX de OquMail quedan intactos**.
- **Control y portabilidad:** es un contenedor/Node estándar; se puede mover a
  otro host sin reescribir código.
- **Deploy por Git** con build hooks (para el rebuild desde WordPress).

### Contras

- **Hay que operar un servidor:** parches, actualizaciones de dependencias,
  monitorización, escalado manual (a diferencia del "cero mantenimiento" de
  Netlify/Cloudflare).
- **Costo continuo:** para que no se duerma hay que pagar (~US$5/mes Railway,
  ~US$7/mes Render) más el volumen de disco. El **free tier de Render se duerme**
  y da mala experiencia.
- **Región única:** la latencia para usuarios en México depende de la región del
  servicio (elegir la más cercana, p. ej. US); no hay CDN global tan amplia como
  Cloudflare/Netlify para el SSR (los assets sí se pueden cachear).
- **Sin escalado automático "mágico"** ni edge global; si crece el tráfico hay
  que dimensionar la instancia.
- **Gestión de backups del disco** es responsabilidad del equipo.
- **Se cambia de dependencia de proveedor** (Vercel → Railway/Render), aunque el
  código queda más portable que en las opciones serverless.

---

## 5. Cambios requeridos (checklist)

| # | Archivo / área | Cambio |
|---|---|---|
| 1 | `astro.config.mjs` | `@astrojs/vercel` → `@astrojs/node` (`adapter: node({ mode: "standalone" })`). |
| 2 | `package.json` | Quitar `@astrojs/vercel` y `@vercel/blob`; añadir `@astrojs/node` (y `@vitejs/plugin-...` si hiciera falta). |
| 3 | `src/lib/storage.ts` + `src/pages/api/admin/upload.ts` | Volver a `node:fs` con `UPLOAD_DIR` (disco/volumen) **o** usar S3/R2. Crear la ruta `/uploads/[...path]`. |
| 4 | `server.mjs` (nuevo) + `src/middleware.ts` | Llevar CSP/HSTS/X-Frame-Options/etc. de `vercel.json` al servidor/middleware. |
| 5 | WordPress (mu-plugin) | Cambiar el Deploy Hook de Vercel por el **webhook/build hook** de Railway/Render. |
| 6 | Variables de entorno | `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD_HASH`, `SMTP_USER`, `SMTP_PASS`, `UPLOAD_DIR`, `PUBLIC_*`. |
| 7 | Railway/Render config | `start: node ./dist/server/entry.mjs`; volumen montado en `UPLOAD_DIR`; región cercana. |
| 8 | Datos | Migrar las imágenes de Vercel Blob al disco/almacenamiento nuevo. |

> No hay `_headers`, `_routes.json`, R2, `worker-mailer` ni alias de React 19:
> ninguno de los contras de runtime de las plataformas edge aplica aquí.

---

## 6. Costos estimados

| Plataforma | Mínimo siempre-encendido | Notas |
|---|---|---|
| **Railway** | **US$5/mes** (Hobby, incluye US$5 de uso) | Pago por uso; volúmenes aparte |
| **Render** | **~US$7/mes** (instance Starter) | Free se duerme; discos solo en pago |
| Cloudflare (referencia) | US$5/mes flat | Requiere reescritura de runtime |
| Netlify (referencia) | US$0 → US$9/mes | Serverless, cambios mínimos |
| Vercel (actual) | Plan actual | — |

**Estimación:** para un sitio con la carga de Professional Academy, el costo
realista de Railway/Render es **US$5-10/mes** (servicio + disco), siempre
encendido y sin cold starts.

---

## 7. Comparativa con las otras alternativas

| Criterio | **Railway/Render (Node)** | Netlify | Cloudflare (Pages/Workers) | Vercel (actual) |
|---|---|---|---|---|
| Fidelidad "como siempre" | **Máxima** | Alta | Media (reescritura runtime) | Nula |
| Cambios de código | Bajos (adaptador + storage) | Bajos (~2) | Medio (5) | Ninguno |
| `bcrypt` / CPU | ✅ Node | ✅ Node | ⚠️ plan Paid | ✅ |
| Subidas | Disco/volumen o S3 | Netlify Blobs | R2 | Vercel Blob |
| Correo SMTP | `nodemailer` ✅ | `nodemailer` ✅ | `worker-mailer` | `nodemailer` ✅ |
| Cold start | No (si siempre-on) | Leve | No | Leve |
| Mantenimiento | **Medio/Alto** | Muy bajo | Muy bajo | Muy bajo |
| DNS / MX | A/CNAME, MX intacto | A/CNAME, MX intacto | **Mover nameservers** | A/CNAME |
| Costo | US$5-10/mes continuo | US$0-9/mes | US$5/mes flat | Actual |

---

## 8. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Instancia free de Render se duerme | Alta | Alto | Usar instancia de pago (siempre-on) |
| Pérdida de subidas por volumen no persistente | Media | Alto | Montar volumen persistente + backups |
| Servicio caído por falta de mantenimiento | Media | Alto | Monitorización/alertas, actualizaciones periódicas |
| Latencia por región lejana | Media | Medio | Elegir región cercana (US) para México |
| Webhook de WordPress desactualizado | Media | Medio | Crear build hook nuevo y actualizar el mu-plugin |
| Escalado manual insuficiente ante picos | Baja | Medio | Dimensionar instancia / escalado horizontal |

---

## 9. Plan de implementación propuesto (tras aprobación)

1. Ramo `migracion/railway-render` desde `master` (o reutilizar `migracion/node`).
2. Aplicar §5 (adaptador Node, storage en disco/volumen, cabeceras, webhook).
3. Crear el servicio (Railway/Render), montar volumen, definir variables
   (usar la **rama `test` de Neon** en las pruebas).
4. Despliegue de prueba en `test.proacademymx.com` o `*.up.railway.app` /
   `*.onrender.com` y validación §10.
5. **Cutover:** añadir el dominio y crear A/CNAME en Neubox (**MX de OquMail
   intactos**). Mantener Vercel como respaldo.
6. **Rollback:** repuntar DNS a Vercel; Neon y el volumen no se tocan.

### 10. Validaciones (checklist de aceptación)

- [ ] Home, `/cursos/*`, `/precios`, `/contacto`, FAQ, testimonios.
- [ ] `/blog`, `/blog/[slug]`, `/blog/categoria/[cat]` (datos desde Neon).
- [ ] `/rss.xml` válido y `sitemap.xml` completo.
- [ ] `/api/contact` envía el correo (recibir lead).
- [ ] `/admin/login` autentica; CRUD de posts y snippets; subida persistente en
      `/uploads/<archivo>` tras un reinicio del servicio.
- [ ] Redirecciones 301 legacy (`/slug` → `/blog/slug`).
- [ ] Cabeceras CSP/HSTS presentes.
- [ ] Códigos `404` reales; IP de cliente correcta.
- [ ] Build hook desde WordPress reconstruye el sitio.

---

## 11. Conclusión

Railway/Render permiten **usar el proyecto exactamente como se venía usando**:
un proceso Node que sirve el sitio estático y el SSR, con SMTP, `bcrypt`, Neon y
disco persistente funcionando sin adaptaciones de runtime. El precio es
**operar un servicio siempre encendido** (~US$5-10/mes) y asumir su
mantenimiento. Es la opción preferida si prima la **fidelidad y la portabilidad**
sobre la comodidad; si se prefiere cero operación, **Netlify** es la mejor
relación esfuerzo/beneficio, y **Cloudflare** la de menor costo fijo a escala.
