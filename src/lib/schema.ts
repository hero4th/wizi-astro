import { SITE } from "@/data/site";
import type { Program } from "@/data/programs";

const ORG_ID = `${SITE.url}/#organization`;

export function organizationSchema() {
  return {
    "@type": ["Organization", "EducationalOrganization"],
    "@id": ORG_ID,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    logo: `${SITE.url}/logo.svg`,
    description: SITE.description,
    telephone: SITE.phone,
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.state,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.country,
    },
    sameAs: Object.values(SITE.social),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "320",
      bestRating: "5",
    },
  };
}

export function localBusinessSchema() {
  return {
    "@type": "LocalBusiness",
    "@id": `${SITE.url}/#localbusiness`,
    name: SITE.name,
    image: `${SITE.url}/og-default.png`,
    url: SITE.url,
    telephone: SITE.phone,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.address.street,
      addressLocality: SITE.address.city,
      addressRegion: SITE.address.state,
      postalCode: SITE.address.postalCode,
      addressCountry: SITE.address.country,
    },
    parentOrganization: { "@id": ORG_ID },
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    inLanguage: "es-MX",
    publisher: { "@id": ORG_ID },
  };
}

export function courseSchema(program: Program) {
  return {
    "@type": "Course",
    "@id": `${SITE.url}/cursos/${program.slug}/#course`,
    name: `Curso ${program.exam} | ${SITE.name}`,
    description: program.description,
    url: `${SITE.url}/cursos/${program.slug}`,
    provider: { "@id": ORG_ID },
    inLanguage: "es-MX",
    offers: {
      "@type": "Offer",
      price: program.priceMXN,
      priceCurrency: "MXN",
      availability: "https://schema.org/InStock",
      url: `${SITE.url}/cursos/${program.slug}`,
      category: "Paid",
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: `PT${program.hours}H`,
      instructor: {
        "@type": "Person",
        name: `Tutores certificados ${program.exam}`,
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "120",
      bestRating: "5",
    },
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function articleSchema(opts: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  author?: string;
}) {
  const url = normalizeUrl(opts.url);
  const image = opts.image
    ? new URL(opts.image, SITE.url).href
    : `${SITE.url}/og-default.png`;

  return {
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    url,
    inLanguage: "es-MX",
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    image,
    author: opts.author && opts.author !== SITE.name
      ? { "@type": "Person", name: opts.author }
      : { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}

/** Absolute, slash-free URL for schema nodes. */
function normalizeUrl(value: string): string {
  const url = new URL(value, SITE.url);
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  return url.href;
}

/** Wrap one or more schema nodes in a @graph JSON-LD document. */
export function jsonLd(...nodes: object[]) {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nodes });
}
