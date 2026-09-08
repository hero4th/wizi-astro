# Professional Academy MX

![Home](./capture.png)

> Sitio desarrollado por Leandro Marquez para Professional Academy MX

Plataforma web de preparación para exámenes estandarizados internacionales (TOEFL iBT, SAT, GRE, GMAT, PAA). 
Optimizada para SEO, rendimiento de carga y generación de leads.

---

## Características Principales

- Rendimiento: Generación estática (SSG) mediante Astro 5.
- Interactividad: Componentes de React 19 implementados bajo demanda.
- Diseño: Tailwind CSS v4 para estilos globales y utilidades.
- Motion: Animaciones de scroll mediante GSAP y Lenis.
- Contenido: Sistema de blog con MDX y Content Collections con tipado estricto.
- Leads: Formulario integrado con validación y redirección a WhatsApp.

## Stack Tecnológico

- Framework Core: Astro 5 (Adaptador Vercel)
- UI: React 19
- Estilos: Tailwind CSS v4
- Animaciones: GSAP, Lenis, Framer Motion
- Componentes interactivos: Swiper, Tiptap
- Base de Datos y Storage: Neon Database Serverless (PostgreSQL) + Vercel Blob

## Estructura del Proyecto

El código fuente se encuentra en el directorio `src/`:

```text
src/
├── components/      Componentes UI reutilizables
│   └── home/        Componentes de la página principal
├── content/         Colecciones de contenido
│   └── blog/        Entradas en formato MDX
├── data/            Datos estáticos (FAQs, programas, testimonios)
├── layouts/         Estructura base (SEO, Header, Footer)
├── lib/             Lógica utilitaria y esquemas (JSON-LD)
├── pages/           Rutas de la aplicación
├── scripts/         Scripts globales del cliente (GSAP/Lenis)
└── styles/          Tokens de diseño y CSS global
```

## Desarrollo Local

Requisitos: Node.js (v18+) y npm (v9+).

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/NewtonSupreme/Proacademy-astro.git
   cd Proacademy-astro
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Levantar entorno de desarrollo (`localhost:4321`):
   ```bash
   npm run dev
   ```

4. Compilar código para producción:
   ```bash
   npm run build
   ```

## Sistema de Animaciones

Sistema declarativo basado en atributos de datos (`data-*`):

- `data-reveal`: Fade-in ascendente.
- `data-reveal-line`: Revelado secuencial por líneas.
- `data-counter="100"`: Animación de incremento numérico.
- `data-parallax="-80"`: Desplazamiento parallax en scroll.
- `data-magnetic`: Atracción del elemento hacia el cursor.

Las animaciones se desactivan si el usuario tiene `prefers-reduced-motion` activado a nivel de sistema operativo.

## SEO y Analytics

- El componente `SEO.astro` gestiona etiquetas canónicas, OpenGraph y esquemas JSON-LD.
- Generación nativa de `sitemap.xml` y `robots.txt`.
- Analytics condicionado al entorno de producción (requiere `PUBLIC_GTM_ID`, `PUBLIC_GA4_ID`, `PUBLIC_CLARITY_ID`, `PUBLIC_META_PIXEL_ID`).
- DataLayer integrado para disparar eventos de conversión en el formulario principal.

## Despliegue

Despliegue configurado para Vercel. `vercel.json` autoconfigura cabeceras de seguridad HTTP y políticas de caché para los recursos compilados.
