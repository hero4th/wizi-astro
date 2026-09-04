import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const MIN_LENGTH = 12;

interface Strength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  className: string;
}

/** Rough client-side meter for feedback only — the server enforces the policy. */
function scorePassword(password: string): Strength {
  if (!password) return { score: 0, label: "—", className: "bg-ink-100" };

  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) =>
    re.test(password)
  ).length;

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= MIN_LENGTH) score++;
  if (password.length >= 16) score++;
  if (classes >= 3) score++;
  if (classes === 4 && password.length >= MIN_LENGTH) score++;

  const capped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const labels = ["Muy débil", "Débil", "Aceptable", "Fuerte", "Excelente"];
  const colors = ["bg-red-400", "bg-red-400", "bg-amber-400", "bg-teal-500", "bg-teal-600"];

  return { score: capped, label: labels[capped], className: colors[capped] };
}

/** `passwordChangedAt` arrives already formatted from the server — see the page
 *  for why it isn't formatted here. */
export default function SecuritySettings({ passwordChangedAt }: { passwordChangedAt: string | null }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const strength = useMemo(() => scorePassword(next), [next]);
  const mismatch = confirm.length > 0 && next !== confirm;
  const canSubmit =
    !busy && current.length > 0 && next.length >= MIN_LENGTH && next === confirm;

  const submit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "No se pudo cambiar la contraseña.");
        return;
      }
      setNotice(data.message ?? "Contraseña actualizada.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const signOutEverywhere = async () => {
    if (
      !window.confirm(
        "¿Cerrar la sesión en todos los dispositivos? Tendrás que volver a iniciar sesión aquí."
      )
    )
      return;
    const res = await fetch("/api/admin/sessions", { method: "DELETE" });
    if (res.ok) window.location.href = "/admin/login";
    else setError("No se pudieron cerrar las sesiones.");
  };

  return (
    <div className="sec-grid">
      <section className="panel">
        <h2 className="sec-title">Cambiar contraseña</h2>
        <p className="sec-sub">
          Mínimo {MIN_LENGTH} caracteres, con al menos 3 de estos 4: minúsculas,
          mayúsculas, números y símbolos. Al cambiarla se cerrarán las sesiones
          abiertas en otros dispositivos.
        </p>

        {error && <p className="error-banner sec-mt">{error}</p>}
        {notice && <p className="notice-banner sec-mt">{notice}</p>}

        <form onSubmit={submit} className="sec-form" noValidate>
          <div className="field">
            <label htmlFor="sec-current">Contraseña actual</label>
            <input
              id="sec-current"
              type={reveal ? "text" : "password"}
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="sec-new">Nueva contraseña</label>
            <input
              id="sec-new"
              type={reveal ? "text" : "password"}
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
            />
            <div className="meter" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn("meter-seg", i < strength.score ? strength.className : "bg-ink-100")}
                />
              ))}
            </div>
            <p className="hint">
              Seguridad: <strong>{strength.label}</strong>
              {next.length > 0 && next.length < MIN_LENGTH && ` · faltan ${MIN_LENGTH - next.length} caracteres`}
            </p>
          </div>

          <div className="field">
            <label htmlFor="sec-confirm">Confirmar nueva contraseña</label>
            <input
              id="sec-confirm"
              type={reveal ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
            {mismatch && <p className="hint hint-bad">Las contraseñas no coinciden.</p>}
          </div>

          <div className="checkbox-row">
            <input
              id="sec-reveal"
              type="checkbox"
              checked={reveal}
              onChange={(e) => setReveal(e.target.checked)}
            />
            <label htmlFor="sec-reveal">Mostrar contraseñas</label>
          </div>

          <div>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              {busy ? "Guardando…" : "Cambiar contraseña"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2 className="sec-title">Sesiones</h2>
        <p className="sec-sub">
          Las sesiones caducan solas a las 8 horas. Si crees que alguien más tiene
          acceso, ciérralas todas: cualquier sesión abierta dejará de funcionar de
          inmediato.
        </p>
        {passwordChangedAt && (
          <p className="hint sec-mt">
            Contraseña cambiada por última vez el <strong>{passwordChangedAt}</strong>
          </p>
        )}
        <div className="sec-mt">
          <button type="button" className="btn btn-danger" onClick={signOutEverywhere}>
            Cerrar sesión en todos los dispositivos
          </button>
        </div>
      </section>
    </div>
  );
}
