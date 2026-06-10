export interface FAQ {
  q: string;
  a: string;
  category: string;
}

export const FAQS: FAQ[] = [
  {
    category: "General",
    q: "¿Qué es Professional Academy?",
    a: "Somos una academia mexicana especializada en la preparación para exámenes de admisión y certificación, como TOEFL iBT, SAT, PAA, GMAT y GRE. Además, ofrecemos clases personalizadas y una Garantía de Satisfacción Total.",
  },
  {
    category: "General",
    q: "¿Puedo tomar las clases en línea?",
    a: "Sí, todos nuestros programas se imparten 100% en línea con sesiones en vivo. También tienes acceso a las grabaciones en HD de cada clase para repasar cuando quieras.",
  },
  {
    category: "General",
    q: "¿Qué exámenes preparan?",
    a: "Preparamos TOEFL iBT, SAT, GRE, GMAT y PAA (Prueba de Aptitud Académica del College Board), cada uno con un programa especializado y tutores expertos en ese examen.",
  },
  {
    category: "Cursos y metodología",
    q: "¿Las clases son individuales o grupales?",
    a: "Nuestro modelo principal es de tutorías 1 a 1 totalmente personalizadas. También ofrecemos modalidades de grupo reducido si prefieres aprender acompañado.",
  },
  {
    category: "Cursos y metodología",
    q: "¿Puedo elegir mis horarios?",
    a: "Sí, tú defines tu horario. Construimos un plan de estudio flexible alrededor de tu disponibilidad, incluyendo tardes y fines de semana.",
  },
  {
    category: "Cursos y metodología",
    q: "¿Cuánto dura el curso?",
    a: "Depende del examen y de tu meta de puntaje: en promedio entre 8 y 14 semanas, con 36 a 40 sesiones de clase y 6 evaluaciones completas.",
  },
  {
    category: "Cursos y metodología",
    q: "¿Qué nivel necesito para empezar?",
    a: "Ninguno en particular. Iniciamos con un diagnóstico gratuito que define tu punto de partida exacto, y el plan de estudio se adapta a tu nivel actual.",
  },
  {
    category: "Garantía",
    q: "¿En qué consiste la Garantía de Satisfacción Total?",
    a: "Es nuestro compromiso con tu resultado: si completas el curso y no alcanzas el aumento mínimo de puntaje garantizado, te devolvemos el 100% de tu inversión.",
  },
  {
    category: "Garantía",
    q: "¿Qué pasa si no alcanzo mi puntaje objetivo?",
    a: "Si cumpliste con el programa y no lograste el incremento garantizado, aplicamos la devolución total. Alternativamente, puedes optar por extender tu preparación sin costo.",
  },
  {
    category: "Pagos y precios",
    q: "¿Puedo pagar a plazos?",
    a: "Por supuesto, ofrecemos diversas opciones de pago a meses, con y sin tarjeta de crédito, para que te prepares sin preocupaciones financieras.",
  },
  {
    category: "Pagos y precios",
    q: "¿Ofrecen una evaluación gratis?",
    a: "Sí, tu primera sesión de diagnóstico es gratuita. En ella medimos tu nivel actual, definimos tu meta y te entregamos un plan de preparación personalizado.",
  },
  {
    category: "Plataforma y clases",
    q: "¿Cómo funcionan los simuladores?",
    a: "Nuestros simuladores replican el formato, el tiempo y el tipo de preguntas del examen oficial. Después de cada simulacro recibes un reporte detallado por sección y tipo de pregunta.",
  },
  {
    category: "Plataforma y clases",
    q: "¿Tengo acceso a material grabado?",
    a: "Sí, todas tus sesiones quedan grabadas en HD y disponibles en tu plataforma durante toda la duración del curso.",
  },
  {
    category: "Plataforma y clases",
    q: "¿Cómo recibo retroalimentación?",
    a: "Después de cada simulacro y tarea, tu tutor te entrega retroalimentación individual por escrito y en sesión 1 a 1, con un plan de mejora concreto para la siguiente semana.",
  },
];

export const FAQ_CATEGORIES = [...new Set(FAQS.map((f) => f.category))];
