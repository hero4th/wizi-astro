# Propuesta ajustada: Blog estático sin builds automáticos

## Problema
Cada deploy en Netlify consume 15 créditos. Si se dispara un build por cada guardado/edición desde el admin, el consumo será muy alto.

## Solución propuesta
Separar **gestión** de **publicación**:

- **Gestión (admin)**: Usa la base de datos de Netlify únicamente para crear, editar o eliminar posts. Sin disparar builds.
- **Publicación (deploy)**: Se genera el snapshot del blog durante el build de Netlify (`prebuild`). Solo cuando se ejecute un deploy manual o programado es cuando se actualiza el blog público.

## Flujo

1. Desde `/admin` se guardan los cambios directamente en la base de datos de Netlify.
2. Los cambios quedan registrados pero **NO** se publican al sitio público.
3. Cada 2-3 días (o cuando se acumulen cambios), se hace un **Deploy manual** desde Netlify: `Deploys > Trigger deploy > Deploy site`.
4. En ese deploy, el script `scripts/generate-blog-snapshot.mjs` consulta la BD **una sola vez**, genera `src/data/blog-generated.json` con todos los posts publicados y Astro genera todas las páginas estáticas.
5. El sitio público queda 100% estático desde CDN, sin consultar la BD.

## Cambios implementados

- `scripts/generate-blog-snapshot.mjs` - Se ejecuta en `prebuild`, consulta la BD y genera el snapshot
- `package.json` - Agregado script `prebuild`
- `src/lib/blog.ts` - Lee desde `blog-generated.json` primero (sin consultas a BD en runtime)
- `src/pages/api/admin/posts.ts` y `[id].ts` - Ya no disparan builds automáticos
- `src/pages/api/admin/blog/snapshot.ts` - Solo genera snapshot localmente, sin disparar build

## Ventajas

- **Ahorro de créditos**: 1 deploy = 15 créditos cada 2-3 días, en lugar de 15 créditos por cada edición
- **Menor consumo de BD**: Solo se consulta 1 vez por deploy
- **Control total**: Tú decides cuándo publicar los cambios acumulados
- **Mismo panel admin**: Sin cambios en la experiencia de gestión
- **Sitio público estático**: Sin consultas a BD para visitantes

## Notas

- Los cambios guardados desde el admin NO aparecen en el sitio público hasta hacer un deploy manual
- Si necesitas publicar un cambio urgente, basta con hacer un deploy manual desde Netlify (toma ~2-3 minutos)
