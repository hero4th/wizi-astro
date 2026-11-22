import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface AuthSwitchProps {
  /** Pre-seed the error banner (e.g. server rendered with ?error=1). */
  initialError?: boolean;
}

/**
 * Split-panel login card for the blog admin: a curved teal panel on the left
 * and the form on the right.
 *
 * Accounts live in the database and each one has a role (superadmin, admin or
 * blog editor). The email identifies the account; the password is verified
 * server-side against its bcrypt hash.
 */
export function AuthSwitch({ initialError = false }: AuthSwitchProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError ? "Correo o contraseña incorrectos." : null
  );
  const [shake, setShake] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const fail = (message: string) => {
    setError(message);
    setShake(true);
    window.setTimeout(() => setShake(false), 420);
  };

  // Typed structurally rather than with React's FormEvent, which its own types
  // now flag as deprecated.
  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!email || !password || loading || success) return;
    setLoading(true);
    setError(null);

    try {
      // JSON body (not a native form POST) sidesteps Astro's checkOrigin CSRF
      // guard, which trips on form-urlencoded submissions behind Vercel's
      // proxy — same fix the rest of the admin panel uses.
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Only a real success redirects now; a wrong password comes back as 401
      // (it used to be a 303 too, which made failures look like successes).
      if (res.ok || res.redirected) {
        setSuccess(true);
        // Let the check mark play for a beat before handing off.
        window.setTimeout(() => (window.location.href = res.redirected ? res.url : "/admin"), 480);
        return;
      }

      const data = await res.json().catch(() => ({}) as { error?: string });
      fail(data.error ?? "Correo o contraseña incorrectos.");
      setPassword("");
      inputRef.current?.focus();
    } catch {
      fail("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,var(--color-teal-600)_0%,var(--color-teal-500)_45%,var(--color-teal-700)_100%)] p-4 sm:p-6">
      <div
        className={cn(
          "pa-card relative w-full max-w-4xl overflow-hidden rounded-[22px] bg-white shadow-[0_30px_90px_-30px_rgb(0_0_0/0.45)]",
          shake && "pa-shake"
        )}
      >
        {/* Curved teal panel — desktop only; on mobile the left block gets a
            flat teal background instead. */}
        <svg
          aria-hidden="true"
          className="pa-panel absolute inset-0 hidden h-full w-full md:block"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="pa-auth-panel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-teal-500)" />
              <stop offset="100%" stopColor="var(--color-teal-700)" />
            </linearGradient>
            <clipPath id="pa-auth-clip">
              <path d="M0,0 H51 C56,30 49,66 34,100 H0 Z" />
            </clipPath>
            <filter id="pa-auth-blur">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>
          <path d="M0,0 H51 C56,30 49,66 34,100 H0 Z" fill="url(#pa-auth-panel)" />
          {/* Ambient blobs drifting inside the panel */}
          <g clipPath="url(#pa-auth-clip)" filter="url(#pa-auth-blur)">
            <circle className="pa-blob-a" cx="16" cy="26" r="15" fill="#fff" opacity="0.13" />
            <circle className="pa-blob-b" cx="33" cy="80" r="11" fill="#fff" opacity="0.10" />
          </g>
        </svg>

        <div className="relative grid md:grid-cols-2">
          {/* Brand panel */}
          <div className="flex flex-col items-center justify-center gap-5 bg-[linear-gradient(135deg,var(--color-teal-500),var(--color-teal-700))] px-8 py-12 text-center text-white md:bg-none md:px-10 md:py-24 md:pr-16 lg:py-28">
            <BrandLogo />
            <p
              className="pa-rise max-w-[16rem] text-sm leading-relaxed text-white/85"
              style={{ animationDelay: "0.62s" }}
            >
              Panel de administración del blog. Aquí publicas, editas y organizas
              los artículos del sitio.
            </p>
            <a
              href="/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="pa-rise group mt-1 flex items-center gap-2 rounded-full border-2 border-white/70 px-7 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors duration-300 hover:bg-white hover:text-teal-700"
              style={{ animationDelay: "0.72s" }}
            >
              Ver el blog
              <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          </div>

          {/* Form panel */}
          <div className="flex flex-col justify-center px-8 py-12 md:px-12 md:py-24 lg:px-14 lg:py-28">
            <h1
              className="pa-rise text-center font-display text-3xl font-bold tracking-tight text-ink-950"
              style={{ animationDelay: "0.2s" }}
            >
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

              <label htmlFor="email" className="sr-only">
                Correo electrónico
              </label>
              <div className="pa-rise relative" style={{ animationDelay: "0.28s" }}>
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-teal-600 transition-transform duration-300 peer-focus:scale-110">
                  <MailIcon />
                </span>
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className="peer w-full rounded-full bg-ink-50 py-3.5 pl-[3.4rem] pr-12 text-[15px] text-ink-950 outline-none ring-2 ring-transparent transition duration-300 placeholder:text-ink-300 focus:bg-white focus:ring-teal-500/45"
                />
              </div>

              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <div className="pa-rise relative" style={{ animationDelay: "0.34s" }}>
                <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-teal-600 transition-transform duration-300 peer-focus:scale-110">
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
                  className="peer w-full rounded-full bg-ink-50 py-3.5 pl-[3.4rem] pr-12 text-[15px] text-ink-950 outline-none ring-2 ring-transparent transition duration-300 placeholder:text-ink-300 focus:bg-white focus:ring-teal-500/45"
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  aria-label={reveal ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={reveal}
                  className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center overflow-hidden rounded-full text-ink-300 transition-colors duration-200 hover:bg-ink-50 hover:text-teal-600"
                >
                  <span key={reveal ? "on" : "off"} className="pa-pop grid place-items-center">
                    {reveal ? <EyeOffIcon /> : <EyeIcon />}
                  </span>
                </button>
              </div>

              {/* The rise animation lives on a wrapper: with fill-mode "both" it
                  would otherwise pin opacity:1 on the button and defeat its own
                  disabled styling. */}
              <div className="pa-rise mt-3 flex justify-center" style={{ animationDelay: "0.4s" }}>
                <button
                  type="submit"
                  disabled={loading || success || !email || !password}
                  className={cn(
                    "flex min-w-[10rem] items-center justify-center gap-2 rounded-full px-9 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_24px_-8px_rgba(13,148,136,0.7)] transition-all duration-300",
                    "hover:-translate-y-0.5 hover:shadow-[0_16px_30px_-10px_rgba(13,148,136,0.85)]",
                    "disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none",
                    success ? "bg-teal-500" : "bg-teal-600 hover:bg-teal-700"
                  )}
                >
                  {success ? (
                    <>
                      <CheckIcon />
                      Listo
                    </>
                  ) : loading ? (
                    <>
                      <Spinner />
                      Verificando
                    </>
                  ) : (
                    "Entrar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        .pa-card {
          animation: pa-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .pa-shake { animation: pa-shake 0.42s ease-in-out; }

        /* The curved panel wipes in from the left. */
        .pa-panel {
          animation: pa-sweep 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }

        /* Staggered entrance for every text/control block. */
        .pa-rise {
          animation: pa-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* Logo: the check stroke draws itself, then the wordmark fades up. */
        .pa-logo-stroke {
          stroke-dasharray: 420;
          stroke-dashoffset: 420;
          animation: pa-draw 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
        }
        .pa-logo-word { animation: pa-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both; }

        .pa-blob-a { animation: pa-float-a 13s ease-in-out infinite; }
        .pa-blob-b { animation: pa-float-b 17s ease-in-out infinite; }

        .pa-pop { animation: pa-pop 0.22s cubic-bezier(0.16, 1, 0.3, 1) both; }

        @keyframes pa-card-in {
          from { opacity: 0; transform: translateY(16px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pa-sweep {
          from { clip-path: inset(0 100% 0 0); }
          to { clip-path: inset(0 0 0 0); }
        }
        @keyframes pa-rise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pa-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes pa-pop {
          from { opacity: 0; transform: scale(0.6) rotate(-25deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes pa-float-a {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(4px, 6px); }
        }
        @keyframes pa-float-b {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-5px, -7px); }
        }
        @keyframes pa-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(7px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(3px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .pa-card, .pa-panel, .pa-rise, .pa-logo-stroke, .pa-logo-word,
          .pa-blob-a, .pa-blob-b, .pa-pop, .pa-shake {
            animation: none !important;
          }
          .pa-logo-stroke { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

/** The site's own logo mark, inlined so the check stroke can draw itself. */
function BrandLogo() {
  return (
    <svg
      viewBox="0 0 350 90"
      role="img"
      aria-label="Professional Academy"
      className="h-auto w-[200px] max-w-full md:w-[215px]"
    >
      <path
        className="pa-logo-stroke"
        d="M 10 45 L 25 45 L 45 80 L 75 15 L 340 15"
        fill="none"
        stroke="#ffffff"
        strokeWidth="8"
        strokeLinejoin="miter"
        strokeLinecap="square"
      />
      <g className="pa-logo-word" fill="#ffffff" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>
        <text x="85" y="48" fontSize="32" letterSpacing="-0.5">Professional</text>
        <text x="85" y="82" fontSize="32" letterSpacing="-0.5">
          Academy
          <tspan fontSize="16" dy="-14">®</tspan>
        </text>
      </g>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
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

function CheckIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
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
