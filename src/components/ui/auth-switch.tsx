import { useEffect, useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

export interface AuthSwitchProps {
  /** Pre-seed the error banner (e.g. server rendered with ?error=1). */
  initialError?: boolean;
}

/**
 * Split-panel login card for the blog admin: a curved teal panel on the left
 * and the form on the right.
 *
 * This admin has no user accounts and no third-party sign-in — just the one
 * shared password checked server-side against ADMIN_PASSWORD_HASH — so the
 * left panel carries the brand instead of a "sign up" switch, and there is a
 * single password field.
 */
export function AuthSwitch({ initialError = false }: AuthSwitchProps) {
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError ? "Contraseña incorrecta." : null
  );
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError(null);

    try {
      // JSON body (not a native form POST) sidesteps Astro's checkOrigin CSRF
      // guard, which trips on form-urlencoded submissions behind Vercel's
      // proxy — same fix the rest of the admin panel uses.
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      setError(
        res.status === 429
          ? "Demasiados intentos. Espera 15 minutos."
          : "Contraseña incorrecta."
      );
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
      setPassword("");
      inputRef.current?.focus();
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,var(--color-teal-600)_0%,var(--color-teal-500)_45%,var(--color-teal-700)_100%)] p-4 sm:p-6">
      <div
        className={cn(
          "relative w-full max-w-4xl overflow-hidden rounded-[22px] bg-white shadow-[0_30px_90px_-30px_rgb(0_0_0/0.45)]",
          "animate-[auth-in_0.55s_cubic-bezier(0.16,1,0.3,1)_both]",
          shake && "animate-[auth-shake_0.42s_ease-in-out]"
        )}
      >
        {/* Curved teal panel — desktop only; on mobile the left block gets a
            flat teal background instead. */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 hidden h-full w-full md:block"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="pa-auth-panel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-teal-500)" />
              <stop offset="100%" stopColor="var(--color-teal-700)" />
            </linearGradient>
          </defs>
          <path d="M0,0 H51 C56,30 49,66 34,100 H0 Z" fill="url(#pa-auth-panel)" />
        </svg>

        <div className="relative grid md:grid-cols-2">
          {/* Brand panel */}
          <div className="flex flex-col items-center justify-center gap-4 bg-[linear-gradient(135deg,var(--color-teal-500),var(--color-teal-700))] px-8 py-12 text-center text-white md:bg-none md:px-10 md:py-24 md:pr-16 lg:py-28">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 font-display text-base font-bold backdrop-blur-sm">
              PA
            </span>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Professional Academy
            </h2>
            <p className="max-w-[16rem] text-sm leading-relaxed text-white/85">
              Panel de administración del blog. Aquí publicas, editas y organizas
              los artículos del sitio.
            </p>
            <a
              href="/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 rounded-full border-2 border-white/70 px-7 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors hover:bg-white hover:text-teal-700"
            >
              Ver el blog
            </a>
          </div>

          {/* Form panel */}
          <div className="flex flex-col justify-center px-8 py-12 md:px-12 md:py-24 lg:px-14 lg:py-28">
            <h1 className="text-center font-display text-3xl font-bold tracking-tight text-ink-950">
              Iniciar sesión
            </h1>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
              <div
                role="alert"
                aria-live="polite"
                className={cn(
                  "overflow-hidden rounded-2xl bg-red-50 text-red-600 transition-all duration-200 ease-out",
                  error ? "max-h-16 px-5 py-3 opacity-100" : "max-h-0 px-5 py-0 opacity-0"
                )}
              >
                <p className="text-[13px] font-semibold">{error}</p>
              </div>

              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-teal-600">
                  <LockIcon />
                </span>
                <input
                  ref={inputRef}
                  id="password"
                  name="password"
                  type={reveal ? "text" : "password"}
                  required
                  autoFocus
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full rounded-full bg-ink-50 py-3.5 pl-[3.4rem] pr-12 text-[15px] text-ink-950 outline-none ring-2 ring-transparent transition placeholder:text-ink-300 focus:bg-white focus:ring-teal-500/45"
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  aria-label={reveal ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={reveal}
                  className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-ink-300 transition-colors hover:bg-ink-50 hover:text-teal-600"
                >
                  {reveal ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="mx-auto mt-3 flex min-w-[10rem] items-center justify-center gap-2 rounded-full bg-teal-600 px-9 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_24px_-8px_rgba(13,148,136,0.7)] transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              >
                {loading && <Spinner />}
                {loading ? "Verificando" : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes auth-in {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes auth-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(7px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10.5" width="16" height="11" rx="2.5" />
      <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a17.3 17.3 0 0 1-3.13 4.32M6.6 6.6C3.4 8.6 1 12 1 12s4 8 11 8a9.3 9.3 0 0 0 5.4-1.6" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.37 0 0 5.37 0 12h4Z" />
    </svg>
  );
}

export default AuthSwitch;
