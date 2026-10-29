-- Imágenes destacadas únicas para los artículos del blog.
--
-- La auditoría visual del 2026-10-29 encontró dos grupos de artículos que
-- seguían compartiendo la misma imagen destacada aunque la URL fuera distinta:
--
--   1. `tecnica-estudio-examenes-admision` (/images/study-plan.webp) era la
--      misma fotografía que `digital-sat-guia-completa` (/images/blog-sat.webp),
--      solo cambiaba el archivo y la resolución.
--   2. `neurociencia-para-examen-udg-como-concentrarte-para-aprobar` usaba el
--      archivo `tips-para-concentrarse-en-el-examen-udg.webp`, idéntico byte a
--      byte a `mejora-tu-puntaje-con-un-diagnostico-de-examen-PAA.webp`.
--
-- Se asigna una imagen distinta y adecuada al tema de cada artículo. La de
-- neurociencia ya existía en el cuerpo del artículo (`estudiando-para-la-prueba-paa`),
-- por lo que el render la muestra una sola vez como hero.
--
-- Idempotente: si los valores ya son los definitivos, no actualiza nada.

UPDATE posts
SET image = '/images/methodology.webp',
    image_width = 1024,
    image_height = 1024,
    image_alt = 'Técnicas de estudio con planificación para exámenes de admisión',
    updated_at = now()
WHERE slug = 'tecnica-estudio-examenes-admision'
  AND (
    image IS DISTINCT FROM '/images/methodology.webp'
    OR image_width IS DISTINCT FROM 1024
    OR image_height IS DISTINCT FROM 1024
    OR image_alt IS DISTINCT FROM 'Técnicas de estudio con planificación para exámenes de admisión'
  );

UPDATE posts
SET image = 'https://cms.proacademymx.com/wp-content/uploads/2026/08/estudiando-para-la-prueba-paa.webp',
    image_width = 1280,
    image_height = 853,
    image_alt = 'Estudiante preparando la prueba PAA para el examen de admisión de la UDG',
    updated_at = now()
WHERE slug = 'neurociencia-para-examen-udg-como-concentrarte-para-aprobar'
  AND (
    image IS DISTINCT FROM 'https://cms.proacademymx.com/wp-content/uploads/2026/08/estudiando-para-la-prueba-paa.webp'
    OR image_width IS DISTINCT FROM 1280
    OR image_height IS DISTINCT FROM 853
    OR image_alt IS DISTINCT FROM 'Estudiante preparando la prueba PAA para el examen de admisión de la UDG'
  );
