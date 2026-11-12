import { PAA_ESSENTIAL_PRICE_MXN } from "./hour-packages";

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
  heroImage?: { src: string; width: number; height: number };
  /** Imágenes específicas para la página de curso rediseñada. */
  guideImage?: string;
  guaranteeImage?: string;
  skillsImage?: string;
  faqImage?: string;
  /** Intro de la sección "Preparación académica". */
  academicIntro?: string;
  /** Secciones del examen con detalle interactivo (tabs). */
  examSections?: ExamSection[];
  /** Comparativa y beneficios específicos del curso. */
  comparison?: { label: string; pa: string; trad: string }[];
  benefits?: string[];
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
    heroImage: { src: "/images/hero-toefl-ibt.webp", width: 1200, height: 577 },
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
        scoreRange: "1.0 – 6.0",
        activities: [
          { title: "Complete the Words", detail: "Rellenar las letras que faltan en palabras de un párrafo." },
          { title: "Read in Daily Life", detail: "Responder preguntas sobre anuncios, artículos cortos o notas cotidianas del campus." },
        ],
      },
      {
        name: "Listening",
        label: "Comprensión Auditiva",
        description:
          "Evalúa tu capacidad para entender textos tanto académicos como cotidianos. La dificultad del segundo bloque cambia según tu desempeño en el primero.",
        time: "~29 min",
        scoreRange: "1.0 – 6.0",
        activities: [
          { title: "Listen and Choose a Response", detail: "Escuchar una frase o pregunta corta de la vida diaria y elegir la respuesta lógica." },
          { title: "Listen to an Announcement or Conversation", detail: "Escuchar avisos públicos o diálogos informales entre estudiantes." },
        ],
      },
      {
        name: "Writing",
        label: "Expresión Escrita",
        description:
          "Evalúa tu habilidad para comunicar ideas por escrito de forma clara, precisa y estructurada en situaciones universitarias reales.",
        time: "~23 min",
        scoreRange: "1.0 – 6.0",
        activities: [
          { title: "Build a Sentence", detail: "Ordenar fragmentos mezclados para formar una oración gramaticalmente correcta." },
          { title: "Write an Email", detail: "Redactar un correo electrónico respondiendo a una situación específica." },
        ],
      },
      {
        name: "Speaking",
        label: "Expresión Oral",
        description:
          "Mide tu fluidez, pronunciación, entonación y la capacidad de reaccionar oralmente de forma inmediata. Los tiempos son estrictos y no se pueden pausar.",
        time: "~8 min",
        scoreRange: "1.0 – 6.0",
        activities: [
          { title: "Listen and Repeat", detail: "Escuchar frases cortas y repetirlas imitando el ritmo y la pronunciación." },
          { title: "Take an Interview", detail: "Responder las preguntas de un entrevistador virtual (15 s preparación / 45 s respuesta)." },
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
      "Preparación integral en Reading and Writing y Math para ingresar a universidades internacionales. Estudia con material alineado al College Board y simuladores reales.",
    description:
      "Curso completo para el Digital SAT con simuladores adaptativos, técnicas de manejo de tiempo y tutorías personalizadas para admisión a universidades de Estados Unidos y el Tec de Monterrey.",
    metaTitle: "Curso SAT Digital Garantizado | Preparación para Universidades Top",
    metaDescription:
      "Domina el Digital SAT con simuladores adaptativos, clases 1 a 1 y Garantía de Puntaje. Preparación para admisión a universidades de EE. UU. y el Tec de Monterrey.",
    audience: "Estudiantes de preparatoria que buscan admisión en universidades de EE. UU. o programas internacionales.",
    guarantee: "Si tu puntuación en el examen oficial es menor al 90% del total o no eres admitido, te devolvemos el 100% de tu inversión.",
    priceMXN: PAA_ESSENTIAL_PRICE_MXN,
    sessions: 40,
    exercises: 5000,
    evaluations: 20,
    hours: 60,
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
      { title: "Materiales de estudio", detail: "Acceso a bancos de preguntas y reactivos actualizados según la estructura de evaluación de College Board." },
      { title: "Simuladores reales", detail: "Practica con el formato, tiempo y preguntas del examen oficial durante toda tu preparación." },
      { title: "Expertos en la prueba SAT", detail: "Maestros que superaron la prueba del College Board, enfocados en las metodologías y trucos del examen." },
      { title: "Garantía de puntaje", detail: "Si tu puntuación en el examen oficial es menor al 90% del total o no eres admitido, te devolvemos el 100% de tu inversión." },
    ],
    faqs: [
      { q: "¿Qué incluye el curso de preparación SAT?", a: "Acceso ilimitado a nuestra plataforma con simuladores interactivos, bancos de ejercicios por sección (Reading and Writing y Math) y retroalimentación personalizada de expertos para las preguntas más difíciles." },
      { q: "¿Cómo funciona la garantía de puntaje?", a: "Estamos tan seguros de nuestra metodología que si tu puntuación oficial en el SAT es menor al 90% del total o no eres admitido después de completar el curso, te devolvemos el 100% de tu inversión. Nuestro objetivo es asegurar tu lugar en la universidad." },
      { q: "¿De qué manera se puntúa el examen SAT?", a: "El SAT se califica en una escala total de 400 a 1600 puntos, que se obtiene sumando los resultados de sus dos secciones principales: Reading and Writing, que va de 200 a 800 puntos, y Math, que también va de 200 a 800 puntos. Solo las preguntas correctas suman puntos, por lo que siempre conviene contestar todas las preguntas." },
      { q: "¿Cuánto dura el programa de preparación?", a: "El programa está diseñado para completarse de manera óptima en las horas contratadas, dedicando breves momentos a la semana. Sin embargo, si necesitas una preparación más flexible, puedes contratar más horas y avanzar a tu propio ritmo." },
    ],
    heroImage: { src: "/sat-hero.webp", width: 2000, height: 785 },
    guideImage: "/images/sat/materiales.webp",
    guaranteeImage: "/images/sat/resultados.webp",
    skillsImage: "/images/sat/estudiante.webp",
    faqImage: "/images/sat/laptop.webp",
    academicIntro:
      "Asegura tu admisión en universidades de Estados Unidos con un buen puntaje en el examen SAT. Nuestro plan de estudio te garantiza el éxito en poco tiempo.",
    comparison: [
      { label: "Duración del curso", pa: "20 horas de clase 1:1 en vivo", trad: "8 semanas" },
      { label: "Herramientas", pa: "Acceso a plataforma premium", trad: "Libro limitado" },
      { label: "Simuladores reales", pa: "20 exámenes de simulación", trad: "Bancos de preguntas" },
      { label: "Sesiones de estudio", pa: "Horarios flexibles adaptables", trad: "Sujetas a disponibilidad" },
      { label: "Temario", pa: "Plan de estudio personalizado", trad: "Varía por programa" },
    ],
    examSections: [
      {
        name: "Reading & Writing",
        label: "",
        description: "Evalúa tus habilidades de comprensión lectora, análisis crítico, vocabulario en contexto, gramática y edición de redacción según el estándar académico universitario.",
        time: "~64 min",
        scoreRange: "200–800",
        activities: [
          { title: "Craft and Structure & Information", detail: "Leer pasajes breves para inferir ideas clave, propósitos y vocabulario en contexto." },
          { title: "Expression of Ideas & English Conventions", detail: "Aplicar reglas gramaticales y de puntuación para mejorar una redacción." },
        ],
      },
      {
        name: "Math",
        label: "",
        description: "Mide tu capacidad de razonamiento matemático, resolución de problemas algebraicos, funciones avanzadas, análisis de datos, geometría y trigonometría.",
        time: "~70 min",
        scoreRange: "200–800",
        activities: [
          { title: "Algebra & Advanced Math", detail: "Resolver ecuaciones, desigualdades, expresiones algebraicas y funciones complejas." },
          { title: "Problem-Solving, Data & Geometry", detail: "Interpretar tablas, gráficos y proporciones para resolver problemas matemáticos." },
        ],
      },
    ],
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
    heroImage: { src: "/images/gre-hero.webp", width: 1024, height: 889 },
    guideImage: "/images/ibt-guia.webp",
    guaranteeImage: "/images/ibt-garantias.webp",
    skillsImage: "/images/domina-toefl.webp",
    faqImage: "/images/ibt-laptop.webp",
    academicIntro:
      "El GRE es el examen estándar para las mejores maestrías y doctorados a nivel mundial. Nuestro programa ataca el vocabulario avanzado y el razonamiento lógico con rigor y estrategia.",
    examSections: [
      {
        name: "Verbal Reasoning",
        label: "Razonamiento Verbal",
        description:
          "Evalúa tu capacidad de analizar y evaluar material escrito, sintetizar información de pasajes complejos y reconocer relaciones entre palabras y conceptos.",
        time: "~46 min",
        scoreRange: "130 – 170",
        activities: [
          { title: "Text Completion", detail: "Completar párrafos académicos identificando el tono e intención lógica del autor." },
          { title: "Sentence Equivalence", detail: "Seleccionar dos palabras que completen una oración produciendo el mismo significado exacto." },
        ],
      },
      {
        name: "Quantitative",
        label: "Razonamiento Cuantitativo",
        description:
          "Mide tu habilidad para modelar y resolver problemas matemáticos en aritmética, álgebra, geometría y análisis estadístico de datos.",
        time: "~47 min",
        scoreRange: "130 – 170",
        activities: [
          { title: "Quantitative Comparison", detail: "Comparar dos cantidades para determinar con velocidad la relación matemática entre ellas." },
          { title: "Multiple-Choice Math", detail: "Resolver ejercicios numéricos avanzados aplicando atajos sin cálculos excesivos." },
        ],
      },
      {
        name: "Analytical Writing",
        label: "Redacción Analítica",
        description:
          "Evalúa tu capacidad de articular y respaldar ideas complejas, construir argumentos sólidos y mantener una redacción académica coherente.",
        time: "~30 min",
        scoreRange: "0.0 – 6.0",
        activities: [
          { title: "Analyze an Issue", detail: "Redactar un ensayo argumentando una postura clara ante un tema filosófico o social." },
          { title: "Argument Structuring", detail: "Desarrollar tesis, premisas y contraargumentos con coherencia expositiva." },
        ],
      },
      {
        name: "Vocabulary",
        label: "Dominio Léxico",
        description:
          "El éxito en la sección verbal del GRE depende directamente de un vocabulario universitario y científico extenso, integrado a tu rutina de práctica.",
        time: "Continuo",
        scoreRange: "130 – 170",
        activities: [
          { title: "Spaced Repetition", detail: "Memorización activa de las 800 palabras más frecuentes en exámenes oficiales ETS." },
          { title: "Roots & Affixes", detail: "Decodificar palabras complejas mediante etimología latina y griega." },
        ],
      },
    ],
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
      { q: "¿El curso cubre el GMAT Focus Edition?", a: "Sí, todo el programa está actualizado al Focus Edition: tres secciones de 45 minutos, sin essay y con la nueva sección de Data Insights." },
      { q: "¿GMAT o GRE, cuál me conviene?", a: "Depende de tu programa objetivo. En la sesión de diagnóstico gratuita evaluamos tu perfil y te recomendamos el examen que maximice tu admisión." },
      { q: "¿Cuánto dura la preparación?", a: "De 10 a 14 semanas en promedio, con 40 sesiones y horarios flexibles para profesionistas." },
      { q: "¿Tienen garantía?", a: "Sí, garantizamos un aumento medible sobre tu diagnóstico inicial o te devolvemos el 100% de tu inversión." },
    ],
    heroImage: { src: "/images/gmat-hero.webp", width: 500, height: 236 },
    guideImage: "/images/ibt-guia.webp",
    guaranteeImage: "/images/ibt-garantias.webp",
    skillsImage: "/images/domina-toefl.webp",
    faqImage: "/images/ibt-laptop.webp",
    academicIntro:
      "El GMAT Focus Edition es el estándar global para acceder a los MBA más prestigiosos. Nuestro curso domina las tres secciones clave con técnicas avanzadas de razonamiento.",
    examSections: [
      {
        name: "Quantitative",
        label: "Razonamiento Cuantitativo",
        description:
          "Mide tu capacidad de razonamiento matemático para resolver problemas de álgebra y aritmética aplicada en entornos de negocios y toma de decisiones.",
        time: "45 min",
        scoreRange: "60 – 90",
        activities: [
          { title: "Problem Solving", detail: "Resolver problemas matemáticos de álgebra, proporciones y progresiones sin calculadora." },
          { title: "Number Properties", detail: "Dominar reglas de divisibilidad, exponentes y desigualdades con agilidad analítica." },
        ],
      },
      {
        name: "Verbal",
        label: "Razonamiento Verbal",
        description:
          "Evalúa tu capacidad de leer y comprender pasajes complejos, argumentar con solidez lógica y detectar falacias o suposiciones implícitas.",
        time: "45 min",
        scoreRange: "60 – 90",
        activities: [
          { title: "Critical Reasoning", detail: "Identificar suposiciones, fortalecer o debilitar argumentos e inferir conclusiones de negocios." },
          { title: "Reading Comprehension", detail: "Analizar textos extensos sobre economía, estrategia empresarial y ciencias sociales." },
        ],
      },
      {
        name: "Data Insights",
        label: "Análisis de Datos",
        description:
          "La sección diferenciadora del Focus Edition: evalúa cómo procesas información cuantitativa y verbal de múltiples fuentes para tomar decisiones ejecutivas.",
        time: "45 min",
        scoreRange: "60 – 90",
        activities: [
          { title: "Data Sufficiency", detail: "Determinar si la información proporcionada es suficiente para resolver un problema estratégico." },
          { title: "Multi-Source Reasoning", detail: "Cruzar correos, tablas financieras y gráficos para responder preguntas complejas." },
        ],
      },
      {
        name: "Adaptive Focus",
        label: "Algoritmo Adaptativo",
        description:
          "El formato actual permite revisar y editar hasta tres respuestas por sección. Aprende a gestionar el tiempo y el orden de respuesta para maximizar tu puntaje final.",
        time: "Transversal",
        scoreRange: "205 – 805",
        activities: [
          { title: "Question Review & Edit", detail: "Estrategia de cuándo usar tus 3 correcciones permitidas por módulo." },
          { title: "Section Order Selection", detail: "Elegir el orden óptimo de las tres secciones según tu fortaleza personal." },
        ],
      },
    ],
  },
  {
    slug: "paa",
    exam: "PAA",
    fullName: "Prueba de Aptitud Académica del College Board",
    headline: "Curso PAA College Board",
    accent: "¡garantizado!",
    subheadline:
      "Clases en vivo 1 a 1, simuladores reales y profesores expertos para asegurar tu lugar en la UDG, El Tec de Monterrey y la UDEM.",
    description:
      "Curso PAA para admisión a la UDG, Tec de Monterrey y UDEM: simuladores oficiales College Board, clases personalizadas 1 a 1 y garantía de +150 puntos.",
    metaTitle: "Curso PAA College Board ¡Garantizado! | Clases 1 a 1 y Simuladores",
    metaDescription:
      "Prepárate para la PAA con simuladores idénticos al College Board, clases 1 a 1 y garantía de +150 puntos sobre tu diagnóstico inicial. Inicia hoy.",
    audience: "Estudiantes que buscan admisión a la UDG, Tec de Monterrey, UDEM y universidades que aplican la PAA.",
    guarantee: "+150 puntos garantizados sobre tu diagnóstico inicial, o te devolvemos el 100% de tu inversión.",
    priceMXN: 2490,
    sessions: 20,
    exercises: 5000,
    evaluations: 20,
    hours: 60,
    scoreScale: "400-1600",
    skills: [
      { name: "Lectura", detail: "Comprensión de textos literarios, científicos y humanísticos con preguntas basadas en evidencia." },
      { name: "Redacción", detail: "Corrección sintáctica, puntuación y coherencia lógica según el formato oficial." },
      { name: "Matemáticas", detail: "Razonamiento cuantitativo, álgebra, resolución de problemas y geometría con y sin calculadora." },
      { name: "Inglés institucional", detail: "Módulo complementario de vocabulario, gramática y comprensión lectora." },
    ],
    outcomes: [
      "Puntaje competitivo para admisión al Tec de Monterrey y UDEM",
      "Dominio de las 3 áreas nucleares y el módulo complementario",
      "Simulacros cronometrados bajo condiciones reales de aplicación",
      "Estrategia personalizada y técnicas de descarte",
    ],
    features: [
      { title: "Materiales de estudio", detail: "Acceso a bancos de preguntas y reactivos actualizados según la estructura de evaluación de College Board." },
      { title: "Simuladores reales", detail: "Practica con el formato, tiempo y preguntas del examen oficial durante toda tu preparación." },
      { title: "Expertos en el examen", detail: "Preparación especializada para el examen de admisión a la UDG, el Tec de Monterrey y UDEM." },
      { title: "Garantía de puntaje", detail: "Garantizamos +150 puntos sobre el puntaje diagnóstico inicial o te devolvemos el 100% de la inversión." },
    ],
    faqs: [
      { q: "¿Qué incluye el programa de preparación PAA?", a: "Incluye acceso completo a nuestra plataforma de simuladores con preguntas oficiales actualizadas, sesiones individuales en vivo con profesores especializados, material de estudio descargable y reportes de progreso detallados por cada área del examen." },
      { q: "¿Cómo funciona la garantía de puntaje?", a: "Si tras completar tu programa de preparación y los simuladores asignados no logras aumentar al menos 150 puntos respecto a tu puntaje diagnóstico inicial, te devolvemos el 100% de tu inversión. Nuestro compromiso es garantizar un avance tangible en tu desempeño." },
      { q: "¿Con cuánto tiempo de anticipación debo prepararme?", a: "Recomendamos iniciar entre 6 y 10 semanas antes de tu fecha de aplicación oficial en el Tec de Monterrey o UDEM para cubrir todos los temas con calma y realizar al menos 4 simulacros cronometrados completos." },
      { q: "¿Necesito conocimientos avanzados de matemáticas para iniciar?", a: "No. El programa evalúa tu nivel inicial con un examen diagnóstico y parte desde las bases de aritmética y álgebra, enseñándote métodos de resolución rápida, atajos conceptuales y técnicas de descarte." },
    ],
    heroImage: { src: "/images/hero-paa.webp", width: 1262, height: 766 },
    guideImage: "/images/preparacion-paa.webp",
    guaranteeImage: "/images/preparacion-paa-2.webp",
    skillsImage: "/images/domina-paa.webp",
    faqImage: "/images/laptop-paa.webp",
    academicIntro:
      "Asegura tu admisión universitaria. El puntaje del examen PAA es el criterio de selección principal en las universidades públicas y privadas. Nuestro plan de estudio te garantiza el éxito en poco tiempo.",
    examSections: [
      {
        name: "Lectura",
        description:
          "Comprensión profunda de textos literarios, humanísticos y científicos. Preguntas basadas en evidencia, inferencia de ideas centrales y vocabulario en contexto.",
        time: "~45 min",
        scoreRange: "200-800",
        activities: [
          { title: "Comprensión lectora", detail: "Extraer la idea central, inferir conclusiones y reconocer el tono del autor en el texto." },
          { title: "Vocabulario en Contexto", detail: "Deducir el significado preciso de palabras o expresiones en la lectura." },
        ],
      },
      {
        name: "Redacción",
        label: "Redacción Indirecta",
        description:
          "Evalúa tu dominio en la corrección sintáctica, puntuación, uso adecuado de nexos, concordancia y coherencia lógica entre enunciados.",
        time: "~30 min",
        scoreRange: "200 – 800",
        activities: [
          { title: "Estructura y coherencia textual", detail: "Corregir errores de concordancia, seleccionar nexos y mejorar la claridad expositiva." },
          { title: "Normativa y puntuación", detail: "Identificar y subsanar fallas ortográficas, signos de puntuación y sintaxis en español." },
        ],
      },
      {
        name: "Matemáticas",
        label: "Razonamiento Cuantitativo",
        description:
          "Evalúa razonamiento cuantitativo, álgebra, resolución de problemas prácticos, geometría y análisis e interpretación de datos, con y sin calculadora.",
        time: "~55 min",
        scoreRange: "200 – 800",
        activities: [
          { title: "Álgebra y resolución de problemas", detail: "Resolver ecuaciones, sistemas lineales, razones, proporciones y situaciones prácticas." },
          { title: "Geometría y análisis de datos", detail: "Interpretar tablas, gráficas estadísticas y aplicar propiedades geométricas fundamentales." },
        ],
      },
      {
        name: "Inglés",
        label: "Módulo Complementario",
        description:
          "Evalúa el uso de la lengua y comprensión lectora en inglés según los requerimientos de ingreso de carreras o facultades específicas.",
        time: "~45 min",
        scoreRange: "200 – 800 (Complementario)",
        activities: [
          { title: "Uso de la lengua", detail: "Completar enunciados aplicando estructuras gramaticales y vocabulario adecuado." },
          { title: "Comprensión de lectura", detail: "Responder preguntas sobre la idea principal y el propósito en textos breves en inglés." },
        ],
      },
    ],
    comparison: [
      { label: "Formato de clases", pa: "Clases individuales 1 a 1 en vivo", trad: "Grupos numerosos" },
      { label: "Plataforma de práctica", pa: "+5,000 reactivos y simuladores reales", trad: "Cuadernillos limitados" },
      { label: "Garantía de puntaje", pa: "+100 puntos garantizados", trad: "Sin garantía" },
      { label: "Simuladores College Board", pa: "Evaluaciones cronometradas incluidas", trad: "Cobro adicional" },
      { label: "Horarios y ritmo", pa: "Flexibilidad total personalizada", trad: "Horarios rígidos" },
    ],
    benefits: [
      "Clases 1 a 1 en vivo con profesores expertos",
      "Simuladores oficiales idénticos a la PAA del College Board",
      "Plan de estudio adaptado a tus fortalezas y debilidades",
      "+100 puntos garantizados sobre tu diagnóstico inicial",
    ],
  },
];

export const getProgram = (slug: string) =>
  PROGRAMS.find((p) => p.slug === slug);
