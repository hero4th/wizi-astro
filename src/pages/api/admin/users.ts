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

async function listRoles() {
  return sql`SELECT id, slug, name, description, priority FROM roles ORDER BY priority DESC, name`;
}

export const GET: APIRoute = async ({ cookies }) => {
  const user = await getSessionUser(cookies);
  if (!user) return json({ error: "No autorizado." }, 401);
  if (!hasPermission(user, PERMISSIONS.USERS_READ)) return json({ error: "Sin permiso." }, 403);

  const users = await sql`
    SELECT u.id, u.email, u.name, u.active, u.last_login_at, u.created_at,
           r.slug AS role_slug, r.name AS role_name, r.priority AS role_priority
    FROM admin_users u
    JOIN roles r ON r.id = u.role_id
    ORDER BY r.priority DESC, u.name
  `;

  return json({
    users,
    roles: await listRoles(),
    currentUserId: user.id,
    canManageSuperadmins: hasPermission(user, PERMISSIONS.USERS_MANAGE_SUPERADMINS),
  });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const actor = await getSessionUser(cookies);
  if (!actor) return json({ error: "No autorizado." }, 401);
  if (!hasPermission(actor, PERMISSIONS.USERS_CREATE)) return json({ error: "Sin permiso." }, 403);

  const data = await request.json().catch(() => ({}));
  const email = normalizeEmail(String(data.email ?? ""));
  const name = String(data.name ?? "").trim();
  const password = String(data.password ?? "");
  const roleSlug = String(data.roleSlug ?? "").trim();

  if (!EMAIL_RE.test(email)) return json({ error: "Correo electrónico inválido." }, 422);
  if (!name) return json({ error: "El nombre es obligatorio." }, 422);
  if (!roleSlug) return json({ error: "Selecciona un rol." }, 422);

  const policyError = validatePasswordStrength(password);
  if (policyError) return json({ error: policyError }, 422);

  const roleRows = await sql`SELECT id, slug FROM roles WHERE slug = ${roleSlug} LIMIT 1`;
  const role = roleRows[0];
  if (!role) return json({ error: "El rol seleccionado no existe." }, 422);

  if (role.slug === "superadmin" && !hasPermission(actor, PERMISSIONS.USERS_MANAGE_SUPERADMINS)) {
    return json({ error: "Solo un superadministrador puede crear superadministradores." }, 403);
  }

  const duplicate = await sql`SELECT id FROM admin_users WHERE lower(email) = lower(${email}) LIMIT 1`;
  if (duplicate.length > 0) return json({ error: "Ya existe una cuenta con ese correo." }, 409);

  try {
    const rows = await sql`
      INSERT INTO admin_users (email, name, password_hash, role_id, active)
      VALUES (${email}, ${name}, ${await hashPassword(password)}, ${role.id}, ${data.active !== false})
      RETURNING id, email, name, active
    `;
    return json({ user: rows[0] }, 201);
  } catch (err) {
    console.error("[admin/users] create error:", (err as Error).message);
    return json({ error: "No se pudo crear la cuenta." }, 500);
  }
};
