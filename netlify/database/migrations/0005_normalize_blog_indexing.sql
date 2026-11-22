-- Normalización de indexación del blog.
--
-- 1. Canonicales y enlaces internos en el dominio apex (producción redirige
--    www → apex con 301; los canonicales no deben apuntar a una redirección).
-- 2. Elimina la imagen destacada duplicada al inicio del HTML importado de
--    WordPress (la plantilla ya la muestra como hero).
-- 3. Da una imagen destacada única a los 9 artículos semilla que compartían
--    solo tres imágenes.
-- 4. Diferencia los títulos duplicados sin cambiar sus slugs/URLs.
--
-- Idempotente: cada UPDATE vuelve a dejar el mismo resultado si se ejecuta
-- otra vez. No modifica las migraciones ya aplicadas (0001–0004).

-- ---------------------------------------------------------------------------
-- 1. Dominio apex en canonicales, HTML y body almacenados.
-- ---------------------------------------------------------------------------

UPDATE posts
SET canonical_url = regexp_replace(
      replace(canonical_url, 'https://www.proacademymx.com', 'https://proacademymx.com'),
      '/+$',
      ''
    ),
    updated_at = now()
WHERE canonical_url IS NOT NULL
  AND canonical_url IS DISTINCT FROM regexp_replace(
        replace(canonical_url, 'https://www.proacademymx.com', 'https://proacademymx.com'),
        '/+$',
        ''
      );

UPDATE posts
SET html = replace(html, 'https://www.proacademymx.com', 'https://proacademymx.com'),
    updated_at = now()
WHERE html LIKE '%https://www.proacademymx.com%';

UPDATE posts
SET body = replace(body, 'https://www.proacademymx.com', 'https://proacademymx.com'),
    updated_at = now()
WHERE body LIKE '%https://www.proacademymx.com%';

-- ---------------------------------------------------------------------------
-- 2. Quitar la figura destacada repetida al inicio del artículo.
--    `strpos('</figure>')` corta exactamente la primera figura, evitando que
--    una expresión regular codiciosa borre figuras legítimas posteriores.
-- ---------------------------------------------------------------------------

UPDATE posts
SET html = trim(
      leading E' \t\n\r'
      from substring(html from strpos(html, '</figure>') + 9)
    ),
    updated_at = now()
WHERE html ~ '^[[:space:]]*<figure[^>]*wp-block-post-featured-image'
  AND strpos(html, '</figure>') > 0;

UPDATE posts
SET body = trim(
      leading E' \t\n\r'
      from substring(body from strpos(body, '</figure>') + 9)
    ),
    updated_at = now()
WHERE body ~ '^[[:space:]]*<figure[^>]*wp-block-post-featured-image'
  AND strpos(body, '</figure>') > 0;

-- ---------------------------------------------------------------------------
-- 3. Imágenes destacadas únicas para los artículos semilla.
-- ---------------------------------------------------------------------------

UPDATE posts AS p
SET image = v.image,
    image_width = v.width,
    image_height = v.height,
    image_alt = v.alt,
    updated_at = now()
FROM (VALUES
  ('digital-sat-guia-completa', '/images/blog-sat.webp', 1024, 1024,
   'Digital SAT en 2026: estructura y preparación'),
  ('paa-tec-de-monterrey-puntaje', '/images/program-paa.webp', 609, 610,
   'Preparación para la PAA del Tec de Monterrey'),
  ('proceso-admision-universidades-eua', '/images/sat/checklist.webp', 360, 427,
   'Checklist para aplicar a universidades de Estados Unidos'),
  ('universidades-mas-demandadas-mexico', '/images/sat/estudiante.webp', 1000, 1010,
   'Estudiantes universitarios en México'),
  ('mejor-curso-toefl-ibt-2026', '/images/blog-toefl.webp', 1024, 1024,
   'Curso de preparación TOEFL iBT en línea'),
  ('recursos-gratuitos-ingles-academico', '/images/ibt-guia.webp', 680, 576,
   'Recursos gratuitos para mejorar el inglés académico'),
  ('simuladores-toefl-ibt-gratis', '/images/ibt-laptop.webp', 980, 785,
   'Simuladores del examen TOEFL iBT en computadora'),
  ('gre-vs-gmat-cual-presentar', '/images/blog-gre.webp', 1024, 1024,
   'GRE o GMAT: cómo elegir el examen para tu posgrado'),
  ('tecnica-estudio-examenes-admision', '/images/study-plan.webp', 1000, 1000,
   'Plan de estudio para exámenes de admisión')
) AS v(slug, image, width, height, alt)
WHERE p.slug = v.slug;

-- ---------------------------------------------------------------------------
-- 4. Títulos únicos (se conservan los slugs y, por tanto, las URLs).
-- ---------------------------------------------------------------------------

UPDATE posts AS p
SET title = v.title,
    updated_at = now()
FROM (VALUES
  ('mejor-curso-toefl-ibt-2026',
   'Mejor curso TOEFL iBT en 2026: cómo elegir y qué comparar'),
  ('simuladores-toefl-ibt-gratis',
   'Simuladores TOEFL iBT gratuitos: cuáles valen la pena en 2026'),
  ('examenes-de-practica-toefl-ibt-donde-encontrar-simuladores',
   'Exámenes de práctica TOEFL iBT: dónde encontrar simuladores en 2026')
) AS v(slug, title)
WHERE p.slug = v.slug
  AND p.title IS DISTINCT FROM v.title;
