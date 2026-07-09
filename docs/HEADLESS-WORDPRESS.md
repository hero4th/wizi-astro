# Blog headless: WordPress (WPGraphQL) + Astro

El blog de Astro consume **todas** las entradas publicadas desde WordPress
(`proacademymx.com`) mediante **WPGraphQL**, en tiempo de *build*. WordPress es
el panel donde escribes; Astro es el sitio público, rápido y estático, desplegado
en Vercel.

```
┌────────────────────┐      WPGraphQL (build)      ┌────────────────────┐
│  WordPress (Neubox) │ ──────────────────────────▶ │   Astro (Vercel)   │
│  proacademymx.com   │   POST /graphql (60 posts)  │  sitio público     │
│  panel + imágenes   │ ◀──── Deploy Hook (webhook) │  HTML estático     │
└────────────────────┘        al publicar          └────────────────────┘
```

## Cómo funciona (arquitectura)

- **Origen de datos:** `src/lib/wordpress.ts` pagina el endpoint GraphQL y
  normaliza cada entrada (título, descripción limpia, HTML del cuerpo, imagen
  destacada, categorías, autor, fecha, tiempo de lectura).
- **Loader de contenido:** `src/content.config.ts` define un *Content Layer
  loader* (`wordpress-blog`) que llena la colección `blog`. Las páginas del blog
  siguen usando el API normal `getCollection("blog")`, así que **el diseño de
  Astro no cambió**.
- **Limpieza:** el tema de WordPress inyecta un bloque `pas-post-title-wrap`
  (navegación + `<h1>` + meta autor/fecha) dentro del contenido. Se elimina para
  que no se duplique con el encabezado propio de Astro. También se generan `id`
  en los encabezados (`h2`/`h3`) para que funcione el índice (TOC).
- **Categorías:** se derivan dinámicamente de WordPress (no hay lista fija).
  Cada categoría con ≥1 entrada obtiene su página en `/blog/categoria/<slug>`.

## Plugins de WordPress

| Plugin | ¿Necesario? | Para qué |
| --- | --- | --- |
| **WPGraphQL** | ✅ Obligatorio | Expone `/graphql`. Es la fuente de datos. |
| **Frontend View For Headless CMS** | ➖ Opcional | Hace que el botón «Ver» del panel abra el sitio de Astro. Configúralo con tu dominio público. No participa en la extracción de datos. |
| WPGraphQL for ACF | ➖ Solo si usas ACF | Expone campos personalizados de Advanced Custom Fields en GraphQL. |

> No necesitas ningún plugin adicional para que el blog funcione. Solo WPGraphQL.

## Variable de entorno

```bash
WP_GRAPHQL_ENDPOINT=https://proacademymx.com/graphql
```

- Local: está en `.env` (ignorado por git).
- Vercel: **Project → Settings → Environment Variables** → añade
  `WP_GRAPHQL_ENDPOINT` con el mismo valor para *Production*, *Preview* y
  *Development*.
- Si mueves WordPress a un subdominio (p. ej. `cms.proacademymx.com`), actualiza
  este valor y vuelve a desplegar.

## Reconstrucción automática al publicar (Deploy Hook)

Como el sitio es estático, hay que reconstruir cuando cambia el contenido.

### 1. Crea un Deploy Hook en Vercel
`Project → Settings → Git → Deploy Hooks` → nombre `wordpress`, rama `master`.
Copia la URL (algo como `https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy`).

### 2. Dispara el hook desde WordPress
Pega este snippet con **WPCode** (Code Snippets → PHP) o guárdalo como
`wp-content/mu-plugins/rebuild-astro.php`. Reemplaza la URL por tu Deploy Hook:

```php
<?php
/**
 * Dispara un rebuild en Vercel cuando se publica/edita/elimina una entrada.
 */
add_action('transition_post_status', function ($new_status, $old_status, $post) {
    if ($post->post_type !== 'post') return;
    // Solo cuando entra o sale de "publicado".
    if ($new_status !== 'publish' && $old_status !== 'publish') return;

    wp_remote_post('https://api.vercel.com/v1/integrations/deploy/prj_xxx/yyy', array(
        'blocking' => false,
        'timeout'  => 5,
    ));
}, 10, 3);
```

Con esto: publicas o editas una entrada en WordPress → Vercel reconstruye en
1–2 min → el blog se actualiza solo. (Mientras tanto, puedes forzar un rebuild
manual con *Redeploy* en Vercel.)

## Comandos

```bash
npm run dev      # desarrollo local (obtiene los posts de WordPress)
npm run build    # build de producción (lo que corre Vercel)
npm run preview  # previsualiza el build
```

## Migración de dominio (Astro en el dominio principal)

Objetivo final: **`proacademymx.com` + `www` = Astro (Vercel)** y
**`cms.proacademymx.com` = WordPress (Neubox)**. Haz los pasos en este orden
para no romper imágenes ni SEO.

### Paso 0 — Probar antes de tocar DNS
Despliega en Vercel y revisa todo en la URL `*.vercel.app`. El blog ya funciona
apuntando a `proacademymx.com/graphql`. Cuando se vea perfecto, continúa.

### Paso 1 — Crear el subdominio del backend (Neubox/cPanel)
1. cPanel → **Dominios / Subdominios** → crea `cms.proacademymx.com`.
2. Ponle como *Document Root* la **misma carpeta** de tu WordPress actual
   (normalmente `public_html`). Así `cms.proacademymx.com` sirve el mismo WP.
3. Verifica que abran: `https://cms.proacademymx.com/wp-admin` y
   `https://cms.proacademymx.com/graphql`.

### Paso 2 — Hacer que WordPress viva en el subdominio
1. WordPress → **Ajustes → Generales**: cambia *WordPress Address* y
   *Site Address* a `https://cms.proacademymx.com`.
2. Instala **Better Search Replace** y reemplaza en la base de datos
   `https://proacademymx.com` → `https://cms.proacademymx.com`
   (marca todas las tablas; NO uses "dry run" en la corrida final). Esto arregla
   las URLs de imágenes dentro del contenido y las imágenes destacadas.
3. Comprueba que las imágenes ahora cargan desde `cms.proacademymx.com/wp-content/…`.

### Paso 3 — Apuntar Vercel al endpoint nuevo
- Vercel → Environment Variables → `WP_GRAPHQL_ENDPOINT = https://cms.proacademymx.com/graphql`.
- Redeploy. El build ahora trae imágenes con dominio `cms.` (evita mezclar HTTP).
- Añade `cms.proacademymx.com` en `astro.config.mjs → image.remotePatterns`
  (ya está incluido).

### Paso 4 — Apuntar el dominio público a Vercel (DNS en Neubox)
1. Vercel → Project → **Domains** → agrega `proacademymx.com` y `www.proacademymx.com`.
   Vercel te dará los valores DNS exactos.
2. Neubox → **Zone Editor** del dominio:
   - Registro **A** de `@` (raíz) → la IP que indique Vercel (típicamente `76.76.21.21`).
   - Registro **CNAME** de `www` → `cname.vercel-dns.com` (o lo que indique Vercel).
   - **Deja intacto** el registro **A** de `cms` apuntando a la IP de Neubox
     (`198.59.144.25`), para que WordPress siga vivo.
3. Espera la propagación (minutos a un par de horas). Al terminar:
   `proacademymx.com` = Astro, `cms.proacademymx.com` = WordPress.

### Paso 5 — SEO
- Los **301** de las URLs viejas (`/slug` y `/slug/`) hacia `/blog/slug` ya están
  configurados (60 posts). Si publicas más y quieres cubrir sus URLs de raíz,
  corre `node scripts/gen-legacy-redirects.mjs` y vuelve a desplegar.
- En Google Search Console, agrega la propiedad del dominio y reenvía el
  `sitemap-index.xml`.
- Opcional: en WordPress deja `cms.proacademymx.com` con `noindex` (plugin SEO)
  para que el backend no compita en buscadores.

## Notas

- Las imágenes se sirven desde WordPress (`proacademymx.com/wp-content/...`).
  Los dominios permitidos están en `astro.config.mjs → image.remotePatterns`.
- Los antiguos `.mdx` en `src/content/blog/` ya **no se usan** (el loader ahora
  lee de WordPress). Puedes borrar esa carpeta cuando quieras.
- Si WordPress no responde durante un rebuild, el loader conserva la última copia
  cacheada en lugar de dejar el blog vacío.
```
