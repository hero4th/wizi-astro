# Professional Academy MX — Plataforma Oficial

![Professional Academy Home](./capture.png)

> **Sitio desarrollado por Leandro Marquez para Professional Academy MX**

Plataforma web moderna, rápida y optimizada para la preparación de exámenes estandarizados internacionales como TOEFL iBT, SAT, GRE, GMAT y PAA. Diseñada con un enfoque en la experiencia de usuario (UX), rendimiento extremo y conversión de leads.

---

## 🚀 Características Principales

- **Rendimiento Extremo**: Construida con Astro 5 para entregar HTML estático hiper-rápido, minimizando el tiempo de carga y maximizando el SEO.
- **Interactividad Inteligente**: Uso de React 19 mediante la arquitectura de *Islas de Astro* únicamente donde es necesario (formularios interactivos).
- **Diseño Premium y Responsive**: Estilizado con Tailwind CSS v4, garantizando una experiencia visual impecable en móviles, tablets y escritorio.
- **Scroll Coreográfico**: Sistema de animaciones declarativas impulsadas por GSAP y Lenis para un *smooth scrolling* inmersivo.
- **Gestión de Contenido (Blog)**: Sistema de blog integrado utilizando MDX y Content Collections, con tipado estricto y validación de frontmatter.
- **Formulario Integrado con WhatsApp**: Captura de leads optimizada que conecta directamente con WhatsApp para ventas inmediatas.

## 🛠️ Stack Tecnológico

El ecosistema de este proyecto utiliza las últimas herramientas del desarrollo web frontend y backend serverless:

- **Framework Core**: [Astro 5](https://astro.build/) (Adaptador Vercel)
- **Componentes UI**: [React 19](https://react.dev/)
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animaciones**: [GSAP](https://gsap.com/) + [Lenis](https://lenis.darkroom.engineering/) + Framer Motion
- **Carruseles**: [Swiper](https://swiperjs.com/)
- **Contenido**: MDX (Markdown + JSX)
- **Base de Datos / Backend**: Neon Database Serverless (PostgreSQL) + Vercel Blob
- **Editor Enriquecido**: Tiptap (para paneles de administración/blog)

## 📁 Estructura del Proyecto

Para facilitar la contribución, el proyecto sigue una arquitectura limpia y modular dentro de la carpeta `src/`:

```text
src/
├── components/      # Componentes UI reutilizables (Botones, Carruseles, Formularios)
│   └── home/        # Componentes específicos de la página de inicio
├── content/         # Colecciones de contenido
│   └── blog/        # Entradas del blog en formato .mdx
├── data/            # Datos estáticos (FAQs, testimonios, información de programas)
├── layouts/         # Envoltorios de páginas (Base.astro maneja SEO, Header, Footer)
├── lib/             # Lógica utilitaria (ej. schema.ts para JSON-LD SEO)
├── pages/           # Enrutamiento basado en archivos (home, cursos, blog, precios)
├── scripts/         # Scripts globales del cliente (ej. motion.ts para GSAP/Lenis)
└── styles/          # Estilos globales y tokens de diseño (global.css)
```

## ⚙️ Instalación y Desarrollo Local

### Requisitos previos
- **Node.js** (v18 o superior)
- **npm** (v9 o superior)

### Pasos para levantar el proyecto

1. **Clonar el repositorio** e ingresar a la carpeta:
   ```bash
   git clone https://github.com/NewtonSupreme/Proacademy-astro.git
   cd Proacademy-astro
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Ejecutar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   *El sitio estará disponible en `http://localhost:4321`*

4. **Compilar para producción**:
   ```bash
   npm run build
   ```

## 🎬 Sistema de Animaciones (Motion)

El proyecto utiliza un sistema de animaciones declarativo. Puedes animar cualquier elemento HTML simplemente agregando atributos de datos (`data-*`):

| Atributo | Efecto Visual |
|----------|---------------|
| `data-reveal` | Aparece con un fade-in y movimiento hacia arriba al entrar en pantalla. |
| `data-reveal-line` | Revela el texto línea por línea (ideal para titulares grandes). |
| `data-counter="100"` | Anima un contador numérico desde 0 hasta el valor especificado. |
| `data-parallax="-80"` | Efecto parallax vertical al hacer scroll. |
| `data-magnetic` | Efecto magnético que atrae el elemento al cursor. |

> **Nota de Accesibilidad:** Si el sistema operativo del usuario tiene activada la preferencia de movimiento reducido (`prefers-reduced-motion`), todas las animaciones se desactivan automáticamente por respeto a la experiencia del usuario.

## 📊 SEO y Analytics

El proyecto está fuertemente optimizado para motores de búsqueda (SEO) y métricas de conversión.

- **SEO Técnico**: `SEO.astro` inyecta dinámicamente etiquetas canónicas, OpenGraph y JSON-LD estructurado (Organization, Course, FAQPage, Article). También incluye `sitemap.xml` y `robots.txt` automáticos.
- **Analytics Gateados**: Los trackers solo se ejecutan en producción si sus variables de entorno están presentes (`PUBLIC_GTM_ID`, `PUBLIC_GA4_ID`, `PUBLIC_CLARITY_ID`, `PUBLIC_META_PIXEL_ID`, etc.).
- **DataLayer**: Formularios y botones críticos emiten eventos (ej. `generate_lead`) al DataLayer de GTM para un seguimiento preciso.

## 🚀 Despliegue (Deploy)

El proyecto está diseñado para ser desplegado sin fricción en **Vercel**:

1. Importa el repositorio en Vercel. Automáticamente detectará que es un proyecto de Astro.
2. Configura las **Variables de Entorno** necesarias (claves de bases de datos, IDs de analytics, etc.).
3. ¡Despliega! El archivo `vercel.json` se encargará automáticamente de asegurar las cabeceras de seguridad HTTP (CSP, HSTS) y las políticas de caché para los recursos estáticos.

---

*Cualquier duda técnica o de arquitectura sobre este repositorio debe ser dirigida a Leandro Marquez, desarrollador principal de la plataforma.*
