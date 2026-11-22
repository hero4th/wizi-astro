import { useEffect, useMemo, useState } from "react";

interface Role {
  id: number;
  slug: string;
  name: string;
  description: string;
  priority: number;
}

interface AdminUser {
  id: number;
  email: string;
  name: string;
  active: boolean;
  last_login_at: string | null;
  created_at: string;
  role_slug: string;
  role_name: string;
  role_priority: number;
}

interface ListResponse {
  users: AdminUser[];
  roles: Role[];
  currentUserId: number;
  canManageSuperadmins: boolean;
}

interface DraftUser {
  name: string;
  email: string;
  roleSlug: string;
  active: boolean;
  password: string;
}

const emptyDraft = (roleSlug = "editor"): DraftUser => ({
  name: "",
  email: "",
  roleSlug,
  active: true,
  password: "",
});

function formatDate(value: string | null): string {
  if (!value) return "Nunca";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  }).format(new Date(value));
}

export default function UserManager() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [newUser, setNewUser] = useState<DraftUser>(emptyDraft());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<DraftUser>(emptyDraft());

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "No se pudieron cargar los usuarios.");
        return;
      }
      setData(body as ListResponse);
      setError(null);
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const assignableRoles = useMemo(() => {
    if (!data) return [];
    return data.canManageSuperadmins
      ? data.roles
      : data.roles.filter((role) => role.slug !== "superadmin");
  }, [data]);

  useEffect(() => {
    if (assignableRoles.length === 0) return;
    setNewUser((prev) =>
      assignableRoles.some((r) => r.slug === prev.roleSlug)
        ? prev
        : { ...prev, roleSlug: assignableRoles[0].slug }
    );
  }, [assignableRoles]);

  const createUser = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "No se pudo crear la cuenta.");
        return;
      }
      setNotice(`Cuenta creada para ${newUser.email}.`);
      setNewUser(emptyDraft(newUser.roleSlug));
      await load();
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (user: AdminUser) => {
    setEditingId(user.id);
    setEditDraft({
      name: user.name,
      email: user.email,
      roleSlug: user.role_slug,
      active: user.active,
      password: "",
    });
    setError(null);
    setNotice(null);
  };

  const saveEdit = async (id: number) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const payload: Record<string, unknown> = {
        name: editDraft.name,
        email: editDraft.email,
        roleSlug: editDraft.roleSlug,
        active: editDraft.active,
      };
      if (editDraft.password) payload.password = editDraft.password;

      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "No se pudo actualizar la cuenta.");
        return;
      }
      setNotice("Cuenta actualizada.");
      setEditingId(null);
      await load();
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const removeUser = async (user: AdminUser) => {
    if (!window.confirm(`¿Eliminar la cuenta de ${user.email}? Esta acción no se puede deshacer.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "No se pudo eliminar la cuenta.");
        return;
      }
      setNotice("Cuenta eliminada.");
      if (editingId === user.id) setEditingId(null);
      await load();
    } catch {
      setError("No se pudo conectar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) {
    return <p className="sec-sub">Cargando usuarios…</p>;
  }

  return (
    <div className="space-y-6">
      {error && <p className="error-banner">{error}</p>}
      {notice && <p className="notice-banner">{notice}</p>}

      <section className="panel">
        <h2 className="sec-title">Crear cuenta</h2>
        <p className="sec-sub">
          Cada cuenta inicia sesión con su correo y contraseña. El rol define lo
          que puede hacer dentro del panel; los permisos se comprueban en el
          servidor en cada petición.
        </p>

        <form onSubmit={createUser} className="sec-form" noValidate>
          <div className="field">
            <label htmlFor="new-name">Nombre</label>
            <input
              id="new-name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              autoComplete="name"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="new-email">Correo electrónico</label>
            <input
              id="new-email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              autoComplete="email"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="new-role">Rol</label>
            <select
              id="new-role"
              value={newUser.roleSlug}
              onChange={(e) => setNewUser({ ...newUser, roleSlug: e.target.value })}
              required
            >
              {assignableRoles.map((role) => (
                <option key={role.slug} value={role.slug}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="new-password">Contraseña inicial</label>
            <input
              id="new-password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              autoComplete="new-password"
              minLength={12}
              required
            />
            <p className="hint">
              Mínimo 12 caracteres, con al menos 3 de: minúsculas, mayúsculas,
              números y símbolos.
            </p>
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? "Creando…" : "Crear cuenta"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2 className="sec-title">Usuarios ({data?.users.length ?? 0})</h2>
        <p className="sec-sub">
          Desactiva una cuenta para bloquear el acceso sin borrar su historial de
          artículos.
        </p>

        <div className="user-list">
          {data?.users.map((user) => {
            const isSelf = user.id === data.currentUserId;
            const isEditing = editingId === user.id;
            const locked = user.role_slug === "superadmin" && !data.canManageSuperadmins;

            return (
              <div key={user.id} className="user-card">
                {!isEditing ? (
                  <>
                    <div className="user-card__main">
                      <p className="user-card__name">
                        {user.name} {isSelf && <span className="user-tag">Tú</span>}
                      </p>
                      <p className="user-card__meta">
                        {user.email} · {user.role_name} · Último acceso: {formatDate(user.last_login_at)}
                      </p>
                    </div>
                    <div className="user-card__actions">
                      <span className={user.active ? "badge badge-published" : "badge badge-draft"}>
                        {user.active ? "Activa" : "Inactiva"}
                      </span>
                      {locked ? (
                        <span className="hint">Solo un superadmin puede editarla</span>
                      ) : (
                        <button type="button" className="btn btn-secondary" onClick={() => startEdit(user)}>
                          Editar
                        </button>
                      )}
                      {!isSelf && !locked && (
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => removeUser(user)}
                          disabled={busy}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="user-edit">
                    <div className="user-edit__grid">
                      <div className="field">
                        <label htmlFor={`name-${user.id}`}>Nombre</label>
                        <input
                          id={`name-${user.id}`}
                          value={editDraft.name}
                          onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={`email-${user.id}`}>Correo</label>
                        <input
                          id={`email-${user.id}`}
                          type="email"
                          value={editDraft.email}
                          onChange={(e) => setEditDraft({ ...editDraft, email: e.target.value })}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={`role-${user.id}`}>Rol</label>
                        <select
                          id={`role-${user.id}`}
                          value={editDraft.roleSlug}
                          onChange={(e) => setEditDraft({ ...editDraft, roleSlug: e.target.value })}
                          disabled={isSelf}
                        >
                          {assignableRoles.map((role) => (
                            <option key={role.slug} value={role.slug}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label htmlFor={`password-${user.id}`}>
                          {isSelf ? "Contraseña (usa Seguridad)" : "Restablecer contraseña"}
                        </label>
                        <input
                          id={`password-${user.id}`}
                          type="password"
                          value={editDraft.password}
                          onChange={(e) => setEditDraft({ ...editDraft, password: e.target.value })}
                          autoComplete="new-password"
                          placeholder={isSelf ? "—" : "Opcional, mínimo 12 caracteres"}
                          disabled={isSelf}
                        />
                      </div>
                    </div>

                    <div className="checkbox-row">
                      <input
                        id={`active-${user.id}`}
                        type="checkbox"
                        checked={editDraft.active}
                        onChange={(e) => setEditDraft({ ...editDraft, active: e.target.checked })}
                        disabled={isSelf}
                      />
                      <label htmlFor={`active-${user.id}`}>Cuenta activa</label>
                    </div>

                    <div className="user-edit__actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => saveEdit(user.id)}
                        disabled={busy}
                      >
                        {busy ? "Guardando…" : "Guardar cambios"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setEditingId(null)}
                        disabled={busy}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
