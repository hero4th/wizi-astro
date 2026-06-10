export interface Category {
  slug: string;
  label: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { slug: "toefl", label: "TOEFL", description: "Estrategias, recursos y guías para dominar el TOEFL iBT." },
  { slug: "sat", label: "SAT", description: "Todo sobre el Digital SAT: formato, secciones y preparación." },
  { slug: "gre", label: "GRE", description: "Preparación verbal, cuantitativa y de redacción para el GRE." },
  { slug: "gmat", label: "GMAT", description: "GMAT Focus Edition: estrategia y preparación para tu MBA." },
  { slug: "paa", label: "PAA", description: "La Prueba de Aptitud Académica del College Board, explicada." },
  { slug: "consejos-de-estudio", label: "Consejos de estudio", description: "Técnicas de estudio respaldadas por la ciencia del aprendizaje." },
  { slug: "admisiones", label: "Admisiones", description: "Procesos de admisión a universidades de México y el mundo." },
  { slug: "universidades", label: "Universidades", description: "Guías sobre las universidades más demandadas y sus requisitos." },
  { slug: "recursos-gratuitos", label: "Recursos gratuitos", description: "Materiales, herramientas y prácticas sin costo." },
  { slug: "simuladores", label: "Simuladores", description: "Dónde encontrar y cómo aprovechar los simuladores de examen." },
];

export const getCategory = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug);
