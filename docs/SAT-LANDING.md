# Landing SAT

Referencia: [Figma de María, Landing del SAT](https://www.figma.com/design/Z0gsp93u1zpJd7ybv3fAuA/Practicas-WIZI?node-id=2911-24967), revisado el 11 de septiembre de 2026. Body: `2906:23838`. La implementación corresponde a la etapa SAT; el contexto general de rediseño de Home y otros cursos no forma parte de este cambio.

## Implementación

- Ruta: `/cursos/sat`. Reutiliza `src/pages/cursos/[slug].astro` y el registro SAT de `src/data/programs.ts`.
- Secciones: hero, métricas, preparación, Reading & Writing / Math, comparativa, FAQ y contacto. Header/Footer/FAQ reutilizados.
- Estilos específicos limitados a `[data-course="sat"]`. SAT muestra el contenido desde el primer render, independientemente del motor de animaciones compartido; los contadores tienen valor HTML inicial.
- Pestañas con asociación ARIA, un solo panel visible y navegación con flechas/Home/End.
- Formulario SAT usa `/api/contact`, valida nombre/correo, evita doble envío, comprueba HTTP y `success`, y permite continuar a WhatsApp mediante enlace explícito. No informa éxito en errores. Los otros cursos conservan su flujo de contacto.
- URLs de precios y testimonios conservadas. SAT usa las tarifas PAA autorizadas por Herón. Las tarifas y condiciones de los otros cursos se conservan.

## Contenido y recursos

Las métricas del Figma son 40 sesiones, más de 5.000 ejercicios, 20 evaluaciones y más de 60 horas grabadas. La comparativa distingue las 20 horas de clase 1:1 en vivo de las horas grabadas.

La tarjeta de garantía del diseño dice menor al 90% del total o no admisión, con devolución del 100%. El FAQ de Figma conservaba texto de PAA y 90 puntos. El usuario confirmó usar la condición de la tarjeta SAT y corregir el FAQ copiado. Se eliminó la promesa anterior de +100 puntos del registro de garantía SAT.

`public/images/sat/` contiene imágenes WebP derivadas de los recursos originales incrustados en el SVG exportado de Figma: guías, resultados, estudiante, laptop y checklist. Las composiciones de guías/resultados conservan los recortes y transformaciones del diseño. El hero existente `/sat-hero.png` coincide con la referencia y se reutiliza. No se generaron imágenes nuevas ni se incorporó el SVG completo de 20 MB al repositorio.

## Validación

- `node --test scripts/sat-landing.test.mjs scripts/hour-price-picker.test.mjs`: 6 pruebas con API/DOM simulados, sin correo, WhatsApp ni base de datos reales.
- Build: `node --env-file=.env node_modules/astro/astro.js build` seguido de `node scripts/patch-redirects.mjs` (también forma parte de `npm run build`).
- Revisión visual local en Safari: escritorio, tablet 768 × 1024, móvil 390 × 844 y ancho compacto 320. Revisión móvil de tarjetas, pestañas, comparativa, FAQ y formulario; menú con enlaces SAT y validación de campos vacíos.
- `astro check` tiene 17 errores previos: 16 comprobaciones de nulabilidad en `WhyChooseUs.astro` y una propiedad duplicada en el registro PAA de `programs.ts`. No se amplió esta tarea para corregirlos.
- El envío SMTP real no se ejecuta como prueba: las pruebas verifican la lógica del cliente con respuestas simuladas; la disponibilidad del servicio de correo depende de la configuración existente.

## Precios SAT aprobados

Herón confirmó, a través del usuario, reutilizar los precios PAA solamente para SAT. Las opciones son 5 h ($4,900), 10 h ($8,900, inicial), 20 h ($16,900) y 30 h ($22,900). No existen opciones de 15 ni 25 h; esta decisión sustituye la anotación de intervalos de 5 del Figma.

SAT reutiliza las cuatro tarjetas PAA: Esencial $2,490, Avanzado con selector, Élite $29,000 y Grupal $7,900 (oculta). Mantiene su garantía SAT aprobada. PAA, TOEFL, GRE y GMAT conservan sus tarifas y contenido. El listado general identifica el precio de entrada SAT como «Desde / Plan Pro Esencial» y enlaza a sus planes; el precio de la oferta estructurada SAT coincide con ese plan.

## Anotaciones adicionales y reparación de localhost

Revisión del 11 de septiembre de 2026:

- Nota del lienzo de precios: 5–30 h en intervalos de 5, 10 h por defecto. La decisión posterior de Herón conserva 5/10/20/30 h, con 10 h inicial; 15 y 25 h quedan descartadas. No se interpolaron precios ni se cambió 10 h a los $8.500 del mockup.
- Cuatro tarjetas, tres visibles: ya existe el plan Pro Élite - Grupal con `hidden: true` en PAA.
- Contacto directo: la página ya contiene tres tarjetas (teléfonos, correo y horarios), barra de dirección, y los datos de la captura. No se cambiaron datos comerciales.
- Panel de comentarios de Figma: #12 remite al set de iconos `line-md` en ProAcademy Nueva web. #2 (año automático) pertenece a Página de Temarios; el footer de este sitio ya calcula el año. #1 (enlace a artículo UNAM) pertenece a la página UNAM de Wizi, no a esta landing SAT.
- Fallo demostrado en localhost: Lenis, GSAP y ScrollTrigger devolvían 504; la metadata de caché ya no contenía esas dependencias aunque el módulo servido las referenciaba. Había dos procesos Astro del mismo directorio. Se reinició una sola instancia en 4322 y el puerto antiguo 4321 redirige temporalmente a ella.
- `vite.cacheDir` separa dev, build y check. Tras compilar, se volvieron a comprobar 28 páginas, 91 recursos y 5 módulos sin fallos. Los estilos globales ahora muestran el contenido por defecto; las entradas globales y del blog no ponen opacidad cero. Las animaciones conservan desplazamientos, sin ocultar información esencial.
