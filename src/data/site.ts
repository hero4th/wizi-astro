export const SITE = {
  name: "Professional Academy",
  legalName: "Professional Academy®",
  url: "https://www.proacademymx.com",
  tagline: "Tu examen es solo el comienzo.",
  description:
    "Academia mexicana especializada en preparación para TOEFL iBT, SAT, GRE, GMAT y PAA. Clases 1 a 1, simuladores idénticos al examen real y Garantía de Puntaje de +10 puntos.",
  locale: "es_MX",
  phone: "+52 33 4523 3377",
  phoneDisplay: "(33) 45-23-33-77",
  whatsapp: "523327986275",
  whatsappDisplay: "33 27 98 62 75",
  email: "contacto@proacademymx.com",
  address: {
    street: "Calle Nápoles #2921",
    city: "Guadalajara",
    state: "Jalisco",
    country: "MX",
    postalCode: "44630",
  },
  social: {
    facebook: "https://www.facebook.com/proacademymx",
    instagram: "https://www.instagram.com/proacademymx",
    twitter: "https://www.twitter.com/proacademymx",
  },
  analytics: {
    /** Set real IDs via env vars on Vercel — components no-op when empty. */
    ga4: import.meta.env.PUBLIC_GA4_ID ?? "",
    gtm: import.meta.env.PUBLIC_GTM_ID ?? "",
    clarity: import.meta.env.PUBLIC_CLARITY_ID ?? "",
    metaPixel: import.meta.env.PUBLIC_META_PIXEL_ID ?? "",
    linkedin: import.meta.env.PUBLIC_LINKEDIN_PARTNER_ID ?? "",
  },
} as const;

export const METRICS = [
  { value: 10000, prefix: "+", suffix: "", label: "ingresos en universidades" },
  { value: 94, prefix: "", suffix: "%", label: "alumnos satisfechos" },
  { value: 100, prefix: "+", suffix: " pts", label: "top calificaciones" },
  { value: 4.9, prefix: "", suffix: "/5", label: "valoración promedio", decimals: 1 },
] as const;

export const NAV_LINKS = [
  { label: "Cursos", href: "/cursos", children: [
    { label: "TOEFL iBT", href: "/cursos/toefl-ibt" },
    { label: "SAT", href: "/cursos/sat" },
    { label: "GRE", href: "/cursos/gre" },
    { label: "GMAT", href: "/cursos/gmat" },
    { label: "PAA", href: "/cursos/paa" },
  ]},
  { label: "Testimonios", href: "/testimonios" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/preguntas-frecuentes" },
] as const;
