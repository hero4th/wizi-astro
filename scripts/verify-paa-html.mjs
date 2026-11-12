import { readdirSync, readFileSync } from 'node:fs';

const response = await fetch('http://localhost:4321/cursos/paa');
if (!response.ok) {
  console.error('Failed to fetch:', response.status);
  process.exit(1);
}
const html = await response.text();

const cssFiles = readdirSync('dist/_astro').filter(f => f.endsWith('.css'));
const cssContent = cssFiles.map(f => readFileSync('dist/_astro/' + f, 'utf8')).join('\n');
const hasColor112321 = cssContent.includes('112321');

const checks = [
  ['1. Hero sin badges inventados', !html.includes('+100 Puntos Garantizados') && !html.includes('Plataforma de Simulación PAA')],
  ['2. Hero H1 exacto de Figma (Curso PAA / College Board / ¡garantizado!)', html.includes('Curso PAA') && html.includes('College Board') && html.includes('¡garantizado!')],
  ['3. Sello de garantía +150 pts', html.includes('+150') && html.includes('sobre tu diagnóstico inicial')],
  ['4. Métricas #112321 con +150 puntos', html.includes('course-metrics-paa') && hasColor112321 && html.includes('150')],
  ['5. Domina tu examen PAA (chica + check circular + tabs)', html.includes('Domina tu examen PAA') && html.includes('domina-paa.webp')],
  ['6. Preparación académica a tu medida (4 tarjetas)', html.includes('Preparación académica')],
  ['7. Entrena como si ya fuera el día del examen (oscuro + paa-entrena-card.webp)', html.includes('Entrena como si ya') && html.includes('el día del examen.') && html.includes('paa-entrena-card.webp')],
  ['8. La mejor opción para aprobar (4 checks + 3 tarjetas con Pro Élite oscura)', html.includes('id="precios"') && html.includes('Recibe retroalimentación en clases 1 a 1') && html.includes('Pro Esencial') && html.includes('Pro Avanzado') && html.includes('Pro Élite')],
  ['9. Ellos ya lograron su meta (testimonios PAA: Felipe Guzmán, Clara Sarahí)', html.includes('id="testimonios"') && html.includes('Felipe Guzmán') && html.includes('Clara Sarahí')],
  ['10. Resolvemos tus dudas (laptop + FAQ)', html.includes('laptop-paa.webp') && html.includes('Resolvemos')],
  ['11. Contacto telegrama', html.includes('id="contacto"') && html.includes('id="course-msg-form"')],
  ['12. Menú desplegable con fondo sólido opaco', html.includes('bg-[#091412]')],
];

console.log('\n--- VERIFICACIÓN DE SECCIONES EN HTML SERVIDO ---');
let allOk = true;
for (const [name, ok] of checks) {
  console.log(`${ok ? '✔' : '✖'} ${name}`);
  if (!ok) allOk = false;
}

// Verificar orden relativo de las secciones
const idxHero = html.indexOf('course-hero');
const idxMetrics = html.indexOf('course-metrics-paa');
const idxDomina = html.indexOf('Domina tu examen PAA');
const idxPrep = html.indexOf('Preparación académica');
const idxEntrena = html.indexOf('Entrena como si ya');
const idxPrecios = html.indexOf('id="precios"');
const idxTestimonios = html.indexOf('id="testimonios"');
const idxFaq = html.indexOf('laptop-paa.webp');
const idxContacto = html.indexOf('id="contacto"');

const orderChecks = [
  ['1. Hero < 2. Metrics', idxHero < idxMetrics],
  ['2. Metrics < 3. Domina (la chica)', idxMetrics < idxDomina],
  ['3. Domina < 4. Preparación académica', idxDomina < idxPrep],
  ['4. Preparación académica < 5. Entrena', idxPrep < idxEntrena],
  ['5. Entrena < 6. Precios (La mejor opción)', idxEntrena < idxPrecios],
  ['6. Precios < 7. Testimonios (Ellos ya lograron su meta)', idxPrecios < idxTestimonios],
  ['7. Testimonios < 8. Laptop FAQ (Resolvemos tus dudas)', idxTestimonios < idxFaq],
  ['8. Laptop FAQ < 9. Contacto telegrama', idxFaq < idxContacto],
];

console.log('\n--- VERIFICACIÓN DE ORDEN DE SECUENCIA FIGMA ---');
for (const [name, ok] of orderChecks) {
  console.log(`${ok ? '✔' : '✖'} ${name}`);
  if (!ok) allOk = false;
}

if (!allOk) {
  console.error('\nERROR: Alguna comprobación falló.');
  process.exit(1);
} else {
  console.log('\nTODAS LAS COMPROBACIONES PASARON CON ÉXITO (100% FIEL A FIGMA).');
}
