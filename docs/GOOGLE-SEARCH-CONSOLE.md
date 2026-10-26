# Configuración de Google Search Console — Professional Academy (ProAcademy)

- **Sitio canónico:** https://proacademymx.com
- **Proyecto:** `proacademy` (repo `wizi-astro`)
- **Última actualización:** 2026-10-26
- **Alcance:** verificar la propiedad, enviar el sitemap y revisar la indexación
  del blog. Las correcciones técnicas del sitio se documentan en
  `docs/BLOG-INDEXING-REPORT.md`.

---

## 1. Resumen

El sitio quedó normalizado al dominio apex `https://proacademymx.com`:

- `www.proacademymx.com` redirige con 301 al apex.
- Canonical, JSON-LD, sitemap y `robots.txt` usan el apex.
- Las URLs del blog no llevan barra final.
- El archivo de verificación de Google responde 200 en el apex.

La parte que **no se puede completar desde el repositorio** es la operación en
Google Search Console: verificar la propiedad, enviar el sitemap, solicitar
indexación y revisar informes. También falta desplegar la versión actual del
código para que producción deje de emitir canonicales y sitemap con `www`.

Propiedad recomendada:

| Campo | Valor |
|---|---|
| Tipo | Dominio |
| Dominio | `proacademymx.com` |
| Verificación | Registro TXT en DNS |
| Cobertura | `proacademymx.com` y `www.proacademymx.com` |
| Sitemap | `https://proacademymx.com/sitemap-index.xml` |

Alternativa si no hay acceso al DNS:

| Campo | Valor |
|---|---|
| Tipo | Prefijo de URL |
| URL | `https://proacademymx.com/` |
| Verificación | Archivo HTML |
| Archivo | `/google34f3ca96c55007c0.html` |
| Sitemap | `https://proacademymx.com/sitemap-index.xml` |

La propiedad de dominio es preferible porque cubre apex y `www` y evita
propiedades duplicadas. Si ya existe una propiedad antigua de
`https://www.proacademymx.com/`, no hay que borrarla: se puede conservar como
histórico, pero las señales nuevas deben revisarse en la propiedad del apex.

---

## 2. Estado actual

| Elemento | Estado | Detalle |
|---|---|---|
| Dominio apex | Correcto | `https://proacademymx.com` responde 200. |
| Redirección `www` | Correcta en producción | `https://www.proacademymx.com/*` responde 301 al apex. |
| Archivo de verificación | Correcto | `https://proacademymx.com/google34f3ca96c55007c0.html` responde 200 con `google-site-verification: google34f3ca96c55007c0.html`. |
| Canonical en código | Correcto | Apex, sin query/hash y sin barra final salvo la raíz. |
| Canonical en producción | Pendiente de despliegue | La versión desplegada aún usa `www`. |
| Sitemap local | Correcto | 122 URLs bajo apex, sin admin/API/`gracias` y sin barras finales en el blog. |
| Sitemap en producción | Pendiente de despliegue | 122 URLs, todas bajo `www`. |
| `robots.txt` local | Correcto | Declara el sitemap en apex y bloquea `/admin`, `/api` y `/gracias`. |
| `robots.txt` en producción | Pendiente de despliegue | Aún declara el sitemap con `www`. |
| Blog en producción | Correcto | `/blog` y los artículos responden 200. |
| Imágenes duplicadas | Corregido en código y datos | 59 artículos normalizados; validación local 73/73 sin duplicados. |
| Propiedad en Search Console | Pendiente | Requiere acceso a la cuenta de Google. |
| Sitemap enviado | Pendiente | Debe enviarse después del despliegue. |
| Informes de indexación | Pendientes | Solo disponibles después de verificar la propiedad. |

> Prerrequisito: desplegar la rama actual y confirmar que producción emite el
> canonical y el sitemap en apex antes de enviar el sitemap a Search Console.

---

## 3. Acciones ya realizadas en el repositorio

1. `src/data/site.ts`, `astro.config.mjs`, `public/robots.txt`,
   `src/lib/blog-links.ts` y `src/lib/schema.ts` usan
   `https://proacademymx.com`.
2. `src/components/SEO.astro` normaliza el canonical: apex, sin query, sin hash
   y sin barra final salvo la raíz.
3. `netlify.toml` añade la redirección 301 de `www` al apex y colapsa
   `/blog/` y `/blog/*/` a su versión sin barra final.
4. El sitemap local genera 122 URLs en apex y excluye `/admin`, `/api`,
   `/gracias`, `/404` y las rutas heredadas redirigidas.
5. El archivo de verificación de Google está en `public/` y responde 200 en
   producción.
6. Se corrigieron las imágenes destacadas duplicadas y compartidas, y se
   sincronizaron Postgres y el fallback. Ver `docs/BLOG-INDEXING-REPORT.md`.

Comandos de validación después del despliegue:

```bash
curl -I https://proacademymx.com/blog
curl -I https://proacademymx.com/blog/mejor-curso-toefl-ibt-2026
curl -I https://proacademymx.com/blog/mejor-curso-toefl-ibt-2026/
curl -I https://proacademymx.com/blog/
curl -sS https://proacademymx.com/robots.txt
curl -sS https://proacademymx.com/sitemap-index.xml
curl -sS https://proacademymx.com/sitemap-0.xml
curl -sS https://proacademymx.com/google34f3ca96c55007c0.html
```

Resultado esperado:

- `/blog` y `/blog/slug` responden 200.
- `/blog/` y `/blog/slug/` responden 301 a la versión sin barra final.
- `robots.txt` declara `Sitemap: https://proacademymx.com/sitemap-index.xml`.
- El índice del sitemap apunta a `https://proacademymx.com/sitemap-0.xml`.
- El sitemap contiene 122 URLs públicas, ninguna bajo `www`, `/admin`, `/api`
  ni `/gracias`.
- El archivo de verificación responde 200 con el texto esperado.

---

## 4. Pasos para completar la configuración en Search Console

1. Entrar a <https://search.google.com/search-console> con la cuenta de Google
   propietaria del sitio.
2. Revisar si ya existe una propiedad para `proacademymx.com` o
   `https://www.proacademymx.com/`. Si existe la del apex, usarla; si solo
   existe la de `www`, conservarla y añadir la del dominio/apex.
3. Crear la propiedad de tipo **Dominio** con `proacademymx.com` y verificar por
   DNS con el registro TXT que indique Google. Si no hay acceso al DNS, crear
   una propiedad de **Prefijo de URL** con `https://proacademymx.com/` y
   verificar por archivo HTML.
4. Confirmar que
   `https://proacademymx.com/google34f3ca96c55007c0.html` responde 200 antes de
   pulsar **Verificar**. Conservar el archivo en `public/` de forma permanente.
5. En **Sitemaps**, enviar `sitemap-index.xml` y comprobar que el estado pase de
   «No se pudo obtener» a «Correcto».
6. En **Indexación → Páginas**, registrar el número inicial de páginas
   indexadas y no indexadas, y anotar los motivos principales. Prestar especial
   atención a:
   - «Duplicada, Google eligió otra canónica».
   - «Rastreada, actualmente no indexada».
   - «Página alternativa con etiqueta canónica correcta».
7. Usar **Inspección de URL** en una muestra de artículos corregidos
   (`/blog/mejor-curso-toefl-ibt-2026`,
   `/blog/simuladores-toefl-ibt-gratis`,
   `/blog/examenes-de-practica-toefl-ibt-donde-encontrar-simuladores` y algún
   artículo con imagen recuperada) y solicitar indexación.
8. En **Experiencia**, revisar Core Web Vitals y usabilidad móvil.
9. En **Rendimiento**, registrar una línea base de impresiones, clics, CTR y
   posición media. Los datos históricos pueden tardar días en aparecer.
10. Programar una revisión a 7, 14 y 28 días para confirmar la consolidación de
    canonicales y la cobertura del sitemap.

---

## 5. Problemas y seguimiento

| Prioridad | Problema | Estado | Acción |
|---|---|---|---|
| Alta | Producción aún emite canonical y sitemap con `www` | Pendiente de despliegue | Desplegar la rama actual y purgar caché si es necesario. |
| Alta | Search Console no tiene verificada la propiedad del apex | Pendiente | Verificar por DNS (recomendado) o por archivo HTML. |
| Alta | Sitemap nuevo no enviado | Pendiente | Enviar `https://proacademymx.com/sitemap-index.xml` después del despliegue. |
| Media | Posible contenido fino en categorías del blog | En revisión | Revisar en «Páginas» si Google excluye categorías con pocos artículos. |
| Media | Variantes con barra final en páginas estáticas | Aceptable | `/precios/` responde 200 con canonical a `/precios`; añadir reglas específicas solo si se quiere eliminar la variante. |
| Baja | Propiedad histórica de `www` | Informativo | Conservarla para no perder datos; las señales nuevas se revisan en el apex. |

---

## 6. Criterios de aceptación

- [ ] Propiedad `proacademymx.com` verificada en Search Console.
- [ ] `google34f3ca96c55007c0.html` accesible con HTTP 200 en el apex.
- [ ] Canonical de producción en `https://proacademymx.com/...`, sin `www` ni
      barra final.
- [ ] `sitemap-index.xml` enviado y con estado «Correcto».
- [ ] Sitemap de producción sin `www`, sin rutas de admin/API y con los 73
      artículos publicados.
- [ ] `/blog/.../` redirige con 301 a `/blog/...`.
- [ ] Informes de indexación y rendimiento revisados y documentados.
- [ ] Problemas registrados con responsable y fecha de seguimiento.

La configuración no puede considerarse validada hasta completar el despliegue y
los pasos manuales de Search Console.
