export interface Testimonial {
  name: string;
  program: string;
  score: string;
  quote: string;
  /** Versión extendida que se muestra en el modal (opcional). */
  fullQuote?: string;
  initials: string;
  image: string;
  hasDetail?: boolean;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Rodrigo Castro",
    program: "General",
    score: "Total: 720",
    initials: "RC",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/03/Rodrigo-Castro.webp",
    quote: "El programa está muy completo, abarca todos los temas del curso. La teoría es sumamente entendible.",
    fullQuote: "<div><p>Te quiero agradecer de nuevo por el curso, fue muy útil. Te paso mis resultados del examen.</p><p><strong>Verbal:</strong> 41<br><strong>Cuantitativo:</strong> 47<br><strong>Total:</strong> 720</p><p>Bueno, también quería platicarte que en el posgrado que yo quiero aplicar, me dijeron que mi puntaje cuantitativo está por arriba del promedio de los admitidos, y mi puntaje verbal no está mal, se toma en cuenta que no soy nativo del inglés, pero estoy arriba incluso de algunos estadounidenses admitidos. Entonces se ve bien el panorama. Ya te avisare en febrero o marzo cuando me den una resolución.</p><p>Te mando un fuerte abrazo, y les deseo éxito en todo lo que hagan. Muchas gracias por todo.</p></div>",
    hasDetail: true
  },
  {
    name: "Florencia Zermeño",
    program: "General",
    score: "",
    initials: "FZ",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/03/Florencia-Zermeno.webp",
    quote: "Es muy buen programa y altamente recomendable, te obliga a formar hábitos de estudio y a manejar tu tiempo, estrés y ego.",
    fullQuote: "<div><p>Es un programa ambicioso ya que te obliga a tomar el tiempo suficiente para hacer tareas y a prepararte profundamente. Las principales cosas que me gustaron es que te obliga a formar hábitos de estudio, aprendes a manejar tu tiempo, el estrés y el ego para contestar la mayor cantidad de preguntas correctamente.</p><p>Otra cosa que me gustó es que está estructurado a tu medida, primero sacan tu puntuación inicial y sobre eso defines tu meta y a dónde quieres llegar junto con las áreas que necesitas cubrir. El programa incluye todos los materiales que estuvieron muy completos y las horas de clases muy bien aprovechadas, además de que el profesor tiene mucha disposición a resolver tus dudas y tus preguntas dentro y fuera de la clase, está muy bien preparado y es muy muy paciente.</p><p><strong>Sugerencia:</strong> Tratar de no tener tantas responsabilidades o bien que no sean tan demandantes al momento de tomar el curso, de esa manera podrán enfocarse al 100% y no fallar con asistencia a su tarea que son muy importantes para su puntuación final.</p><p>Es muy buen programa y altamente recomendable.</p></div>",
    hasDetail: true
  },
  {
    name: "Carlos Blanchet",
    program: "General",
    score: "",
    initials: "CB",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/03/Carlos-Blanchet.webp",
    quote: "Me gustó mucho que te obliga a tener mucha disciplina sobre todo con los ejercicios.",
    fullQuote: "<div><p>Me gustó mucho que te obliga a tener mucha disciplina sobre todo con los ejercicios, los materiales disponibles son muchísimos y las estrategias y trucos para atacar las diferentes secciones del examen son muy claras e indispensables porque no podrías descubrirlas estudiando tú solo. Inclusive muchas de las explicaciones que encuentras en internet no son suficientes para entender el problema o las bases teóricas detrás de ellos.</p><p><strong>Mensaje a estudiantes:</strong> Sean perseverantes y pacientes con ustedes mismos, aunque algo sea difícil el profesor está en toda la disponibilidad de explicártelo con peras y manzanas y el 98% de las veces hace que entiendas, sólo pregunta.</p></div>",
    hasDetail: true
  },
  {
    name: "Farah Najar",
    program: "General",
    score: "",
    initials: "FN",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/03/Farah-Najar.webp",
    quote: "Pensado para las personas que trabajan, busca la convergencia entre lo que sabes y lo que necesitas aprender.",
    fullQuote: "<div><p>Pues el programa está muy bien, está pensado para las personas que trabajan y tienen la meta de sacar buena puntuación en el examen, entonces busca la convergencia entre lo que sabes y lo que necesitas aprender, puedes enfocarte únicamente en las áreas que quieres mejorar.</p><p>Me gustaron mucho los temas y las explicaciones de los problemas, además de que es personalizado y se adapta a los horarios que cada quien tiene, con horarios flexibles y aún así siempre el profesor es muy puntual.</p><p><strong>Sugerencia:</strong> Tomar en cuenta el tiempo requerido fuera de las horas del curso para prepararte, no hacer todo a quemarropa, que definas qué puedes hacer desde un principio y conozcas tus puntos débiles.</p></div>",
    hasDetail: true
  },
  {
    name: "David Rincón",
    program: "TOEFL IBT",
    score: "79 -> 108 (+29)",
    initials: "DR",
    image: "https://cms.proacademymx.com/wp-content/uploads/2018/06/toefl_ibt_guadalajara-1.webp",
    quote: "Muy completo, bastante personalizado y con buen seguimiento. Un programa estructurado, exigente, efectivo, actualizado y completo.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Muy completo, bastante personalizado y con buen seguimiento. Un programa estructurado, exigente, efectivo, actualizado y completo.</p><h4>Mensaje a futuros estudiantes</h4><p>Para mejorar la clave es hacer muchos ejercicios y familiarizarse con el examen.</p></div>",
    hasDetail: true
  },
  {
    name: "Tania Acosta",
    program: "TOEFL IBT",
    score: "78 -> 99 (+21)",
    initials: "TA",
    image: "https://cms.proacademymx.com/wp-content/uploads/2026/03/toefl_ibt_guadalajara.png-2.webp",
    quote: "El curso de TOEFL IBT me ayudó a alcanzar el puntaje que requería y a superarlo. Gracias por su disposición a contestar todas mis dudas.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>El curso de TOEFL IBT me ayudó a alcanzar el puntaje que requería y a superarlo. Gracias por su disposición a contestar todas mis dudas siempre. ¡Recomiendo este curso ampliamente!</p><h4>Mensaje a futuros estudiantes</h4><p>Mi mensaje a nuevos estudiantes es que sean perseverantes y pacientes con ustedes mismos, aunque algo sea difícil el profesor está en toda la disposición de explicártelo una y otra vez y el 98% de las veces hace que entiendas, sólo pregunta.</p></div>",
    hasDetail: true
  },
  {
    name: "Santiago González",
    program: "TOEFL IBT",
    score: "96 -> 110 (+14)",
    initials: "SG",
    image: "https://cms.proacademymx.com/wp-content/uploads/2018/06/hombre_toefl_guadalajara.webp",
    quote: "Muy recomendable. Los salones están muy bien equipados y tienen todo el material que necesitas. Los maestros están muy bien preparados.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Muy recomendable. Los salones están muy bien equipados y tienen todo el material que necesitas. Los maestros están muy bien preparados y siempre dispuestos a aclarar las dudas. ¡Muy buena ubicación!</p><h4>Mensaje a futuros estudiantes</h4><p>Como consejo a nuevos alumnos el profesor fomenta la comprensión antes que el macheteo y te obliga a hacer tareas aún cuando estás bajo presión, dos características fundamentales para el examen, hazle caso.</p></div>",
    hasDetail: true
  },
  {
    name: "Elisa García",
    program: "TOEFL IBT",
    score: "91 -> 108 (+17)",
    initials: "EG",
    image: "https://cms.proacademymx.com/wp-content/uploads/2026/03/toefl_ibt_guadalajara.png-1.webp",
    quote: "El curso de preparación me permitió adquirir claves para entender las distintas secciones del test. Las clases son completamente en inglés.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>El curso de preparación del TOEFL IBT de ProAcademy me permitió adquirir claves para entender las distintas secciones del test: listening, writing, speaking and reading. Las clases son completamente en inglés, lo que me ayudó a familiarizarme mucho más con el idioma.</p><h4>Mensaje a futuros estudiantes</h4><p>Hagan autoevaluaciones en casa para sólo invertir el tiempo valioso en las dudas que son realmente difíciles de responder.</p></div>",
    hasDetail: true
  },
  {
    name: "Manuel Guerrero",
    program: "TOEFL IBT",
    score: "102 -> 114 (+12)",
    initials: "MG",
    image: "https://cms.proacademymx.com/wp-content/uploads/2018/06/toefl_pro_testimonio.webp",
    quote: "Valoro la capacidad de entender el nivel que cada uno de la clase tenía y potenciarlo. Quedó demostrado al subir más de 10 puntos en 20 hrs.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Creo que uno de los aspectos que más valoro del profesor de Pro Academy, fue su capacidad de entender el nivel que cada uno de la clase tenía y potenciarlo. Eso quedó demostrado al subir en sólo 20 horas de clases más de 10 puntos en los resultados del test. Además, cabe destacar su puntualidad y profesionalismo.</p><h4>Mensaje a futuros estudiantes</h4><p>Quiero sugerirle a futuros estudiantes que se apliquen al 100%, hagan los más ejercicios posibles apuntando todas las dudas que tengan.</p></div>",
    hasDetail: true
  },
  {
    name: "Fer Ojeda",
    program: "TOEFL IBT",
    score: "92 -> 110 (+18)",
    initials: "FO",
    image: "https://cms.proacademymx.com/wp-content/uploads/2018/06/proacademy_foto_toefl.webp",
    quote: "El programa es práctico, intuitivo, bien estructurado y el material es muy bueno, las clases y profesores fueron de muy buena calidad.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>El programa es práctico, intuitivo, bien estructurado y el material es muy bueno, las clases y los profesores que tuve fueron de muy buena calidad. Quede gratamente sorprendida de que me ayudaran de muy buena manera. Cumpliendo con los horarios y con mis requerimientos como alumna.</p><h4>Mensaje a futuros estudiantes</h4><p>Cómo consejos a nuevos estudiantes que practiquen mucho, hagan muchos ejercicios y confío en que con este curso, esfuerzo y perseverancia pueden lograr una excelente puntuación.</p></div>",
    hasDetail: true
  },
  {
    name: "Luis Castillo",
    program: "TOEFL IBT",
    score: "83 -> 98 (+15)",
    initials: "LC",
    image: "https://cms.proacademymx.com/wp-content/uploads/2018/06/proacademy_review_toefl.webp",
    quote: "Excelente, si bien mi nivel era básico, en 2 meses pude responder y entender el contexto de las conversaciones, y realizar el examen bien.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Excelente, tomé el curso porque necesitaba hacer el TOEFL IBT, y si bien mi nivel era básico, en 2 meses pude responder y entender el contexto de las conversaciones, y pude realizar el examen muy bien preparado y sin problemas de comprensión.</p><h4>Mensaje a futuros estudiantes</h4><p>Que hagan los ejercicios y le dediquen el tiempo al estudio y pregunten mucho mucho.</p></div>",
    hasDetail: true
  },
  {
    name: "Miguel Romo",
    program: "TOEFL IBT",
    score: "81 -> 91 (+10)",
    initials: "MR",
    image: "https://cms.proacademymx.com/wp-content/uploads/2018/06/review_toefl_ibt.webp",
    quote: "Personalmente me sirvió mucho para entender cómo abordar el examen, comprender y reconocer los tipos de pregunta en cada sección.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Buen material de estudio, tanto teórico como práctico. Personalmente me sirvió mucho para entender cómo abordar el examen, es decir, comprender y reconocer los tipos de pregunta en cada sección, identificar lo que se espera de mi en cada respuesta, aprender a ordenar mis ideas, ser eficiente en el manejo el tiempo. Pude obtener el resultado que quería.</p><h4>Mensaje a futuros estudiantes</h4><p>Que hagan los ejercicios y le dediquen el tiempo al estudio y pregunten mucho mucho.</p></div>",
    hasDetail: true
  },
  {
    name: "Felipe Guzmán",
    program: "PAA",
    score: "79 -> 95 (+16)",
    initials: "FG",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/05/SAT-Felipe-Guzman.webp",
    quote: "Es muy buen curso, cubre todas las áreas del examen y sirve mucho el Study Club. Siempre busca mejorar en las áreas que más lo necesitas.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Es muy buen curso, cubre todas las áreas del examen y sirve mucho el Study Club. Siempre busca mejorar en las áreas que más lo necesitas, recomendaría el curso totalmente.</p><h4>Mensaje a futuros estudiantes</h4><p>Pónganse un horario para practicar y estudiar, por lo menos una hora diaria, no importa si hayas ido a clase o no.</p></div>",
    hasDetail: true
  },
  {
    name: "Clara Sarahí",
    program: "PAA",
    score: "80 -> 91 (+11)",
    initials: "CS",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/05/SAT-Clara-Sarahi.webp",
    quote: "Excelente curso de preparación y búsqueda de resultados óptimos para el alumno. El maestro está excelentemente capacitado.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Excelente curso de preparación y búsqueda de resultados óptimos para el alumno, muy recomendable. El maestro está excelentemente capacitado, te da seguimiento continuo, el material es tal cual lo que ves en el examen. Te da mucha accesibilidad de horarios y mucha claridad en el programa.</p><h4>Mensaje a futuros estudiantes</h4><p>Estudien demasiado y reconozcan sus áreas de oportunidad y la refuercen.</p></div>",
    hasDetail: true
  },
  {
    name: "Cristina Magallanes",
    program: "PAA",
    score: "82 -> 92 (+10)",
    initials: "CM",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/05/SAT-Cristina-Magallanes.webp",
    quote: "Muy completo, explicaciones claras y muy buenos tips. El programa es personalizado, flexible, totalmente en inglés con mucha variedad.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Muy completo, explicaciones claras y muy buenos tips. El programa es personalizado, flexible, totalmente en inglés con mucha variedad de ejercicios y muchos feedbacks.</p><h4>Mensaje a futuros estudiantes</h4><p>Mejoren su lógica y sean muy buenos con los números, también traten de leer libros en inglés.</p></div>",
    hasDetail: true
  },
  {
    name: "Juan Rodríguez",
    program: "PAA",
    score: "61 -> 89 (+28)",
    initials: "JR",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/05/SAT-Juan-Rodriguez.webp",
    quote: "Las técnicas para hacer el examen más fácil son importantes porque posiblemente no podrías descubrirlas estudiando tú solo.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Las técnicas para hacer el examen más fácil son importantes porque posiblemente no podrías descubrirlas estudiando tú solo. Me gusta que la disciplina te obliga hacer los ejercicios y sirve la medición de los resultados para saber en que estas fallando. Las técnicas y trucos para atacar el examen son lo que mas me ayudo.</p><h4>Mensaje a futuros estudiantes</h4><p>Aprovechen la ayuda del maestro, se que estudiar mucho es lo único que funciona en este caso, pero con ayuda se vuelve mucho más fácil.</p></div>",
    hasDetail: true
  },
  {
    name: "Julián Quintero",
    program: "PAA",
    score: "63 -> 87 (+24)",
    initials: "JQ",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/05/SAT-Julian-Quintero.webp",
    quote: "Me gusta mucho que se resuelvan todas las cuestiones teóricas a la par con los ejercicios y hay disponibilidad de horarios.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Me gusta mucho que se resuelvan todas las cuestiones teóricas a la par con los ejercicios y hay disponibilidad de horarios. La calidad de los ejercicios, son ejercicios de exámenes pasados y son muchos, no te tienes que preocupar por el material.</p><h4>Mensaje a futuros estudiantes</h4><p>Que tomen el curso y tengan mucha disciplina y estudien mucho.</p></div>",
    hasDetail: true
  },
  {
    name: "Diego Alberdi",
    program: "GRE",
    score: "139 -> 153 (+14)",
    initials: "DA",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/05/GRE-Diego.webp",
    quote: "Creo que es muy buen curso de preparación para un examen profesional. El temario está muy completo y las prácticas son buenas.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Creo que es muy buen curso de preparación para un examen profesional. El temario está muy completo y las prácticas son buenas. La ubicación muy céntrica y el lugar es bonito. Da acceso a muy buen material y a muchos ejercicios, el profesor sabe explicar bien y tiene la paciencia necesaria para que entienda.</p><h4>Mensaje a futuros estudiantes</h4><p>Tómense el tiempo necesario para estudiar y para comenzar el curso con anticipación.</p></div>",
    hasDetail: true
  },
  {
    name: "Lorenzo Mendoza",
    program: "GRE",
    score: "150 -> 162 (+12)",
    initials: "LM",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/05/GRE-Lorenzo-Mendoza.webp",
    quote: "En general es muy bueno la dinámica uno a uno es muy eficaz para los que avanzan rápido puedan mantener ese ritmo.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>En general es muy bueno la dinámica uno a uno es muy eficaz para los que avanzan rápido puedan mantener ese ritmo, es muy destacable que el asesor se una a este ritmo y no se detenga en detalles innecesarios. La cobertura del temario es completa, gran dominio de los conocimientos y excelente trato por parte del profesor.</p><h4>Mensaje a futuros estudiantes</h4><p>Hagan la mayor cantidad de tareas y ejercicios que puedan para que aprovechen al máximo todo el conocimiento y capacidad del profesor.</p></div>",
    hasDetail: true
  },
  {
    name: "Juliet Gallegos",
    program: "GRE",
    score: "142 -> 152 (+10)",
    initials: "JG",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/05/GRE-Juliet-Gallegos.webp",
    quote: "Muy completo que abarca todos los temas y secciones del examen, en especial la paciencia del profesor, flexibilidad de horarios.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Muy completo que abarca todos los temas y secciones del examen, en especial la paciencia del profesor, flexibilidad de horarios, muy buena organización, y espacios ideales para el estudio.</p><h4>Mensaje a futuros estudiantes</h4><p>Prepárense como mínimo con un mes de anticipación.</p></div>",
    hasDetail: true
  },
  {
    name: "Hiram Torres",
    program: "GRE",
    score: "147 -> 159 (+12)",
    initials: "HT",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/05/GRE-Hiram-Rayo-Torres.webp",
    quote: "Se encuentra estructurado de forma clara y lógica, los materiales de apoyo son claros de tal forma que son fáciles de comprender.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Se encuentra estructurado de forma clara y lógica, los materiales de apoyo son claros de tal forma que son fáciles de comprender para el lector. Cosas positivas que identifique: buen material teórico, buena cantidad ejercicios, buen maestro, y buena disposición de fuentes de consulta.</p><h4>Mensaje a futuros estudiantes</h4><p>Hacer siempre la tarea y hacer muchos ejercicios tipo examen, tomar el curso con suficiente disponibilidad de tiempo.</p></div>",
    hasDetail: true
  },
  {
    name: "Yamil Rodríguez",
    program: "GMAT",
    score: "470 -> 690 (+220)",
    initials: "YR",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/04/GMAT-Yamil.webp",
    quote: "Muy completo, bastante personalizado y con buen seguimiento. Un programa estructurado, exigente, efectivo, actualizado y completo.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Muy completo, bastante personalizado y con buen seguimiento. Un programa estructurado, exigente, efectivo, actualizado y completo.</p><h4>Mensaje a futuros estudiantes</h4><p>Para mejorar la clave es hacer muchos ejercicios y familiarizarse con el examen.</p></div>",
    hasDetail: true
  },
  {
    name: "Joaquín Cisneros",
    program: "GMAT",
    score: "380 -> 620 (+240)",
    initials: "JC",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/04/GMAT-Joaquin-Cisneros.webp",
    quote: "El programa 1 on 1 permite tener el 100% de atención del maestro, también permite saber cuál es la mejor manera de ayudarte.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>El programa 1 on 1 permite tener el 100% de atención del maestro, también permite al maestro saber cuál es la mejor manera de ayudarte sin tener que dar una clase estandarizada. El profesor está sumamente preparado aparte de que tiene mucha paciencia. Las clases son dinámicas, hay más práctica que teoría.</p><h4>Mensaje a futuros estudiantes</h4><p>Como consejo a nuevos alumnos el profesor fomenta la comprensión antes que el macheteo y te obliga hacer tareas aún cuando estás bajo presión.</p></div>",
    hasDetail: true
  },
  {
    name: "Adriana Plascencia",
    program: "GMAT",
    score: "260 -> 600 (+340)",
    initials: "AP",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/04/GMAT-Adriana-Plascencia.webp",
    quote: "Es bastante bueno dado que está bien diseñado abordando sólo lo necesario y de manera suficiente para enfocarse en conocimientos.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Es bastante bueno dado que está bien diseñado abordando sólo lo necesario y de manera suficiente para enfocarse en conocimientos necesarios para el examen, las explicaciones del profesor son excelentes. El material es actual, el programa está bien estructurado.</p><h4>Mensaje a futuros estudiantes</h4><p>Hagan autoevaluaciones en casa para sólo invertir el tiempo valioso en las dudas que son realmente difíciles de responder.</p></div>",
    hasDetail: true
  },
  {
    name: "Guillermo Imoff",
    program: "GMAT",
    score: "350 -> 650 (+300)",
    initials: "GI",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/04/GMAT-Juan-Guillermo.webp",
    quote: "Creo que las clases son bastante dinámicas y el modo de distribución de los temas facilita el aprendizaje. Hay muchos ejercicios y tips.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Creo que las clases son bastante dinámicas y el modo de distribución de los temas facilita el aprendizaje. Hay muchos ejercicios y tips aparte del material que te ayudan a contestar los ejercicios más rápido. La flexibilidad para tomar la clase vía online y apoyo en cualquier duda que tengas.</p><h4>Mensaje a futuros estudiantes</h4><p>Quiero sugerirle a futuros estudiantes que se apliquen al 100% hagan los más ejercicios posibles apuntando todas las dudas que tengan.</p></div>",
    hasDetail: true
  },
  {
    name: "Adrián Arce",
    program: "GMAT",
    score: "290 -> 580 (+290)",
    initials: "AA",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/04/GMAT-Adrian-Arce.webp",
    quote: "Las clases fueron muy buenas los métodos me facilitaron la resolución de ejercicios y entendí la base teórica del GMAT.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Las clases fueron muy buenas los métodos me facilitaron la resolución de ejercicios y entendí la base teórica del GMAT. El programa es práctico, intuitivo, bien estructurado y el material es muy bueno, complementa con mucho material de apoyo bien presentado.</p><h4>Mensaje a futuros estudiantes</h4><p>Cómo consejos a nuevos estudiantes que practiquen mucho, hagan muchos ejercicios y confío en que con este curso, esfuerzo y perseverancia pueden lograr una excelente puntuación.</p></div>",
    hasDetail: true
  },
  {
    name: "Marissa Vázquez",
    program: "GMAT",
    score: "610 -> 710 (+100)",
    initials: "MV",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/04/GMAT-Marissa-Vazquez.webp",
    quote: "Excelente, ves toda la teoría a fondo y practicas mucho cada área. Me gustó mucho que son clases particulares y que van a tu propio ritmo.",
    fullQuote: "<div><h4>Opinión del programa</h4><p>Excelente, ves toda la teoría a fondo y practicas mucho cada área. Me gustó mucho que son clases particulares y que van a tu propio ritmo, las explicaciones son muy buenas y claras, te motiva a hacer el trabajo y se enfoca en específicamente tus necesidades.</p><h4>Mensaje a futuros estudiantes</h4><p>Que hagan los ejercicios y le dediquen el tiempo al estudio y pregunten mucho mucho.</p></div>",
    hasDetail: true
  },
  {
    name: "Melissa Leslie",
    program: "SAT",
    score: "",
    initials: "ML",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/05/SAT-Melissa-Leslie.webp",
    quote: "Te ayuda a generar confianza en ti mismo y el material de estudio es más que suficiente.",
    hasDetail: false
  },
  {
    name: "Nate Dávalos",
    program: "SAT",
    score: "",
    initials: "ND",
    image: "https://cms.proacademymx.com/wp-content/uploads/2017/05/SAT-Nate-Davalos.webp",
    quote: "Muy personalizado, se enfocó en mis debilidades al 100%, trabajamos en el horario que quería y la verdad no creí que fuera a subir mi calificación tanto, me sorprendió",
    hasDetail: false
  }
];
