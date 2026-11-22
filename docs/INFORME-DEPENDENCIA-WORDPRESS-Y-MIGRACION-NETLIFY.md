# Informe: dependencia actual de WordPress y migración completa a Netlify

- **Proyecto:** Professional Academy MX (`wizi-astro`)
- **Sitio público:** https://proacademymx.com
- **CMS de imágenes:** https://cms.proacademymx.com
- **Fecha:** 29 de octubre de 2026
- **Dirigido a:** Dirección / Jefatura
- **Objetivo:** Documentar qué parte del proyecto todavía depende de WordPress, qué implica retirarlo y cuáles serían las ventajas y desventajas de operar todo desde Netlify.

---

## 1. Resumen ejecutivo

El sitio público **ya funciona como sitio estático en Netlify** y el contenido editorial **ya no se administra desde WordPress**. Los artículos viven en una base de datos PostgreSQL (Neon) y se publican mediante un panel propio en `/admin`.

Sin embargo, **WordPress sigue siendo un proveedor crítico de imágenes**. El CMS `cms.proacademymx.com` aloja las fotografías de la mayoría de los artículos y de todos los testimonios.

### Situación actual en números

| Indicador | Situación |
|---|---:|
| Artículos publicados | 73 |
| Artículos cuya imagen destacada está en WordPress | **64 de 73** |
| Artículos con imágenes dentro del cuerpo alojadas en WordPress | **29** |
| URLs únicas de imágenes del blog en WordPress | **146** |
| Imágenes de testimonios en WordPress | **29** |
| Total estimado de archivos únicos a migrar | **175** |
| Artículos que ya usan imágenes locales | 9 |

### Conclusión principal

**Si WordPress se apagara hoy, el sitio seguiría cargando, pero se romperían las imágenes destacadas de 64 artículos, las imágenes internas de 29 artículos y las fotos de los 29 testimonios.** También se afectarían las vistas previas en redes sociales (`og:image`) y la experiencia visual general.

Por lo tanto:

- **No se debe cancelar ni borrar WordPress todavía.**
- La migración de imágenes es un requisito previo, no un paso opcional.
- Una vez migradas las imágenes, WordPress puede retirarse por completo.
- El resto del proyecto ya está preparado para operar sin WordPress.

---

## 2. Qué hace hoy WordPress y qué ya no hace

### WordPress ya NO se usa para:

- Publicar o editar artículos.
- Renderizar el sitio público.
- Guardar el contenido de los posts.
- Generar el blog, las categorías, el RSS o el sitemap.
- Administrar usuarios o permisos del panel.
- Subir imágenes nuevas desde el panel propio.

### WordPress SÍ se sigue usando para:

- Servir imágenes alojadas en `cms.proacademymx.com/wp-content/uploads/...`.
- Proveer las fotos de los testimonios.
- Proveer la imagen destacada de 64 artículos.
- Proveer imágenes dentro del cuerpo de 29 artículos.

### Aclaración importante

Que exista un archivo llamado `src/lib/wordpress.ts` **no significa que el sitio consulte WordPress en tiempo de ejecución**. Ese archivo contiene funciones heredadas de la etapa de importación; hoy en día solo se usa una pequeña parte para describir categorías. Es deuda técnica, no una dependencia activa.

La dependencia real es **exclusivamente de medios**: las URLs de las imágenes.

---

## 3. Arquitectura actual

```text
Editor /admin
     │
     ▼
Neon PostgreSQL ──► snapshot de contenido en build ──► Astro estático ──► Netlify CDN
     │                                                              ▲
     │                                                              │
     └── imágenes nuevas ──► Netlify Blobs (/uploads/...)           │
                                                                    │
WordPress cms.proacademymx.com ──► imágenes antiguas ───────────────┘
        (dependencia pendiente)
```

### Lo que ya está resuelto

- El sitio público es estático.
- El contenido se genera desde la base de datos al momento del build.
- Las imágenes nuevas subidas desde `/admin` ya se guardan en Netlify Blobs.
- Los redirects de URLs antiguas de WordPress ya están implementados.
- Los sitemaps antiguos de WordPress redirigen al sitemap actual.
- El panel propio permite crear y publicar artículos sin tocar WordPress.

### Lo que falta

- Migrar las imágenes históricas que todavía apuntan a `cms.proacademymx.com`.
- Reescribir esas URLs en la base de datos, en el snapshot de respaldo y en los testimonios.
- Validar que no quede ninguna referencia antes de retirar WordPress.

---

## 4. Riesgos de no migrar

Mientras WordPress siga siendo el proveedor de imágenes, existen riesgos operativos y de negocio:

| Riesgo | Impacto |
|---|---|
| Cancelación o impago del hosting de WordPress | Las imágenes dejan de cargar de inmediato. |
| Caída del servidor o del certificado SSL del CMS | Imágenes rotas o advertencias de contenido mixto. |
| Cambio de dominio o de configuración del CMS | URLs antiguas dejan de responder. |
| Bloqueo de hotlinking | El sitio de Netlify no puede mostrar las imágenes. |
| Pérdida de la base de datos o de `wp-content/uploads` | Pérdida definitiva de activos si no hay respaldo. |
| WordPress desactualizado | Vulnerabilidades, malware o defacement. |
| Dependencia de un proveedor que ya no se usa para editorial | Costo y mantenimiento sin beneficio directo. |

### Impacto concreto si WordPress se apaga sin migrar

- **64 artículos** perderían su imagen destacada.
- **29 artículos** perderían imágenes dentro del texto.
- **29 testimonios** perderían su fotografía.
- Las tarjetas del blog y las vistas previas en redes sociales se verían vacías o rotas.
- Google Search Console podría reportar errores de imágenes y afectar la confianza del sitio.

El riesgo no es inmediato si WordPress sigue activo y estable, pero **es un punto único de falla** que debe eliminarse antes de cancelar el servicio.

---

## 5. Plan de migración propuesto

### Fase 0 — Respaldo y auditoría

- Exportar la base de datos y la carpeta de uploads de WordPress.
- Guardar una copia offline del sitio y de los medios.
- Generar un inventario definitivo de URLs únicas.
- Confirmar cuáles imágenes se usan realmente y cuáles son huérfanas.
- Revisar fechas de contrato o cancelación de WordPress.

**Resultado:** inventario cerrado y respaldo verificado.

### Fase 1 — Descarga y optimización

- Descargar las 175 imágenes estimadas.
- Convertir a WebP o AVIF cuando sea conveniente.
- Redimensionar a un ancho máximo razonable.
- Eliminar metadatos innecesarios.
- Renombrar con nombres estables y descriptivos.
- Conservar textos alternativos (`alt`) y dimensiones.

**Resultado:** biblioteca de imágenes optimizada y lista para publicarse.

### Fase 2 — Almacenamiento definitivo

Hay dos opciones:

| Opción | Ventajas | Consideraciones |
|---|---|---|
| **Netlify Blobs** | Mismo mecanismo que ya usa el panel para imágenes nuevas. No requiere rebuild para subir una imagen. | Requiere respaldo y control de acceso. Depende de Netlify. |
| **Repositorio (`public/images/...`)** | Versionado con git. Imágenes inmutables y fáciles de auditar. | Aumenta el tamaño del repo. Requiere rebuild para cambiar una imagen. |

**Recomendación:** usar Netlify Blobs para las imágenes administrables y, si se busca máxima simplicidad de despliegue, mantener las imágenes históricas optimizadas en el repositorio. La decisión debe tomarse antes de reescribir las URLs.

### Fase 3 — Reescritura de referencias

Actualizar todas las referencias en:

- `posts.image` en la base de datos.
- `posts.html` y `posts.body` para las imágenes dentro del contenido.
- `posts.og_image` si aplica.
- `src/data/blog-fallback.json`.
- `src/data/testimonials.ts`.
- Cualquier otro dato estático que apunte al CMS.

**Resultado:** cero referencias a `cms.proacademymx.com`.

### Fase 4 — Validación

- Verificar que los 73 artículos carguen.
- Verificar que las 29 imágenes de testimonios carguen.
- Confirmar HTTP 200 en todas las imágenes.
- Revisar que `og:image` sea absoluta y accesible.
- Revisar que no haya contenido mixto HTTP/HTTPS.
- Revisar que las dimensiones y el `alt` sean correctos.
- Revisar que no existan 404 nuevos.
- Ejecutar `npm run check`, pruebas y `npm run build`.
- Validar el sitio en un deploy de vista previa antes de producción.

### Fase 5 — Retiro de WordPress

Solo después de que la validación sea satisfactoria:

- Eliminar `remotePatterns` de WordPress en `astro.config.mjs`.
- Retirar el subdominio `cms.proacademymx.com` del DNS.
- Cancelar el hosting de WordPress.
- Conservar un respaldo offline durante el periodo de gracia acordado.
- Mantener los redirects históricos, porque son parte del SEO y no dependen de WordPress.

### Fase 6 — Monitoreo posterior

- Revisar Google Search Console durante las primeras semanas.
- Revisar errores 404 de imágenes.
- Revisar Core Web Vitals.
- Confirmar que las vistas previas en redes sociales siguen funcionando.
- Revisar que el panel `/admin` siga subiendo imágenes correctamente.

---

## 6. Ventajas de tener todo en Netlify

| Ventaja | Explicación |
|---|---|
| **Menos proveedores** | Se elimina el hosting, dominio y mantenimiento de WordPress. |
| **Menos superficie de ataque** | WordPress deja de ser un objetivo de plugins, temas, XML-RPC y vulnerabilidades conocidas. |
| **Mejor rendimiento** | Las imágenes se sirven desde la misma infraestructura CDN del sitio, sin depender de un servidor externo. |
| **Mayor disponibilidad** | Si Netlify sirve el sitio, también sirve sus imágenes. No hay una caída separada del CMS. |
| **SEO más estable** | URLs de imágenes propias, sin hotlinking, sin SSL externo y con mejor control de caché. |
| **Mejor experiencia visual** | Imágenes optimizadas, responsive y con dimensiones correctas. |
| **Operación más simple** | Un solo flujo de deploy, un solo modelo de permisos y un solo lugar para monitorear. |
| **Respaldo más claro** | Base de datos, repositorio y almacenamiento de imágenes bajo un esquema definido. |
| **Costos más predecibles** | Se elimina el costo fijo de WordPress; el costo pasa a consumo de Netlify/Blobs. |
| **Escalabilidad** | La CDN absorbe tráfico sin depender de la capacidad del CMS. |
| **Imágenes nuevas sin WordPress** | El panel `/admin` ya sube a Netlify Blobs. |
| **Proyecto más fácil de mantener** | Menos código heredado, menos dependencias y menos documentación obsoleta. |

---

## 7. Desventajas y riesgos de la migración

| Desventaja / riesgo | Impacto | Mitigación |
|---|---|---|
| **Costo único de migración** | Trabajo técnico de inventario, descarga, optimización, reescritura y validación. | Planificarlo como proyecto cerrado con fases y criterios de aceptación. |
| **Riesgo de romper imágenes** | Un URL mal reescrito deja una imagen rota. | Validación automatizada de las 175 referencias antes del deploy. |
| **Pérdida de la biblioteca de WordPress** | Se pierde la interfaz de medios y el historial de WordPress. | Exportar y conservar un respaldo offline antes de cancelar. |
| **Consumo de bandwidth en Netlify** | Las imágenes que antes servía WordPress ahora consumen ancho de banda de Netlify. | Optimizar tamaño, usar caché y revisar los límites del plan. |
| **Dependencia de Netlify** | Build, funciones, Blobs e imágenes quedan en un solo proveedor. | El sitio es estático y portable; mantener exportaciones periódicas de DB y medios. |
| **Dependencia de Neon en build** | Si la base falla durante el build, se usa el snapshot de respaldo. | Mantener `blog-fallback.json` actualizado y monitorear el build. |
| **Nuevo proceso de gestión de imágenes** | Ya no hay plugins de WordPress para optimizar o redimensionar. | Definir nombres, tamaños, formatos y `alt` antes de migrar. |
| **Contenido histórico con enlaces externos** | Algunos artículos podrían tener imágenes o enlaces hotlinkeados. | Auditoría de todos los `src` y `href`, no solo de los de WordPress. |
| **Ventana de transición** | Durante la migración conviven URLs viejas y nuevas. | Mantener WordPress en solo lectura hasta validar el 100%. |
| **Curva de aprendizaje operativa** | El equipo debe usar `/admin` y Netlify, no WordPress. | Documentar el flujo y capacitar a quien publique contenido. |

---

## 8. Comparación de escenarios

| Escenario | Ventajas | Riesgos |
|---|---|---|
| **Dejar todo como está** | Cero trabajo inmediato. | WordPress sigue siendo un punto único de falla; costo y mantenimiento continúan. |
| **Apagar WordPress ahora** | Se elimina el costo de inmediato. | Se rompen 64 imágenes destacadas, 29 cuerpos de artículo y 29 testimonios. No recomendado. |
| **Migrar primero y luego apagar WordPress** | Elimina la dependencia con riesgo controlado. | Requiere una inversión inicial de tiempo y validación. **Es la opción recomendada.** |

---

## 9. Estimación preliminar de esfuerzo

| Actividad | Orden de magnitud |
|---|---|
| Auditoría, respaldo e inventario | 0.5 a 1 día |
| Descarga y optimización de imágenes | 1 a 2 días |
| Reescritura de URLs y ajustes de datos | 1 a 2 días |
| Validación, deploy de prueba y monitoreo inicial | 0.5 a 1 día |
| **Total preliminar** | **3 a 6 días de trabajo técnico** |

La estimación es preliminar y debe ajustarse después de la auditoría definitiva, especialmente si aparecen imágenes huérfanas, enlaces externos o contenido que requiera corrección editorial.

---

## 10. Decisión que se solicita

Se solicita a Dirección:

1. **Aprobar la migración de imágenes como proyecto previo** a la cancelación de WordPress.
2. **Confirmar la fecha límite** del contrato o servicio de WordPress.
3. **Definir el almacenamiento destino** de las imágenes: Netlify Blobs, repositorio o una combinación.
4. **Autorizar una ventana de migración y validación** antes de retirar el CMS.
5. **Confirmar que se conservará un respaldo offline** de WordPress durante el periodo de gracia acordado.

---

## 11. Criterios de aceptación

La migración se considerará terminada cuando:

- [ ] No exista ninguna referencia a `cms.proacademymx.com` en el sitio, la base de datos o los datos estáticos.
- [ ] Las 73 imágenes destacadas carguen correctamente.
- [ ] Las 29 imágenes de testimonios carguen correctamente.
- [ ] Las imágenes internas de los artículos carguen correctamente.
- [ ] Todas las imágenes devuelvan HTTP 200.
- [ ] `og:image` funcione en artículos y redes sociales.
- [ ] No haya contenido mixto HTTP/HTTPS.
- [ ] `npm run check`, las pruebas y `npm run build` pasen sin errores.
- [ ] El deploy de vista previa haya sido validado antes de producción.
- [ ] Google Search Console no reporte errores nuevos después del cambio.
- [ ] Exista un respaldo offline verificado de WordPress.

---

## 12. Conclusión

El proyecto **ya no depende de WordPress para publicar contenido**, pero **sí depende de WordPress para servir imágenes**. Esa dependencia es la única razón por la que WordPress sigue siendo necesario.

La migración es viable, acotada y recomendable. Antes de cancelar WordPress hay que migrar y validar las imágenes; después, el proyecto puede operar completamente en Netlify con una arquitectura más simple, segura y barata de mantener.

**Recomendación:** planificar la migración de imágenes a corto plazo, mantener WordPress en modo de solo lectura durante el proceso y retirarlo únicamente cuando se cumplan todos los criterios de aceptación.

---

## Anexo: estado del proyecto al 29 de octubre de 2026

- El sitio público está desplegado en Netlify.
- El blog se genera de forma estática desde un snapshot de Neon.
- El panel `/admin` administra contenido y ya sube imágenes nuevas a Netlify Blobs.
- Los redirects de URLs históricas de WordPress están implementados.
- Los sitemaps antiguos redirigen al sitemap actual.
- **No se ha eliminado ningún archivo durante esta auditoría.** Este documento es informativo y de planeación.
