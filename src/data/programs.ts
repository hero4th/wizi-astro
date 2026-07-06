export interface ProgramSection {
  name: string;
  detail: string;
}

export interface ExamSection {
  name: string;
  label: string;
  description: string;
  time: string;
  scoreRange: string;
  activities: { title: string; detail: string }[];
}

export interface Program {
  slug: string;
  exam: string;
  fullName: string;
  headline: string;
  accent: string;
  subheadline: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  audience: string;
  guarantee: string;
  priceMXN: number;
  sessions: number;
  exercises: number;
  evaluations: number;
  hours: number;
  skills: ProgramSection[];
  outcomes: string[];
  features: { title: string; detail: string }[];
  faqs: { q: string; a: string }[];
  scoreScale: string;
  heroImage?: string;
  /** Imágenes específicas para la página de curso rediseñada. */
  guideImage?: string;
  guaranteeImage?: string;
  skillsImage?: string;
  faqImage?: string;
  /** Intro de la sección "Preparación académica". */
  academicIntro?: string;
  /** Secciones del examen con detalle interactivo (tabs). */
  examSections?: ExamSection[];
}

export const PROGRAMS: Program[] = [
  {
    slug: "toefl-ibt",
    exam: "TOEFL iBT",
    fullName: "Test of English as a Foreign Language",
    headline: "Domina el inglés que",
    accent: "abre fronteras.",
    subheadline:
      "Preparación integral de las cuatro habilidades con materiales oficiales ETS, simuladores idénticos al examen real y retroalimentación 1 a 1.",
    description:
      "Curso intensivo de preparación para el TOEFL iBT con metodología certificada, profesores egresados de las mejores universidades y Garantía de Puntaje de +10 puntos.",
    metaTitle: "Curso TOEFL iBT Garantizado | +10 Puntos o te Devolvemos tu Dinero",
    metaDescription:
      "Prepárate para el TOEFL iBT con expertos certificados por ETS. Simuladores idénticos al examen real, clases 1 a 1 y Garantía de Puntaje. Más de 10,000 estudiantes en México.",
    audience: "Estudiantes que necesitan certificar su inglés para universidades, becas o visas de trabajo.",
    guarantee: "+10 puntos garantizados o te devolvemos el 100% de tu inversión.",
    priceMXN: 14900,
    sessions: 40,
    exercises: 1500,
    evaluations: 6,
    hours: 20,
    scoreScale: "0-120",
    skills: [
      { name: "Reading", detail: "Comprensión de textos académicos, inferencia y vocabulario en contexto con técnica de lectura cronometrada." },
      { name: "Listening", detail: "Conferencias y conversaciones universitarias con estrategias de toma de notas estructurada." },
      { name: "Speaking", detail: "Respuestas integradas e independientes con grabación, análisis y retroalimentación individual." },
      { name: "Writing", detail: "Ensayos integrados y de opinión con revisión 1 a 1 calibrada a las rúbricas oficiales de ETS." },
    ],
    outcomes: [
      "Puntaje competitivo para admisión internacional (90+)",
      "Dominio de las 4 habilidades bajo presión de tiempo",
      "Estrategias específicas por tipo de pregunta",
      "Confianza total el día del examen",
    ],
    features: [
      { title: "Materiales ETS", detail: "Acceso a preguntas basadas en los materiales oficiales de los desarrolladores del examen." },
      { title: "Simuladores reales", detail: "Practica con el formato, tiempo y preguntas del examen oficial durante toda tu preparación." },
      { title: "Expertos en el TOEFL", detail: "Maestros certificados con puntajes superiores a 110 y experiencia pedagógica comprobada." },
      { title: "Garantía de puntaje", detail: "Si tu puntaje no sube al menos 10 puntos durante nuestro curso, te devolvemos el 100% de tu inversión." },
    ],
    faqs: [
      { q: "¿Qué incluye el curso TOEFL iBT?", a: "Acceso a la plataforma con simuladores idénticos al examen real, material oficial de ETS y retroalimentación personalizada 1 a 1 de speaking y writing." },
      { q: "¿Tienen garantía de resultados?", a: "Sí. Garantizamos un aumento mínimo de 10 puntos sobre tu diagnóstico inicial. Si no lo logras al completar el curso, te devolvemos el 100% de tu inversión." },
      { q: "¿Qué nivel de inglés necesito para iniciar?", a: "Ninguno en particular: el diagnóstico inicial define tu punto de partida y el plan se adapta a tu nivel actual, desde B1 hasta C1." },
      { q: "¿Cuánto dura el programa de preparación?", a: "El programa estándar dura de 8 a 12 semanas según tu meta de puntaje y disponibilidad, con horarios totalmente flexibles." },
    ],
    heroImage: "/images/hero-toefl-ibt.webp",
    guideImage: "/images/ibt-guia.webp",
    guaranteeImage: "/images/ibt-garantias.webp",
    skillsImage: "/images/domina-toefl.webp",
    faqImage: "/images/ibt-laptop.webp",
    academicIntro:
      "La certificación del TOEFL iBT es un requisito obligatorio para la titulación en muchas universidades nacionales. Nuestro plan de estudio está diseñado para que mejores en poco tiempo.",
    examSections: [
      {
        name: "Reading",
        label: "Comprensión Lectora",
        description:
          "Evalúa tu capacidad para entender, procesar y analizar textos académicos. La dificultad del segundo bloque cambia según tu desempeño en el primero.",
        time: "~30 min",
        scoreRange: "1.0 - 6.0",
        activities: [
          { title: "Complete the Words", detail: "Rellenar las letras que faltan en palabras de un párrafo." },
          { title: "Read in Daily Life", detail: "Responder preguntas sobre anuncios, artículos cortos o notas cotidianas del campus." },
          { title: "Read an Academic Passage", detail: "Responder preguntas sobre un fragmento de texto académico tipo universitario." },
        ],
      },
      {
        name: "Listening",
        label: "Comprensión Auditiva",
        description:
          "Mide tu capacidad para entender conversaciones, indicaciones y clases en inglés académico, tomando notas mientras escuchas una sola vez.",
        time: "~35 min",
        scoreRange: "1.0 - 6.0",
        activities: [
          { title: "Listen for the Main Idea", detail: "Identificar el tema central de conversaciones y anuncios del campus." },
          { title: "Listen in Daily Life", detail: "Responder preguntas sobre instrucciones, mensajes y diálogos cotidianos." },
          { title: "Academic Lecture", detail: "Comprender y sintetizar una conferencia universitaria con toma de notas." },
        ],
      },
      {
        name: "Writing",
        label: "Expresión Escrita",
        description:
          "Desarrolla respuestas claras y bien estructuradas. Revisamos cada texto 1 a 1 con las rúbricas oficiales para que escribas como un nativo académico.",
        time: "~30 min",
        scoreRange: "1.0 - 6.0",
        activities: [
          { title: "Build a Sentence", detail: "Ordenar y completar oraciones aplicando gramática y vocabulario correctos." },
          { title: "Email Writing", detail: "Redactar un correo formal respondiendo a una situación del campus." },
          { title: "Opinion Essay", detail: "Argumentar una postura con introducción, desarrollo y conclusión." },
        ],
      },
      {
        name: "Speaking",
        label: "Expresión Oral",
        description:
          "Practica respuestas independientes e integradas con grabación y análisis. Ganas fluidez, pronunciación y seguridad para hablar bajo presión.",
        time: "~16 min",
        scoreRange: "1.0 - 6.0",
        activities: [
          { title: "Read Aloud", detail: "Leer un texto en voz alta cuidando ritmo y pronunciación." },
          { title: "Personal Response", detail: "Dar tu opinión sobre un tema cotidiano en tiempo cronometrado." },
          { title: "Integrated Task", detail: "Resumir y responder combinando información de lectura y audio." },
        ],
      },
    ],
  },
  {
    slug: "sat",
    exam: "SAT",
    fullName: "Scholastic Assessment Test",
    headline: "El puntaje que exigen",
    accent: "las mejores universidades.",
    subheadline:
      "Preparación Digital SAT con estrategias de Evidence-Based Reading, Writing y Math adaptadas al nuevo formato adaptativo.",
    description:
      "Curso completo para el Digital SAT con simuladores adaptativos, técnicas de manejo de tiempo y tutorías personalizadas para admisión a universidades de Estados Unidos y el Tec de Monterrey.",
    metaTitle: "Curso SAT Digital Garantizado | Preparación para Universidades Top",
    metaDescription:
      "Domina el Digital SAT con simuladores adaptativos, clases 1 a 1 y Garantía de Puntaje. Preparación para admisión a universidades de EE. UU. y el Tec de Monterrey.",
    audience: "Estudiantes de preparatoria que buscan admisión en universidades de EE. UU. o programas internacionales.",
    guarantee: "+100 puntos garantizados sobre tu diagnóstico o te devolvemos tu inversión.",
    priceMXN: 14900,
    sessions: 40,
    exercises: 1800,
    evaluations: 6,
    hours: 22,
    scoreScale: "400-1600",
    skills: [
      { name: "Reading & Writing", detail: "Comprensión de lectura basada en evidencia, gramática y retórica con pasajes del formato digital." },
      { name: "Math: Álgebra", detail: "Ecuaciones lineales, sistemas y funciones con técnicas de resolución rápida sin calculadora." },
      { name: "Math: Avanzado", detail: "Funciones no lineales, geometría y trigonometría con el uso estratégico de Desmos integrado." },
      { name: "Estrategia adaptativa", detail: "Manejo del formato multistage adaptive: cómo el primer módulo define tu techo de puntaje." },
    ],
    outcomes: [
      "Puntaje 1400+ para universidades competitivas",
      "Dominio del formato digital adaptativo",
      "Velocidad y precisión en Math sin sacrificar exactitud",
      "Preparación válida para becas académicas",
    ],
    features: [
      { title: "Formato digital", detail: "Simuladores que replican Bluebook, la aplicación oficial del College Board." },
      { title: "Plan adaptativo", detail: "Diagnóstico inicial y ruta de aprendizaje personalizada día a día." },
      { title: "Tutores expertos", detail: "Docentes con puntajes 1500+ y años de experiencia preparando admisiones." },
      { title: "Análisis de errores", detail: "Cada simulacro genera un reporte por tipo de pregunta para atacar tus debilidades." },
    ],
    faqs: [
      { q: "¿El curso cubre el nuevo Digital SAT?", a: "Sí, todo el programa está construido alrededor del formato digital adaptativo vigente, incluyendo práctica con la interfaz tipo Bluebook y el uso de Desmos." },
      { q: "¿Sirve para el Tec de Monterrey?", a: "Sí. La PAA y el SAT comparten estructura de College Board; nuestro curso prepara puntajes competitivos para admisión al Tec y universidades de EE. UU." },
      { q: "¿Cuántos simulacros incluye?", a: "Seis evaluaciones completas cronometradas más simulacros parciales por sección, todos con reporte detallado de desempeño." },
      { q: "¿Tienen garantía de puntaje?", a: "Garantizamos un aumento mínimo de 100 puntos sobre tu diagnóstico inicial o te devolvemos el 100% de tu inversión." },
    ],
    heroImage: "/sat-hero.png",
  },
  {
    slug: "gre",
    exam: "GRE",
    fullName: "Graduate Record Examination",
    headline: "Tu posgrado comienza",
    accent: "con este puntaje.",
    subheadline:
      "Domina el GRE con la metodología avalada por los evaluadores, a través de 4 pilares de preparación: materiales ETS, simuladores, estudio flexible y expertos certificados.",
    description:
      "Curso GRE garantizado: incrementa por lo menos 10 puntos o te devolvemos tu dinero. Preparación verbal, cuantitativa y de redacción analítica para maestrías y doctorados.",
    metaTitle: "Curso GRE Garantizado | Incrementa +10 Puntos o te Devolvemos tu Dinero",
    metaDescription:
      "Prepárate para el GRE con materiales oficiales ETS, simuladores idénticos al examen y tutores con puntajes en el top 1%. Garantía de Satisfacción Total.",
    audience: "Profesionistas y egresados que aplican a maestrías y doctorados en el extranjero.",
    guarantee: "+10 puntos garantizados o te devolvemos el 100% de tu inversión.",
    priceMXN: 14900,
    sessions: 40,
    exercises: 1500,
    evaluations: 6,
    hours: 20,
    scoreScale: "260-340",
    skills: [
      { name: "Razonamiento verbal", detail: "Comprensión de lectura, equivalencia de oraciones y completar el texto con estrategia de descarte rápido." },
      { name: "Razonamiento cuantitativo", detail: "Aritmética, álgebra, geometría y análisis de datos con comparaciones cuantitativas." },
      { name: "Redacción analítica", detail: "Ensayo Analyze an Issue con estructura argumentativa calibrada a las rúbricas de ETS." },
      { name: "Vocabulario GRE", detail: "Las 800 palabras de alta frecuencia con técnica de spaced repetition integrada a tu plan." },
    ],
    outcomes: [
      "Puntaje 320+ para programas competitivos",
      "Velocidad en comparaciones cuantitativas",
      "Vocabulario académico de alta frecuencia",
      "Ensayos calibrados a rúbrica oficial",
    ],
    features: [
      { title: "Materiales ETS", detail: "Acceso a preguntas basadas en los materiales oficiales de los desarrolladores del examen." },
      { title: "Simuladores", detail: "Practica con el formato, tiempo y preguntas del examen oficial durante toda tu preparación." },
      { title: "Estudio flexible", detail: "Crea un plan de estudio y un horario personalizado, solo con los temas que necesitas." },
      { title: "Expertos GRE", detail: "Maestros certificados con puntajes superiores a 330 y experiencia pedagógica." },
    ],
    faqs: [
      { q: "¿Qué incluye el curso GRE?", a: "Acceso a la plataforma con simuladores idénticos al examen real, material oficial de ETS y retroalimentación personalizada 1 a 1 de redacción." },
      { q: "¿Cómo funcionan las sesiones de feedback?", a: "Un experto revisa tus simulacros y ensayos con las rúbricas oficiales y diseña tu plan de mejora semanal." },
      { q: "¿Tienen garantía de resultados?", a: "Sí. Si no incrementas al menos 10 puntos tras completar el curso, te devolvemos el 100% de tu inversión." },
      { q: "¿Qué nivel de inglés necesito para iniciar?", a: "Recomendamos un nivel B2 de inglés. El diagnóstico inicial confirma tu punto de partida y ajusta el plan." },
      { q: "¿Cuánto dura el programa de preparación?", a: "Entre 8 y 12 semanas según tu meta, con 40 sesiones de clase y horarios flexibles." },
    ],
    heroImage: "/sat-hero.png",
  },
  {
    slug: "gmat",
    exam: "GMAT",
    fullName: "Graduate Management Admission Test",
    headline: "El MBA que quieres",
    accent: "tiene un número.",
    subheadline:
      "Preparación GMAT Focus Edition: Quantitative, Verbal y Data Insights con estrategia adaptativa y tutores del top 1%.",
    description:
      "Curso GMAT Focus Edition con simuladores adaptativos, análisis de datos y estrategia por sección para admisión a las mejores escuelas de negocios del mundo.",
    metaTitle: "Curso GMAT Focus Edition | Preparación para MBA con Garantía",
    metaDescription:
      "Domina el GMAT Focus Edition con tutores del top 1%, simuladores adaptativos y Garantía de Puntaje. Tu admisión al MBA comienza aquí.",
    audience: "Profesionistas que aplican a MBA y maestrías en negocios en el extranjero o en México.",
    guarantee: "Aumento garantizado sobre tu diagnóstico o te devolvemos tu inversión.",
    priceMXN: 15900,
    sessions: 40,
    exercises: 1400,
    evaluations: 6,
    hours: 22,
    scoreScale: "205-805",
    skills: [
      { name: "Quantitative Reasoning", detail: "Problem solving puro: álgebra y aritmética aplicada sin geometría, con técnicas de estimación." },
      { name: "Verbal Reasoning", detail: "Critical reasoning y reading comprehension con método de descarte estructurado." },
      { name: "Data Insights", detail: "Data sufficiency, gráficas, tablas y análisis multifuente: la sección decisiva del Focus Edition." },
      { name: "Estrategia adaptativa", detail: "Question review & edit: cómo administrar los cambios de respuesta permitidos por sección." },
    ],
    outcomes: [
      "Puntaje 645+ para escuelas top",
      "Dominio de Data Insights",
      "Manejo del algoritmo adaptativo",
      "Perfil competitivo para becas MBA",
    ],
    features: [
      { title: "Focus Edition", detail: "Programa actualizado al formato vigente de tres secciones de 45 minutos." },
      { title: "Simuladores GMAC", detail: "Práctica basada en los materiales oficiales del Graduate Management Admission Council." },
      { title: "Tutores top 1%", detail: "Docentes con puntajes en el percentil 99 y experiencia en admisiones MBA." },
      { title: "Plan por secciones", detail: "Ruta personalizada según el peso de cada sección en tu escuela objetivo." },
    ],
    faqs: [
      { q: "¿El curso cubre el GMAT Focus Edition?", a: "Sí, el programa completo está actualizado al Focus Edition: tres secciones de 45 minutos, sin essay y con la nueva sección de Data Insights." },
      { q: "¿GMAT o GRE, cuál me conviene?", a: "Depende de tu programa objetivo. En la sesión de diagnóstico gratuita evaluamos tu perfil y te recomendamos el examen que maximice tu admisión." },
      { q: "¿Cuánto dura la preparación?", a: "De 10 a 14 semanas en promedio, con 40 sesiones y horarios flexibles para profesionistas." },
      { q: "¿Tienen garantía?", a: "Sí, garantizamos un aumento medible sobre tu diagnóstico inicial o te devolvemos el 100% de tu inversión." },
    ],
    heroImage: "/sat-hero.png",
  },
  {
    slug: "paa",
    exam: "PAA",
    fullName: "Prueba de Aptitud Académica del College Board",
    headline: "Tu lugar en el Tec",
    accent: "se gana aquí.",
    subheadline:
      "Preparación completa para la Prueba de Aptitud Académica del College Board: lectura, redacción y matemáticas con simuladores idénticos al examen.",
    description:
      "Curso PAA para admisión al Tec de Monterrey y universidades College Board: simuladores reales, clases 1 a 1 y Garantía de Puntaje.",
    metaTitle: "Curso PAA College Board | Admisión al Tec de Monterrey Garantizada",
    metaDescription:
      "Prepárate para la PAA con simuladores idénticos al examen del College Board, clases personalizadas y Garantía de Puntaje. Asegura tu admisión al Tec de Monterrey.",
    audience: "Estudiantes que buscan admisión al Tec de Monterrey, UDEM y universidades que aplican la PAA.",
    guarantee: "+100 puntos garantizados sobre tu diagnóstico o te devolvemos tu inversión.",
    priceMXN: 12900,
    sessions: 36,
    exercises: 1600,
    evaluations: 6,
    hours: 18,
    scoreScale: "400-1600",
    skills: [
      { name: "Lectura", detail: "Comprensión de textos literarios, científicos y sociales con preguntas de evidencia." },
      { name: "Redacción y lenguaje", detail: "Gramática, cohesión y precisión en español con ejercicios del formato oficial." },
      { name: "Matemáticas", detail: "Álgebra, problemas y análisis de datos, con y sin calculadora, al estilo College Board." },
      { name: "Estrategia de examen", detail: "Manejo de tiempo por sección y técnica de descarte para maximizar aciertos." },
    ],
    outcomes: [
      "Puntaje competitivo para el Tec de Monterrey (1250+)",
      "Dominio de las tres secciones de la PAA",
      "Simulacros bajo condiciones reales",
      "Estrategia personalizada de admisión",
    ],
    features: [
      { title: "Formato oficial", detail: "Simuladores construidos con la estructura exacta de la PAA del College Board." },
      { title: "Clases 1 a 1", detail: "Tutorías personalizadas con docentes egresados de las mejores universidades." },
      { title: "Plan de admisión", detail: "Acompañamiento en el proceso completo de admisión al Tec y College Board." },
      { title: "Reportes de avance", detail: "Métricas por sección después de cada simulacro para enfocar tu estudio." },
    ],
    faqs: [
      { q: "¿La PAA es lo mismo que el SAT?", a: "Comparten estructura del College Board, pero la PAA se aplica en español y la usan el Tec de Monterrey, UDEM y otras universidades de Latinoamérica." },
      { q: "¿Qué puntaje necesito para el Tec de Monterrey?", a: "Depende de la carrera y el campus, pero un puntaje de 1250+ te coloca en rango competitivo para la mayoría de los programas." },
      { q: "¿Cuánto tiempo antes debo prepararme?", a: "Recomendamos iniciar de 3 a 4 meses antes de tu fecha de examen para completar las 36 sesiones y los 6 simulacros." },
      { q: "¿Tienen garantía de puntaje?", a: "Sí, garantizamos un aumento mínimo de 100 puntos sobre tu diagnóstico o te devolvemos el 100% de tu inversión." },
    ],
    heroImage: "/sat-hero.png",
  },
];

export const getProgram = (slug: string) =>
  PROGRAMS.find((p) => p.slug === slug);
