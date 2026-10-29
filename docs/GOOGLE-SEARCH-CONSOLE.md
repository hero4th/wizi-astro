# Configuración de Google Search Console — Professional Academy (ProAcademy)

- **Sitio canónico:** https://proacademymx.com
- **Proyecto:** `proacademy` (repo `wizi-astro`)
- **Última actualización:** 2026-10-29
- **Alcance:** verificar la propiedad, enviar el sitemap, revisar la indexación
  inicial y documentar los problemas encontrados. Las correcciones técnicas del
  blog se detallan en `docs/BLOG-INDEXING-REPORT.md`.

---

## 1. Resumen

La propiedad de `proacademymx.com` **ya está verificada** en Google Search
Console y los informes de rendimiento e indexación ya muestran datos. El
sitemap correcto del sitio es:

```
https://proacademymx.com/sitemap-index.xml
```

Ese índice apunta a `https://proacademymx.com/sitemap-0.xml`, que contiene las
122 URLs públicas del sitio (páginas y blog).

El problema pendiente no es la propiedad ni el sitemap actual: en Search
Console quedaron registrados sitemaps de la **época de WordPress**
(`sitemap_index.xml`, `wp-sitemap.xml`, `sitemap.xml`). Esas rutas hoy
responden **404**, por eso aparecen en rojo con «No se ha podido obtener» y
fecha de última lectura de julio.

Para cerrar la tarea se hicieron dos correcciones en el repositorio:

1. Redirecciones 301 de las rutas antiguas de sitemap al sitemap actual.
2. Alineación de canonical y sitemap con la URL que realmente responde 200
   (con barra final), en lugar de la variante que Netlify redirige con 301.

Después del siguiente despliegue hay que enviar el sitemap correcto en Search
Console y confirmar que quede en estado **Correcto** (verde).

---

## 2. Estado actual

| Elemento | Estado | Detalle |
|---|---|---|
| Propiedad en Search Console | Verificada | Confirmado por el revisor; los informes ya muestran datos. |
| Dominio apex | Correcto | `https://proacademymx.com` responde 200. |
| Redirección `www` | Correcta | `https://www.proacademymx.com/*` responde 301 al apex. |
| Archivo de verificación | Correcto | `https://proacademymx.com/google34f3ca96c55007c0.html` responde 200. |
| `robots.txt` | Correcto | Declara `Sitemap: https://proacademymx.com/sitemap-index.xml` y bloquea `/admin`, `/api` y `/gracias`. |
| Sitemap índice | Correcto | `sitemap-index.xml` responde 200 y apunta a `sitemap-0.xml`. |
| Sitemap de URLs | Correcto | `sitemap-0.xml` responde 200 con 122 URLs públicas. |
| Sitemaps antiguos de WordPress | **Falla en Search Console** | `sitemap_index.xml`, `wp-sitemap.xml` y `sitemap.xml` responden 404. |
| Canonical / `og:url` | A corregir en el próximo despliegue | Producción emite la variante sin barra final, que Netlify redirige (301) a la versión con barra. |
| URLs del sitemap | A corregir en el próximo despliegue | Producción lista 121 URLs sin barra final que responden 301 a la versión con barra; solo `/` responde 200 directo. |
| Informes de indexación y rendimiento | Disponibles | Requieren registrar la línea base (ver sección 6). |

> Prerrequisito: desplegar la rama actual para que producción emita
> canonicales y sitemap con la URL final (barra final) y para que las rutas
> antiguas de sitemap redirijan en lugar de devolver 404.

---

## 3. Diagnóstico realizado (2026-10-29)

Comprobaciones con `curl` contra producción:

| URL | Resultado |
|---|---|
| `/robots.txt` | 200, declara el sitemap correcto |
| `/sitemap-index.xml` | 200, índice con un solo sitemap |
| `/sitemap-0.xml` | 200, 122 URLs |
| `/sitemap_index.xml` | **404** |
| `/wp-sitemap.xml` | **404** |
| `/sitemap.xml` | **404** |
| `/blog/como-entrar-a-medicina-udg` | 301 → `/blog/como-entrar-a-medicina-udg/` |
| `/blog/como-entrar-a-medicina-udg/` | 200 |

Hallazgos:

- Los sitemaps que Search Console conserva en rojo son los de WordPress; esas
  rutas ya no existen en el sitio estático. Google las sigue consultando y
  recibe 404.
- El sitemap actual no estaba mal formado: el índice y el archivo de URLs
  responden 200 con `application/xml`.
- Netlify sirve cada página como `index.html` dentro de su carpeta (`pretty
  URLs`), por lo que la URL final lleva barra final. Las 121 URLs del sitemap
  sin barra respondían 301. Aunque Google sigue los 301, la buena práctica es
  listar en el sitemap y en el canonical la URL que responde 200.
- El canonical y `og:url` de producción apuntaban a la variante sin barra, es
  decir, a una redirección. Esto puede producir avisos de «Página con
  redirección» y diluir señales de canonicalización.

---

## 4. Acciones realizadas en el repositorio

1. `netlify.toml`: redirecciones 301 de `/sitemap_index.xml`,
   `/wp-sitemap.xml`, `/sitemap.xml`, `/page-sitemap.xml`, `/post-sitemap.xml`
   y `/category-sitemap.xml` a `/sitemap-index.xml`.
2. `src/components/SEO.astro`: el canonical y `og:url` usan la URL final con
   barra final en rutas distintas de `/` (apex, sin query ni hash).
3. `astro.config.mjs`: el sitemap emite esas mismas URLs con barra final, en
   lugar de las variantes que responden 301.
4. `public/robots.txt`: mantiene el sitemap correcto y los bloqueos de
   `/admin`, `/api` y `/gracias`.
5. El archivo de verificación de Google permanece en `public/`.

Comandos de validación después del despliegue:

```bash
curl -I https://proacademymx.com/sitemap-index.xml
curl -I https://proacademymx.com/sitemap-0.xml
curl -I https://proacademymx.com/sitemap_index.xml
curl -I https://proacademymx.com/wp-sitemap.xml
curl -I https://proacademymx.com/sitemap.xml
curl -sS https://proacademymx.com/sitemap-0.xml | grep -c "<url>"
curl -sS https://proacademymx.com/blog/como-entrar-a-medicina-udg/ \
  | grep -o '<link rel="canonical"[^>]*>'
```

Resultado esperado:

- `sitemap-index.xml` y `sitemap-0.xml`: 200.
- Rutas antiguas de sitemap: 301 a `/sitemap-index.xml`.
- `sitemap-0.xml` con 122 URLs y todas con barra final salvo la raíz.
- Canonical de un artículo: `https://proacademymx.com/blog/<slug>/`.
- `robots.txt` con `Sitemap: https://proacademymx.com/sitemap-index.xml`.
- Archivo de verificación con 200 y el texto esperado.

---

## 5. Pasos exactos en Search Console

1. Entrar a <https://search.google.com/search-console> con la cuenta
   propietaria y seleccionar la propiedad de `proacademymx.com`.
2. Abrir **Índice → Sitemaps**.
3. En **Añadir un sitemap** escribir únicamente:

   ```
   sitemap-index.xml
   ```

   (Search Console añade el dominio automáticamente; también se puede pegar la
   URL completa `https://proacademymx.com/sitemap-index.xml`).
4. Pulsar **Enviar**. El estado inicial puede ser «Enviado» o «Pendiente»;
   tarda desde unos minutos hasta 24–48 h en pasar a **Correcto**.
5. En la lista de sitemaps, borrar las entradas antiguas que están en rojo
   (`sitemap_index.xml`, `wp-sitemap.xml`, `sitemap.xml`) con el menú de cada
   fila → **Eliminar sitemap**. Ya no aportan nada y solo generan ruido. Si se
   prefiere conservarlas, tras el despliegue Google volverá a leerlas y seguirá
   el 301 hasta el índice actual; el resultado también debe quedar en verde.
6. Confirmar que la única entrada necesaria, `sitemap-index.xml`, aparece en
   **Correcto** y que el número de URLs detectadas es 122.
7. Abrir **Indexación → Páginas** y registrar la línea base (sección 6).
8. Usar **Inspección de URL** en una muestra de artículos y páginas clave para
   comprobar que Google elige el canonical con barra final y solicitar
   indexación si procede.

> Nota: Google puede tardar en reflejar el cambio. No es necesario reenviar el
> sitemap todos los días; con una vez enviado, Google lo vuelve a leer solo.

---

## 6. Revisión inicial de informes (línea base)

Registrar estos valores el día de la revisión para poder comparar después:

| Informe | Qué anotar |
|---|---|
| **Indexación → Páginas** | Nº de páginas indexadas, no indexadas y motivos principales. |
| **Rendimiento** | Impresiones, clics, CTR y posición media de los últimos 3 meses. |
| **Experiencia → Core Web Vitals** | URLs buenas, mejorables y deficientes. |
| **Experiencia → Usabilidad móvil** | Nº de páginas válidas y con problemas. |
| **Mejoras** | Avisos de datos estructurados (FAQ, Curso, Organización, etc.). |
| **Seguridad y acciones manuales** | Confirmar que no hay acciones manuales ni problemas de seguridad. |

Motivos de no indexación a vigilar:

- «Duplicada, Google eligió otra canónica» → revisar que ya no apunte a la
  variante sin barra.
- «Página con redirección» → debería desaparecer al alinear canonical y
  sitemap con la URL final.
- «Rastreada, actualmente no indexada» → normal en artículos nuevos o con poco
  contenido; revisar caso por caso.
- «Página alternativa con etiqueta canónica correcta» → esperado en variantes
  de categorías o paginación.
- «Excluida por `noindex`» → la etiqueta debe ser intencional.

Programar revisiones a 7, 14 y 28 días para confirmar la consolidación.

---

## 7. Problemas y seguimiento

| Prioridad | Problema | Estado | Acción |
|---|---|---|---|
| Alta | Sitemaps de WordPress en rojo («No se ha podido obtener») | Corregido en código, pendiente de despliegue | Redirecciones 301 añadidas; borrar las entradas antiguas y enviar `sitemap-index.xml`. |
| Alta | Sitemap actual no enviado con estado «Correcto» | Pendiente de acción manual | Enviar `sitemap-index.xml` después del despliegue y esperar la lectura. |
| Alta | Canonical y sitemap apuntaban a URLs con 301 | Corregido en código, pendiente de despliegue | Alineados a la URL final con barra. |
| Media | Posible contenido fino en categorías del blog | En revisión | Revisar en «Páginas» si Google excluye categorías con pocos artículos. |
| Media | Enlaces internos sin barra final provocan 301 | Aceptable | No afecta a la indexación; se puede normalizar más adelante si se quiere evitar el salto. |
| Baja | Propiedad histórica de `www` | Informativo | Conservarla para no perder datos; las señales nuevas se revisan en el apex. |

---

## 8. Criterios de aceptación

- [x] Propiedad `proacademymx.com` verificada en Search Console (confirmado por
      el revisor).
- [x] `google34f3ca96c55007c0.html` accesible con HTTP 200 en el apex.
- [x] Informes de indexación y rendimiento disponibles.
- [ ] Desplegar la rama con las redirecciones y la alineación de canonical.
- [ ] `sitemap-index.xml` enviado y con estado «Correcto».
- [ ] Sitemap de producción con 122 URLs, sin `www`, sin rutas de admin/API y
      con las URLs finales (barra final).
- [ ] Canonical de producción en `https://proacademymx.com/.../`.
- [ ] Entradas antiguas de sitemap eliminadas o reprocesadas en verde.
- [ ] Línea base de informes registrada y problemas documentados.

La configuración no puede considerarse validada hasta completar el despliegue y
los pasos manuales de Search Console.
