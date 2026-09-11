# Recuperación del blog histórico

## Estado de recuperación — 2026-09-11

**Importación realizada: 9 artículos previos + 64 históricos = 73 publicados.** Cero conflictos en el DRY RUN inicial. Las nueve filas originales mantienen exactamente sus hashes completos. El Postgres fue identificado mediante el `.env` proporcionado por el propietario y la coincidencia de los nueve slugs/títulos con el RSS público.

- Fuente principal: 64 publicados del CMS REST `https://cms.proacademymx.com/wp-json/wp/v2/posts`, respaldados el 2026-09-10 con HTML íntegro, autores, categorías, tags, imágenes, fechas y head de las 64 páginas.
- Complementos MySQL de solo lectura: `proacade_wp_asr7k` (49 registros post) y `proacade_wp2017` (62). Versiones/borradores no se suman a los 64 publicables. AWAUS no fue modificado.
- Snapshot: `snapshots/proacademy-wordpress-2026-09-10.json`; SHA-256 del objeto JSON serializado: `9bcaef6882265a73eb1aa2276aed6f0dfdc33d12f5c59e4cb94e59c0d5a6522f`.
- Copia preparada: mismo nombre con sufijo `.prepared.json`. Recibo de APPLY: `snapshots/applied-1789151934265.json`. Backup previo: `snapshots/postgres-before-2026-09-11.json`.
- ID 3744, `aprobar-paa-y-sat-2026`: original íntegro en snapshot; copia preparada con `draft: true`, `REQUIERE_APROBACION_EDITORIAL`. No fue insertado en Postgres ni publicado.
- 64/64 verificados en producción: HTTP 200, URL exacta, texto/estructura/headings conservados, canonical público, sin noindex. RSS: 73 artículos. Evidencia: `snapshots/public-articles-0911.json`.
- Se preservaron 32 artículos con tablas y 35 con varias imágenes. Los 14 sin headings y el original sin enlaces se mantuvieron fieles al origen. Se adaptaron 22 enlaces entre artículos. Otros 24 enlaces a páginas conocidas del CMS se resuelven al dominio público al renderizar, sin cambiar filas originales; un enlace antiguo específico de Pro Class sin equivalencia comprobada se conserva.
- Imágenes: 166 URLs detectadas, 165 disponibles y una externa no consultada; cero fallos entre las consultadas. Conservan sus hosts originales, no se descargaron ni subieron a otro almacenamiento.
- Código de SEO/compatibilidad: mapa de 178 rutas (356 variantes con/sin barra final), TOC compatible con atributos existentes, sitemap de posts/categorías excluyendo admin/noindex, robots con exclusión administrativa, JSON-LD con autor/imagen y ausencias reales con HTTP 404.
- Antes del push, las 60 rutas históricas previas ya funcionan en producción (120 variantes). Los 118 aliases adicionales y el sitemap corregido requieren el despliegue del código. El propietario confirmó que el flujo es commit/push.
- Build verificado con Postgres. Se comprobó el SQL real en tabla temporal eliminada al finalizar: inserción conserva HTML y una repetición inserta cero filas. Se validaron las 356 reglas compiladas y los 64 artículos en el sitemap generado, sin páginas administrativas.

Los snapshots están ignorados por Git y se crean con permisos locales restrictivos: incluyen contenido editorial no publicado. Conservarlos en almacenamiento privado con respaldo. No contienen variables de conexión. No publicar el snapshot ni la entrada 3744 como asset del sitio.

## Uso

Requiere Node >= 22.18 (soporte nativo para los helpers TypeScript existentes), `npm ci` y acceso a las fuentes. Las dependencias nuevas son exclusivamente herramientas de migración: `cheerio`, `sanitize-html` y `mysql2`; no se añaden al runtime de las páginas.

### 1. Snapshot inmutable

```sh
# HISTORICAL_ENV_FILE es la ruta a un archivo privado existente; no copiar sus valores.
HISTORICAL_ENV_FILE=/ruta/privada/al/env node scripts/blog-recovery/snapshot.mjs snapshots/proacademy-wordpress-YYYY-MM-DD.json
```

La captura pagina la API completa y comprueba total/slugs. Consulta solo campos históricos explícitamente seleccionados, dentro de transacciones MySQL de lectura. No sobrescribe un snapshot existente. La opción histórica es opcional para capturas públicas, pero esta recuperación exige respaldar también el 3744 antes de APPLY.

### 2. Preparación sin Postgres

```sh
node scripts/blog-recovery/import.mjs --prepare --snapshot snapshots/proacademy-wordpress-YYYY-MM-DD.json --report snapshots/preparation-report.json
```

`--check-images` verifica imágenes alojadas en uploads de los dominios conocidos. `--download-images` descarga las recuperables a `public/blog/wordpress-images/`, asigna nombres por hash y sustituye sus referencias. Las imágenes fallidas mantienen el enlace original y quedan registradas; no invalidan el artículo. Imágenes externas se conservan sin consultarlas automáticamente. La descarga local debe incluirse en el mismo despliegue que publica las referencias nuevas. Esta ejecución solo verificó disponibilidad; no descargó ni subió imágenes.

### 3. Identificar el destino y hacer DRY RUN

Obtener `DATABASE_URL` del proyecto de Vercel/Neon **verificado** de Professional Academy, mediante un archivo privado o entorno del proceso; nunca pegarla en documentación o argumentos de shell. No usar la conexión del otro proyecto disponible.

Crear `snapshots/target.json` con información no secreta verificada en el proveedor:

```json
{
  "publicOrigin": "https://www.proacademymx.com",
  "neonProjectId": "ID_REAL_VERIFICADO",
  "hostname": "HOST_REAL_VERIFICADO",
  "database": "BASE_REAL_VERIFICADA",
  "existingSlugs": ["digital-sat-guia-completa", "gre-vs-gmat-cual-presentar", "mejor-curso-toefl-ibt-2026", "paa-tec-de-monterrey-puntaje", "proceso-admision-universidades-eua", "recursos-gratuitos-ingles-academico", "simuladores-toefl-ibt-gratis", "tecnica-estudio-examenes-admision", "universidades-mas-demandadas-mexico"]
}
```

El archivo no sustituye comprobar la asociación real dominio → proyecto → base en el proveedor. El script contrasta hostname, nombre de base y slugs esperados; lee **todos** los posts, también borradores, en una transacción de solo lectura. Guarda el inventario y un respaldo completo de filas antes de cualquier inserción.

```sh
node --env-file=/ruta/privada/al/env-astro scripts/blog-recovery/import.mjs --snapshot snapshots/proacademy-wordpress-YYYY-MM-DD.json --target snapshots/target.json --report snapshots/dry-run.json
```

El modo predeterminado es DRY RUN. Slugs existentes son conflictos y se excluyen siempre del conjunto de inserción. Un título parecido con slug diferente no es conflicto. Un borrador que ocupe un destino histórico es bloqueo crítico: no se publica ni sobrescribe automáticamente. Si falta acceso, el reporte indica `TARGET_POSTGRES_ACCESS_NOT_VERIFIED` y termina con código 1 sin abrir conexión ni escribir en Postgres.

### 4. APPLY, solo con DRY RUN válido

```sh
node --env-file=/ruta/privada/al/env-astro scripts/blog-recovery/import.mjs --apply --snapshot snapshots/proacademy-wordpress-YYYY-MM-DD.json --target snapshots/target.json --plan snapshots/dry-run.json
```

Usar las mismas opciones de imágenes en DRY RUN y APPLY. Se vuelven a comprobar los hashes de fuente, preparación, identidad y filas previas. Cualquier cambio exige otro DRY RUN. La transacción serializable utiliza exclusivamente `INSERT ... ON CONFLICT (slug) DO NOTHING`; nunca `UPDATE`, `DELETE` ni upsert que sobrescriba. Se guardan IDs insertados en un recibo, luego se relee Postgres y se comprueban contenido, destinos publicados y hashes de todas las filas previas. Una ejecución repetida requiere nuevo DRY RUN y omite los slugs insertados previamente.

APPLY fue ejecutado y verificado en el destino. La prueba de integración utiliza una tabla temporal con las restricciones del esquema real, dentro de una transacción; no crea artículos de prueba persistentes. El archivo de identidad acepta `neonProjectId` o `vercelProjectId`, además de hostname/base/slugs verificados.

## Contenido, metadata y URLs

La precedencia es CMS actual → metadata histórica literal cuando falta en el head → extracto/título existente para los campos obligatorios de presentación. Nunca se reescribe texto con IA ni se convierte HTML a Markdown. Se conservan fechas publicadas/modificadas del CMS; fechas históricas distintas quedan en snapshot para revisión, no se imponen silenciosamente. Plantillas AIOSEO sin resolver no se publican como metadata literal.

`body` y `html` reciben el mismo HTML, acorde con el editor actual. Se conservan IDs de anchors existentes y se añaden IDs únicamente a headings que no los tenían. Las reglas de limpieza utilizan el parser HTML y una lista permitida de elementos/atributos; mantienen H1–H6, listas, tablas, captions, énfasis, quotes y embeds compatibles con la CSP. La comprobación compara texto, headings y recuentos antes/después. Scripts, estilos del CMS y navegación conocida se retiran. Algunas imágenes pueden conservar dependencia del CMS hasta descargarlas.

Los IDs WordPress, tags, timestamp completo, versiones históricas y metadata sin campo de destino permanecen en snapshot. El esquema Postgres actual no tiene campos para todo ello y usa DATE para publicación/actualización. No se alteró el esquema. Autor, categorías y SEO compatibles sí están preparados en las filas.

La URL final es `/blog/<slug-exacto>`; se conserva, por ejemplo, `que_es_el_gmat`, incluyendo guiones bajos. Los 60 redirects existentes tienen correspondencia con las fuentes. El plan añade los cuatro slugs nuevos del CMS, aliases `_wp_old_slug` y rutas basadas en categorías/permalinks históricos. Estas últimas son aliases de compatibilidad respaldados por taxonomía/configuración, no una afirmación de que todas estuvieron indexadas. El mapa de 178 rutas está en `src/data/recovered-blog-redirects.mjs`, integrado en `astro.config.mjs`. El build adapta todas las reglas a barra final opcional.

## Publicación y validación posterior

El propietario confirmó el flujo `commit → push → deployment`. El remoto de trabajo es `arkms/wizi-astro`, rama `master`; no sustituirlo por la referencia antigua del README. No subir `.env` ni snapshots a Git.

```sh
node --env-file=.env node_modules/astro/astro.js build
node scripts/patch-redirects.mjs
node scripts/blog-recovery/verify.mjs --report snapshots/public-verification.json
```

El verificador compara los 64 cuerpos completos, headings, canonicals e indexabilidad; prueba 356 variantes de URLs, RSS/listado/sitemap, categorías y ausencia con 404. Puede apuntar a `--base http://127.0.0.1:4321`; `--articles-only` omite las comprobaciones de sitemap/deployment para usarlo en desarrollo.

Después de cada despliegue comprobar que `/acerca_del_gmat/` da 301 a `/blog/que_es_el_gmat`, que el sitemap incorpora los 73 publicados y que no enumera admin. Consultar logs del despliegue cuando la integración los exponga. Un push exitoso por sí solo no demuestra despliegue exitoso.

## Pruebas y recuperación

```sh
RECOVERY_TEST_SNAPSHOT=snapshots/proacademy-wordpress-2026-09-10.json node --test scripts/blog-recovery/recovery.test.mjs
```

Cinco pruebas pasan: resolución pública de enlaces/anchors, conservación y seguridad del HTML, embeds, protección de conflictos y validación de los 64 originales/aliases/exclusión editorial. El análisis de Astro encontró 26 errores en archivos sin cambios (WhyChooseUs, datos de programas y precios); no se corrigieron ampliando el alcance.

No hay rollback destructivo automático. Si fuera necesario revertir una importación futura, usar el recibo de IDs insertados, releer sus hashes y revisar cualquier edición posterior antes de autorizar una retirada editorial. Nunca borrar por un patrón amplio de slugs ni restaurar todas las filas por encima de cambios recientes. El respaldo previo permite verificar que los posts originales no se tocaron.

Pendiente de seguridad separado: `awaus/scripts/apps-script-trigger.js` contiene un `DEFAULT_SECRET` versionado detectado en la auditoría. No se copia su valor, no se modifica AWAUS y no se rota dentro de esta tarea. No hay herramienta de grafo configurada en este repositorio que actualizar.

Referencia de la herramienta de limpieza: [sanitize-html](https://github.com/apostrophecms/sanitize-html). Se usa solo en scripts locales de recuperación.
