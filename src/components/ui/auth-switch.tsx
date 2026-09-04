import { useEffect, useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

export interface AuthSwitchProps {
  /** Pre-seed the error banner (e.g. server rendered with ?error=1). */
  initialError?: boolean;
}

/**
 * Admin login card for the blog panel. Single password field — this admin
 * has no username/e-mail and no third-party sign-in, only the one shared
 * password checked server-side against ADMIN_PASSWORD_HASH. The "switch" is
 * the show/hide toggle on the password field.
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

  const triggerShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 420);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError(null);

    try {
      // JSON body (not a native form POST) sidesteps Astro's checkOrigin
      // CSRF guard, which trips on form-urlencoded submissions behind
      // Vercel's proxy — see the rest of the admin panel for the same fix.
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }
      if (res.status === 429) {
        setError("Demasiados intentos. Espera 15 minutos.");
      } else {
        setError("Contraseña incorrecta.");
      }
      triggerShake();
      setPassword("");
      inputRef.current?.focus();
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4 py-12">
      {/* Ambient teal glow, matching the site's --shadow-glow token */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_1px)] [background-size:22px_22px]"
      />

      <div
        className={cn(
          "relative w-full max-w-sm rounded-2xl border border-white/10 bg-ink-900/80 p-8 shadow-[0_24px_80px_-24px_rgb(0_0_0/0.6)] backdrop-blur-xl",
          "animate-[auth-in_0.5s_var(--ease-out-expo,cubic-bezier(0.16,1,0.3,1))_both]",
          shake && "animate-[auth-shake_0.42s_ease-in-out]"
        )}
      >
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-600 font-display text-sm font-bold text-white shadow-[0_0_24px_-4px_rgba(20,184,166,0.6)]">
            PA
          </span>
          <div>
            <h1 className="font-display text-lg font-semibold tracking-tight text-white">
              Blog Admin
            </h1>
            <p className="mt-0.5 text-xs font-medium text-ink-300">
              Professional Academy
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div
            role="alert"
            aria-live="polite"
            className={cn(
              "overflow-hidden rounded-lg bg-red-500/10 text-red-300 transition-[max-height,opacity,margin] duration-200 ease-out",
              error ? "mb-1 max-h-16 px-3.5 py-2.5 opacity-100" : "max-h-0 px-3.5 py-0 opacity-0"
            )}
          >
            <p className="text-[13px] font-medium">{error}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-300"
            >
              Contraseña
            </label>
            <div className="relative">
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
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/10 bg-ink-950/60 px-3.5 py-2.5 pr-11 text-[15px] text-white placeholder:text-ink-400 outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
              />
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                aria-label={reveal ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={reveal}
                className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-ink-300 transition-colors hover:bg-white/5 hover:text-teal-300"
              >
                {reveal ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="mt-1.5 flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Spinner />}
            {loading ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes auth-in {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes auth-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-7px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(3px); }
        }
      `}</style>
    </div>
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
