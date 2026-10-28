export const prerender = false;

import type { APIRoute } from "astro";
import {
  getSessionUser,
  hasPermission,
  hashPassword,
  normalizeEmail,
  validatePasswordStrength,
} from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { sql } from "@/lib/db";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function loadTarget(id: number) {
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.active, r.slug AS role_slug
    FROM admin_users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

async function activeSuperadmins(): Promise<number> {
  const rows = await sql`
    SELECT count(*)::int AS n
    FROM admin_users u
    JOIN roles r ON r.id = u.role_id
    WHERE r.slug = 'superadmin' AND u.active = true
  `;
  return rows[0]?.n ?? 0;
}

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  const actor = await getSessionUser(cookies);
  if (!actor) return json({ error: "No autorizado." }, 401);
  if (!hasPermission(actor, PERMISSIONS.USERS_UPDATE)) return json({ error: "Sin permiso." }, 403);

  const id = Number(params.id);
  if (!Number.isInteger(id)) return json({ error: "Id inválido." }, 422);

  const target = await loadTarget(id);
  if (!target) return json({ error: "Usuario no encontrado." }, 404);

  const data = await request.json().catch(() => ({}));
  const isSelf = target.id === actor.id;
  const canManageSuperadmins = hasPermission(actor, PERMISSIONS.USERS_MANAGE_SUPERADMINS);

  if (target.role_slug === "superadmin" && !canManageSuperadmins) {
    return json({ error: "Solo un superadministrador puede modificar a otro superadministrador." }, 403);
  }

  // Build the update from the fields actually present, so a partial PATCH
  // doesn't silently reset columns.
  const updates: string[] = [];
  const values: unknown[] = [];
  const set = (column: string, value: unknown) => {
    values.push(value);
    updates.push(`${column} = $${values.length}`);
  };

  if ("name" in data) {
    const name = String(data.name ?? "").trim();
    if (!name) return json({ error: "El nombre es obligatorio." }, 422);
    set("name", name);
  }

  if ("email" in data) {
    const email = normalizeEmail(String(data.email ?? ""));
    if (!EMAIL_RE.test(email)) return json({ error: "Correo electrónico inválido." }, 422);
    const duplicate = await sql`
      SELECT id FROM admin_users WHERE lower(email) = lower(${email}) AND id <> ${id} LIMIT 1
    `;
    if (duplicate.length > 0) return json({ error: "Ya existe una cuenta con ese correo." }, 409);
    set("email", email);
  }

  let nextRoleSlug = target.role_slug as string;
  if ("roleSlug" in data) {
    nextRoleSlug = String(data.roleSlug ?? "").trim();
    const roleRows = await sql`SELECT id, slug FROM roles WHERE slug = ${nextRoleSlug} LIMIT 1`;
    const role = roleRows[0];
    if (!role) return json({ error: "El rol seleccionado no existe." }, 422);

    if (isSelf && nextRoleSlug !== target.role_slug) {
      return json({ error: "No puedes cambiar tu propio rol." }, 409);
    }
    if (nextRoleSlug === "superadmin" && !canManageSuperadmins) {
      return json({ error: "Solo un superadministrador puede asignar ese rol." }, 403);
    }
    set("role_id", role.id);
  }

  let nextActive = Boolean(target.active);
  if ("active" in data) {
    nextActive = Boolean(data.active);
    if (isSelf && !nextActive) {
      return json({ error: "No puedes desactivar tu propia cuenta." }, 409);
    }
    set("active", nextActive);
  }

  // Removing the last active superadmin would lock everyone out of role and
  // user management, so it is never allowed.
  const losesSuperadmin =
    target.role_slug === "superadmin" &&
    (nextRoleSlug !== "superadmin" || !nextActive);
  if (losesSuperadmin && (await activeSuperadmins()) <= 1) {
    return json({ error: "Debe quedar al menos un superadministrador activo." }, 409);
  }

  if ("password" in data) {
    if (isSelf) {
      return json({ error: "Para tu propia cuenta usa la sección Seguridad." }, 409);
    }
    const password = String(data.password ?? "");
    const policyError = validatePasswordStrength(password);
    if (policyError) return json({ error: policyError }, 422);
    set("password_hash", await hashPassword(password));
    // A reset by an administrator logs the account out everywhere.
    updates.push("sessions_valid_from = now()", "password_changed_at = now()");
  }

  if (updates.length === 0) return json({ error: "No hay cambios para guardar." }, 422);

  updates.push("updated_at = now()");
  values.push(id);

  try {
    const rows = await sql.query(
      `UPDATE admin_users SET ${updates.join(", ")} WHERE id = $${values.length}
       RETURNING id, email, name, active`,
      values
    );
    return json({ user: rows[0] });
  } catch (err) {
    console.error("[admin/users] update error:", (err as Error).message);
    return json({ error: "No se pudo actualizar la cuenta." }, 500);
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const actor = await getSessionUser(cookies);
  if (!actor) return json({ error: "No autorizado." }, 401);
  if (!hasPermission(actor, PERMISSIONS.USERS_DELETE)) return json({ error: "Sin permiso." }, 403);

  const id = Number(params.id);
  if (!Number.isInteger(id)) return json({ error: "Id inválido." }, 422);
  if (id === actor.id) return json({ error: "No puedes eliminar tu propia cuenta." }, 409);

  const target = await loadTarget(id);
  if (!target) return json({ error: "Usuario no encontrado." }, 404);

  if (target.role_slug === "superadmin") {
    if (!hasPermission(actor, PERMISSIONS.USERS_MANAGE_SUPERADMINS)) {
      return json({ error: "Solo un superadministrador puede eliminar a otro superadministrador." }, 403);
    }
    if (target.active && (await activeSuperadmins()) <= 1) {
      return json({ error: "Debe quedar al menos un superadministrador activo." }, 409);
    }
  }

  await sql`DELETE FROM admin_users WHERE id = ${id}`;
  return json({ ok: true });
};
