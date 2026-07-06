export interface Testimonial {
  name: string;
  program: string;
  score: string;
  quote: string;
  /** Versión extendida que se muestra en el modal (opcional). */
  fullQuote?: string;
  initials: string;
  image: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Sandra Rosales",
    program: "TOEFL iBT",
    score: "108 / 120",
    initials: "SR",
    image: "/images/testimonials/sandra-rosales.webp",
    quote:
      "Logré subir mis puntos mucho más de lo que esperaba. Gracias a Professional Academy conseguí mi certificado y accedí a la universidad de mis sueños.",
    fullQuote:
      "Logré subir mis puntos mucho más de lo que esperaba. Gracias a Professional Academy conseguí mi certificado y accedí a la universidad de mis sueños.\n\nEn el posgrado al que quiero aplicar me dijeron que mi puntaje cuantitativo está por arriba del promedio de los admitidos, y mi puntaje verbal no está nada mal considerando que no soy nativo del inglés. Se ve muy bien el panorama; les aviso en febrero o marzo cuando me den una resolución.\n\nTe mando un fuerte abrazo y les deseo éxito en todo lo que hagan. ¡Muchas gracias por todo!",
  },
  {
    name: "Miguel Montero",
    program: "TOEFL iBT",
    score: "+60 pts en 2 meses",
    initials: "MM",
    image: "/images/testimonials/miguel-montero.webp",
    quote:
      "Nunca pensé que subir 50 puntos en el TOEFL iBT fuera posible. Professional Academy logró que subiera más de 60 puntos en apenas dos meses.",
  },
  {
    name: "Elena García",
    program: "TOEFL iBT",
    score: "95 / 120",
    initials: "EG",
    image: "/images/testimonials/elena-garcia.webp",
    quote:
      "Me ayudaron a alcanzar un excelente puntaje de 95 en el TOEFL iBT. La estructura del curso es increíble y los profesores son de primera calidad.",
  },
  {
    name: "David Torres",
    program: "GRE",
    score: "+40 pts",
    initials: "DT",
    image: "/images/testimonials/david-torres.webp",
    quote:
      "Un excelente servicio. Me permitió ganar más de 40 puntos. La ayuda de los tutores fue crucial para lograr la admisión a mi posgrado.",
  },
  {
    name: "Lorenzo Mendoza",
    program: "GRE",
    score: "328 / 340",
    initials: "LM",
    image: "/images/testimonials/lorenzo-mendoza.webp",
    quote:
      "La cobertura del temario es completa, con dominio de los conocimientos y excelente trato por parte del profesor. Buenísimos recursos oficiales.",
  },
  {
    name: "Florencia Zermeño",
    program: "GRE",
    score: "Quant 165",
    initials: "FZ",
    image: "/images/testimonials/florencia-zermeno.webp",
    quote:
      "Es un programa ambicioso: te obliga a tomar el tiempo suficiente para trazar tareas y propuesta a fondo. Formas hábitos de estudio y aprendes a manejar tu tiempo y el estrés.",
  },
  {
    name: "Farah Nájar",
    program: "GMAT",
    score: "675 Focus",
    initials: "FN",
    image: "/images/testimonials/farah-najar.webp",
    quote:
      "Está pensado para personas que trabajan. Tener la mente de hacer buena puntuación, busca tu convergencia entre lo que sabes y lo que necesitas aprender.",
  },
  {
    name: "Diego Aliendi",
    program: "SAT",
    score: "1480 / 1600",
    initials: "DA",
    image: "/images/testimonials/diego-aliendi.webp",
    quote:
      "Mi tutor fue muy buen maestro y a la vez muy exigente: el profesor sabe explicar bien y tiene la paciencia necesaria para que entiendas cada tipo de pregunta.",
  },
];
