# Comparativa y recomendación — Migración de Professional Academy

- **Proyecto:** `proacademy` (repo `wizi-astro`)
- **Sitio:** https://www.proacademymx.com
- **Fecha:** 2026-10-19
- **Contexto:** Evaluar la salida de Vercel tras no concretarse la migración a
  **Neubox**, comparando las alternativas propuestas.

Informes detallados:
- Cloudflare (Workers & Pages) → `docs/MIGRACION-CLOUDFLARE.md`
- Netlify → `docs/MIGRACION-NETLIFY.md`
- Railway / Render (Node) → `docs/MIGRACION-RAILWAY-RENDER.md`

---

## 1. Requisitos reales del proyecto (lo que hay que soportar)

| Requisito | Detalle |
|---|---|
| Astro 5 + SSR parcial | `output: "static"` con rutas `prerender = false` |
| Postgres | Neon (`@neondatabase/serverless`, driver HTTP) |
| Auth admin | `bcryptjs` (cost 12) + `jose` (JWT en cookie) + rate-limit en DB |
| Correo | `nodemailer` vía SMTP OquMail (`mail.oqumail.com:587`, STARTTLS) |
| Subida de imágenes | Activa (`/api/admin/upload`, hoy `@vercel/blob`) |
| 178 redirecciones 301 | SEO legacy WordPress → `/blog/...` |
| Sitemap con datos de DB | Se genera en build time consultando Neon |
| Rebuild desde WordPress | Deploy Hook disparado al publicar |
| React 19, Tailwind 4, MDX, RSS | Sin restricciones especiales |
| Dominio + correo | `proacademymx.com`; MX de OquMail en Neubox |

---

## 2. Diagnóstico por alternativa

### Neubox (planteamiento original) — ❌ No viable
Hosting compartido/cPanel orientado a sitios PHP/HTML. **No soporta un proceso
Node con SSR + endpoints API** en sus planes estándar; el despliegue del
proyecto Astro con rutas de servidor **falló**. Requeriría un **VPS** aparte
(otro costo y alto mantenimiento), que no es la mejora buscada.

### Cloudflare (Pages/Workers) — ⚠️ Viable con cambios + plan Paid
Runtime de borde (`workerd`), no Node. Requiere: **R2** para subidas,
**`worker-mailer`** para SMTP, cabeceras vía `_headers`/middleware, alias de
React 19, `cf-connecting-ip` y **plan Paid US$5/mes** (el plan gratuito no
alcanza la CPU de `bcrypt`: ~417 ms vs 10 ms). Mover los **nameservers** a
Cloudflare pone en riesgo los **MX de OquMail**. Ya **probado localmente**.

### Netlify — ✅ Viable, mínimos cambios
Funciones serverless sobre **Node.js (Lambda)**: `nodemailer`, `bcrypt`, Neon y
`jose` funcionan sin cambios. Solo cambia **`@vercel/blob` → Netlify Blobs** y
las cabeceras a `netlify.toml`/`_headers`. DNS por A/CNAME (MX intactos). Plan
Free probablemente suficiente.

### Railway / Render — ✅ Viable, máxima fidelidad
Proceso **Node persistente** (`@astrojs/node` standalone, como en la rama
`migracion/node`). Todo funciona nativamente, incluido disco persistente para
subidas. Coste: **operar siempre encendido** (~US$5-10/mes); el free de Render se
duerme.

---

## 3. Matriz comparativa

| Criterio | Netlify | Railway/Render | Cloudflare | Neubox | Vercel (actual) |
|---|---|---|---|---|---|
| Compatibilidad Astro SSR | Alta | **Total** | Alta (con cambios) | ❌ Nula | Total |
| Cambios de código | **Bajos (~2)** | Bajos | Medio (5) | — | Nulo |
| `bcrypt` / CPU | ✅ Node | ✅ Node | ⚠️ plan Paid | — | ✅ |
| Subidas | Blobs | Volumen/S3 | R2 | — | Blob |
| SMTP | `nodemailer` ✅ | `nodemailer` ✅ | `worker-mailer` | — | ✅ |
| Mantenimiento | **Muy bajo** | Medio/Alto | Muy bajo | — | Muy bajo |
| Cold start | Leve | No (si pago) | No | — | Leve |
| DNS / MX | A/CNAME seguro | A/CNAME seguro | **Mueve NS** | — | A/CNAME |
| Coste | Free → US$9/mes | US$5-10/mes | **US$5/mes flat** | Ya pagado | Actual |
| Estado | Propuesto | **Ya probado** (rama node) | **Ya probado** | Falló | Producción |

---

## 4. Recomendación

**Orden de preferencia según el objetivo:**

1. **Netlify — opción recomendada por defecto.** Mínimos cambios, runtime Node
   completo (sin el problema de CPU de Cloudflare), servicios integrados
   equivalentes (Image CDN + Blobs), DNS sencillo que **no pone en riesgo el
   correo**, y plan Free suficiente para el tráfico actual. Es el mejor balance
   esfuerzo/riesgo/costo.
2. **Railway/Render (Node) — si se prioriza "usar todo como siempre".** Es la
   migración más fiel (proceso Node persistente, disco para subidas), pero exige
   operar y pagar un servicio siempre encendido.
3. **Cloudflare — si se prioriza el menor costo fijo a mayor escala.** Ya está
   probado, pero implica reescribir el runtime (R2, `worker-mailer`, cabeceras,
   alias React), pagar el plan Workers y mover los nameservers (riesgo del
   correo).

> **Descartado:** Neubox para el sitio Astro (incompatible con SSR Node en sus
> planes; el correo de OquMail **sí debe permanecer** en Neubox).

**Siguiente paso propuesto:** aprobar Netlify como destino y ejecutar una
**prueba de despliegue en subdominio** antes del cutover de DNS, manteniendo
Vercel como respaldo y sin tocar Neon ni los registros MX de OquMail.

---

## 5. Procedimiento de reversión (válido para cualquiera de las 3 opciones)

1. El despliegue de prueba corre en un subdominio y **Vercel sigue en
   producción**; no hay riesgo durante las pruebas.
2. Antes del cutover: **bajar el TTL** del DNS en Neubox (p. ej. a 300 s).
3. Registrar los valores DNS/TLS actuales de Vercel.
4. Cutover: apuntar A/CNAME al nuevo proveedor (**MX intactos**).
5. **Rollback:** restaurar los registros A/CNAME de Vercel; como la base de
   datos (Neon) y el correo (OquMail) no se migran, **no hay pérdida de datos**.
6. Baja de Vercel **solo tras** un periodo de observación estable y de haber
   migrado las imágenes existentes de Vercel Blob.
