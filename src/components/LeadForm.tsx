import { useRef, useState } from "react";

const EXAMS = ["TOEFL iBT", "SAT", "GRE", "GMAT", "PAA", "Aún no lo sé"];
const WHATSAPP = "523327986275";

interface Errors {
  name?: string;
  email?: string;
  phone?: string;
  exam?: string;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Captura de leads: valida en línea y entrega el lead por WhatsApp con un
 * mensaje preformateado (el canal de venta real de la academia). El campo
 * "empresa" es un honeypot anti spam: invisible para humanos.
 */
export default function LeadForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const formRef = useRef<HTMLFormElement>(null);

  function validate(data: FormData): Errors {
    const next: Errors = {};
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const exam = String(data.get("exam") ?? "");

    if (name.length < 2) next.name = "Escribe tu nombre completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
    if (phone && phone.replace(/\D/g, "").length < 10)
      next.phone = "El teléfono debe tener al menos 10 dígitos.";
    if (!exam) next.exam = "Elige el examen que te interesa.";
    return next;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    // Honeypot: si está lleno, lo descartamos en silencio.
    if (String(data.get("company") ?? "") !== "") return;

    const next = validate(data);
    setErrors(next);

    const firstError = Object.keys(next)[0];
    if (firstError) {
      form.querySelector<HTMLElement>(`[name="${firstError}"]`)?.focus();
      return;
    }

    setStatus("sending");
    window.dataLayer?.push({
      event: "generate_lead",
      lead_exam: String(data.get("exam")),
    });

    const message = [
      "Hola, quiero agendar mi evaluación gratuita.",
      `Nombre: ${data.get("name")}`,
      `Correo: ${data.get("email")}`,
      data.get("phone") ? `Teléfono: ${data.get("phone")}` : null,
      `Examen: ${data.get("exam")}`,
      data.get("notes") ? `Comentarios: ${data.get("notes")}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
    setStatus("done");
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-ink-950/50 px-4 py-3.5 text-[15px] text-pearl outline-none transition-all placeholder:text-ink-500 focus-visible:bg-ink-950 focus-visible:ring-1 ${
      hasError ? "border-red-400/60 focus-visible:ring-red-400" : "border-ink-800 focus-visible:border-teal-500 focus-visible:ring-teal-500"
    }`;

  if (status === "done") {
    return (
      <div
        className="rounded-2xl border border-teal-500/30 bg-teal-900/30 p-10 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="font-display text-2xl font-semibold tracking-tight text-pearl">
          Recibimos tus datos.
        </p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-pearl-dim">
          Continúa la conversación en la ventana de WhatsApp que se abrió. Si no
          se abrió, escríbenos al 33 27 98 62 75 y agenda tu evaluación.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-7 rounded-full border border-pearl/18 px-5 py-2.5 font-mono text-[11px] tracking-widest text-pearl uppercase transition-colors hover:border-teal-400 hover:text-teal-300"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2.5">
          <label htmlFor="lead-name" className="font-mono text-[11px] tracking-[0.16em] text-ink-300 uppercase">
            Nombre completo
          </label>
          <input
            id="lead-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Ej. Mariana Cervantes…"
            className={inputClass(!!errors.name)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "err-name" : undefined}
          />
          {errors.name && (
            <p id="err-name" className="text-xs text-red-400">{errors.name}</p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <label htmlFor="lead-email" className="font-mono text-[11px] tracking-[0.16em] text-ink-300 uppercase">
            Correo electrónico
          </label>
          <input
            id="lead-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            required
            placeholder="Ej. nombre@correo.com…"
            className={inputClass(!!errors.email)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "err-email" : undefined}
          />
          {errors.email && (
            <p id="err-email" className="text-xs text-red-400">{errors.email}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2.5">
          <label htmlFor="lead-phone" className="font-mono text-[11px] tracking-[0.16em] text-ink-300 uppercase">
            Teléfono <span className="normal-case text-ink-500">(opcional)</span>
          </label>
          <input
            id="lead-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Ej. 33 1234 5678…"
            className={inputClass(!!errors.phone)}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "err-phone" : undefined}
          />
          {errors.phone && (
            <p id="err-phone" className="text-xs text-red-400">{errors.phone}</p>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          <label htmlFor="lead-exam" className="font-mono text-[11px] tracking-[0.16em] text-ink-300 uppercase">
            Examen de interés
          </label>
          <select
            id="lead-exam"
            name="exam"
            required
            defaultValue=""
            className={`${inputClass(!!errors.exam)} appearance-none bg-ink-950/50 text-pearl cursor-pointer`}
            aria-invalid={!!errors.exam}
            aria-describedby={errors.exam ? "err-exam" : undefined}
          >
            <option value="" disabled>
              Elige una opción…
            </option>
            {EXAMS.map((exam) => (
               <option key={exam} value={exam} className="bg-ink-900">
                {exam}
              </option>
            ))}
          </select>
          {errors.exam && (
            <p id="err-exam" className="text-xs text-red-400">{errors.exam}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <label htmlFor="lead-notes" className="font-mono text-[11px] tracking-[0.16em] text-ink-300 uppercase">
          Cuéntanos tu meta <span className="normal-case text-ink-500">(opcional)</span>
        </label>
        <textarea
          id="lead-notes"
          name="notes"
          rows={3}
          placeholder="Ej. Necesito 100 en TOEFL para una maestría en agosto…"
          className={`${inputClass(false)} resize-none`}
        />
      </div>

      {/* Honeypot anti spam */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="lead-company">Empresa</label>
        <input id="lead-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          className="btn-primary w-full shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all !py-4 sm:w-auto !font-display !text-sm !font-bold !tracking-widest"
          disabled={status === "sending"}
        >
          {status === "sending" ? "ABRIENDO WHATSAPP…" : "ENVIAR MENSAJE"}
        </button>
      </div>
      <p className="text-xs leading-relaxed text-ink-400">
        Al enviar aceptas nuestra{" "}
        <a href="/politica-de-privacidad" className="font-medium text-ink-300 underline underline-offset-2 transition-colors hover:text-teal-400">
          política de privacidad
        </a>
        . Tus datos solo se usan para agendar tu evaluación.
      </p>
    </form>
  );
}
