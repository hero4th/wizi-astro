# Configuración de Google Search Console — Professional Academy (ProAcademy)

- **Sitio:** https://www.proacademymx.com
- **Proyecto:** `proacademy` (repo `wizi-astro`)
- **Fecha de preparación:** 2026-10-23
- **Alcance:** registrar y verificar la propiedad, enviar el sitemap y dejar
  documentada la revisión inicial de indexación. No incluye corregir todos los
  problemas SEO detectados.

---

## 1. Resumen

La preparación técnica del lado del sitio quedó lista: el archivo de
verificación de Google está en `public/`, `robots.txt` declara el sitemap y el
build genera un sitemap válido. La verificación de propiedad, el envío del
sitemap y la revisión de informes **aún requieren acceso a Google Search
Console y un despliegue de la rama actual a producción**.

Propiedad recomendada:

| Campo | Valor |
|---|---|
| Tipo | Prefijo de URL |
| URL | `https://www.proacademymx.com/` |
| Método de verificación | Archivo HTML |
| Archivo | `/google34f3ca96c55007c0.html` |
| Sitemap | `https://www.proacademymx.com/sitemap-index.xml` |

Se recomienda usar la propiedad de prefijo de URL porque la verificación
disponible es por archivo HTML. Si se tiene acceso al DNS, puede agregarse
además una propiedad de dominio (`proacademymx.com`) mediante registro TXT;
esta cubre automáticamente el dominio raíz y `www`.

---

## 2. Estado actual

| Elemento | Estado | Detalle |
|---|---|---|
| Archivo de verificación | Preparado, no desplegado | `public/google34f3ca96c55007c0.html` contiene `google-site-verification: google34f3ca96c55007c0.html`. En producción devuelve 404. |
| `robots.txt` | Correcto en el repositorio, desactualizado en producción | El repo permite el rastreo y bloquea `/gracias`, `/admin` y `/api`; producción aún solo bloquea `/gracias`. |
| Sitemap local | Correcto | El build genera `sitemap-index.xml` y `sitemap-0.xml` con 122 URLs: páginas estáticas, 73 artículos y 25 categorías. Sin URLs de admin, API ni gracias. |
| Sitemap en producción | Desactualizado | Devuelve 37 URLs, incluye 4 rutas de `/admin/` y solo 9 artículos del blog. No debe enviarse a Search Console en este estado. |
| Blog en producción | Con error | `/blog` y las URLs de artículos responden HTTP 500. |
| Propiedad en Search Console | Pendiente | Requiere acceso a la cuenta de Google. |
| Informes de indexación y rendimiento | Pendientes | Solo disponibles después de verificar la propiedad y procesar el sitemap. |

> Prerrequisito: desplegar la versión actual del sitio y confirmar que el blog
> responde 200 antes de enviar el sitemap a Google Search Console.

---

## 3. Acciones realizadas en el repositorio

1. Se incorporó el archivo de verificación entregado por Google en
   `public/google34f3ca96c55007c0.html`. Al ser un archivo de `public/`, Astro
   lo copia a la raíz de `dist/` y quedará disponible en
   `https://www.proacademymx.com/google34f3ca96c55007c0.html` tras el
   despliegue.
2. Se confirmó que `public/robots.txt` declara
   `Sitemap: https://www.proacademymx.com/sitemap-index.xml`.
3. Se confirmó que la integración `@astrojs/sitemap` filtra `/admin`, `/api`,
   `/gracias`, `/404` y las URLs heredadas redirigidas.
4. Se generó el build y se validó localmente la presencia del archivo de
   verificación y del sitemap.

Comandos de validación después del despliegue:

```bash
curl -i https://www.proacademymx.com/google34f3ca96c55007c0.html
curl -sS https://www.proacademymx.com/robots.txt
curl -sS https://www.proacademymx.com/sitemap-index.xml
curl -sS https://www.proacademymx.com/sitemap-0.xml
```

Resultado esperado: el archivo de verificación responde 200 con el texto
`google-site-verification: google34f3ca96c55007c0.html`; `robots.txt` muestra el
sitemap; el índice apunta a `sitemap-0.xml`; el sitemap contiene las URLs
públicas actuales y ninguna ruta de administración.

---

## 4. Pasos para completar la configuración en Search Console

1. Entrar a <https://search.google.com/search-console> con la cuenta de Google
   propietaria del sitio.
2. Revisar si ya existe una propiedad para `proacademymx.com` o
   `https://www.proacademymx.com/`. Si existe, solicitar acceso o usarla en
   lugar de crear una duplicada.
3. Crear la propiedad de tipo **Prefijo de URL** con
   `https://www.proacademymx.com/`.
4. Elegir la verificación por **archivo HTML** y confirmar que
   `https://www.proacademymx.com/google34f3ca96c55007c0.html` responde 200
   antes de pulsar **Verificar**. Conservar el archivo en `public/` de forma
   permanente.
5. En **Sitemaps**, enviar `sitemap-index.xml` y revisar que el estado pase de
   «No se pudo obtener» a «Correcto».
6. En **Indexación → Páginas**, registrar el número inicial de páginas
   indexadas y no indexadas, y anotar los motivos principales.
7. En **Experiencia**, revisar Core Web Vitals y usabilidad móvil.
8. En **Rendimiento**, registrar una línea base de impresiones, clics, CTR y
   posición media. Los datos históricos pueden tardar días en aparecer.
9. Programar una revisión posterior del sitemap y de los informes, y dar
   seguimiento a los problemas de la sección 5.

---

## 5. Problemas iniciales identificados y acciones pendientes

| Prioridad | Problema | Evidencia | Acción | Estado |
|---|---|---|---|---|
| Alta | La versión en producción está desactualizada y el blog responde 500 | `https://www.proacademymx.com/blog` y las URLs de artículos devuelven HTTP 500 | Desplegar la rama actual y verificar `DATABASE_URL` y el resto de variables del entorno de producción | Pendiente |
| Alta | El sitemap de producción lista rutas privadas e incompletas | 37 URLs, incluye `/admin/`, `/admin/login/`, `/admin/posts/new/`, `/admin/seguridad/`; faltan 64 artículos respecto del build local | No enviar el sitemap hasta desplegar el build actual | Pendiente |
| Alta | El archivo de verificación devuelve 404 en producción | `curl -I https://www.proacademymx.com/google34f3ca96c55007c0.html` devuelve 404 | Desplegar el archivo agregado en `public/` y confirmar HTTP 200 | Preparado en el repo |
| Media | `robots.txt` de producción no bloquea el panel ni la API | Producción solo contiene `Disallow: /gracias` | Desplegar el `robots.txt` actualizado del repositorio | Preparado en el repo |
| Media | Search Console aún no tiene la propiedad verificada | No hay acceso a la cuenta de Google desde este entorno | Ejecutar los pasos de la sección 4 con acceso a Search Console | Pendiente |
| Baja | Posible contenido fino en categorías del blog | El sitemap incluye 25 categorías, algunas con pocos artículos | Revisar en el informe de indexación si Google las excluye o las trata como duplicadas | Pendiente |

Los errores del blog y del sitemap de producción son la causa principal que
impide una revisión válida de indexación. Deben resolverse mediante el
despliegue antes de interpretar los datos de Search Console.

---

## 6. Criterios de aceptación

- [ ] Propiedad `https://www.proacademymx.com/` verificada en Search Console.
- [ ] `google34f3ca96c55007c0.html` accesible con HTTP 200 en producción.
- [ ] `sitemap-index.xml` enviado y con estado «Correcto».
- [ ] Sitemap de producción sin rutas de admin/API y con todos los artículos
      publicados.
- [ ] Informes de indexación y rendimiento revisados y documentados.
- [ ] Problemas iniciales registrados y con responsable/fecha de seguimiento.

La configuración no puede considerarse validada hasta que se completen los
pasos manuales de Search Console y el despliegue pendiente.
