-- RBAC: usuarios, roles y permisos del panel de administración.
--
-- La base de datos solo se usa desde /admin y desde el snapshot de build.
-- El sitio público y el blog se generan como HTML estático.
--
-- Idempotente: se puede aplicar más de una vez sin duplicar datos. No modifica
-- las migraciones 0001–0005, que ya están aplicadas.

-- ---------------------------------------------------------------------------
-- 1. Catálogo de roles y permisos
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissions (
  key TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  group_name TEXT NOT NULL DEFAULT 'general'
);

-- Permisos granulares. El código comprueba estas mismas claves; añadir una
-- nueva capacidad en el futuro solo requiere insertarla aquí y asignarla a un
-- rol, sin tocar la estructura de usuarios.
INSERT INTO permissions (key, description, group_name) VALUES
  ('posts.read', 'Ver artículos del blog', 'blog'),
  ('posts.create', 'Crear artículos del blog', 'blog'),
  ('posts.update', 'Editar artículos del blog', 'blog'),
  ('posts.delete', 'Eliminar artículos del blog', 'blog'),
  ('posts.publish', 'Publicar o despublicar artículos', 'blog'),
  ('snippets.read', 'Ver bloques reutilizables', 'blog'),
  ('snippets.create', 'Crear bloques reutilizables', 'blog'),
  ('snippets.delete', 'Eliminar bloques reutilizables', 'blog'),
  ('media.upload', 'Subir imágenes y archivos', 'media'),
  ('users.read', 'Ver usuarios del panel', 'usuarios'),
  ('users.create', 'Crear usuarios del panel', 'usuarios'),
  ('users.update', 'Editar usuarios del panel', 'usuarios'),
  ('users.delete', 'Eliminar usuarios del panel', 'usuarios'),
  ('users.manage_superadmins', 'Crear o modificar superadministradores', 'usuarios'),
  ('roles.read', 'Ver roles y permisos', 'roles'),
  ('roles.manage', 'Crear, editar o eliminar roles', 'roles'),
  ('security.manage', 'Administrar la configuración de seguridad', 'seguridad'),
  ('backup.export', 'Exportar respaldos', 'sistema'),
  ('backup.import', 'Importar respaldos', 'sistema'),
  ('deploy.trigger', 'Publicar cambios y disparar deploys', 'sistema'),
  ('settings.manage', 'Administrar la configuración del sitio', 'sistema')
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description,
  group_name = EXCLUDED.group_name;

INSERT INTO roles (slug, name, description, priority, is_system) VALUES
  ('superadmin', 'Superadministrador', 'Acceso total, incluida la gestión de otros superadministradores.', 100, true),
  ('admin', 'Administrador', 'Gestiona contenido, usuarios, respaldos y publicación.', 50, true),
  ('editor', 'Editor de blog', 'Crea, edita, publica y elimina artículos del blog.', 10, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  priority = EXCLUDED.priority,
  is_system = EXCLUDED.is_system,
  updated_at = now();

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_key TEXT NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_key)
);

-- Los roles de sistema se re-siembran en cada ejecución. Los roles futuros
-- personalizados no se tocan.
DELETE FROM role_permissions
WHERE role_id IN (SELECT id FROM roles WHERE is_system = true);

-- Superadministrador: todos los permisos.
INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, p.key
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'superadmin'
ON CONFLICT DO NOTHING;

-- Administrador: todo menos editar el catálogo de roles/permisos y gestionar
-- superadministradores. Puede gestionar usuarios admin/editor.
INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, p.key
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin'
  AND p.key NOT IN ('roles.manage', 'settings.manage', 'users.manage_superadmins')
ON CONFLICT DO NOTHING;

-- Editor de blog: contenido y medios. No gestiona usuarios, respaldos ni
-- deploys; un admin decide cuándo publicar al sitio estático.
INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, p.key
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'editor'
  AND p.key IN (
    'posts.read', 'posts.create', 'posts.update', 'posts.delete', 'posts.publish',
    'snippets.read', 'snippets.create', 'snippets.delete',
    'media.upload'
  )
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Usuarios del panel
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  active BOOLEAN NOT NULL DEFAULT true,
  sessions_valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- El login normaliza el correo a minúsculas, pero este índice protege contra
-- duplicados si algo lo inserta por otra vía.
CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_lower_idx
  ON admin_users (lower(email));

CREATE INDEX IF NOT EXISTS admin_users_role_idx ON admin_users (role_id);
CREATE INDEX IF NOT EXISTS admin_users_active_idx ON admin_users (active);

-- Migra la credencial única anterior a un superadministrador. El correo se
-- puede cambiar después desde /admin/usuarios.
INSERT INTO admin_users (
  email, name, password_hash, role_id,
  sessions_valid_from, password_changed_at, created_at
)
SELECT
  'admin@proacademymx.com',
  'Administrador',
  ac.password_hash,
  r.id,
  ac.sessions_valid_from,
  ac.password_changed_at,
  ac.updated_at
FROM admin_credentials ac
JOIN roles r ON r.slug = 'superadmin'
WHERE ac.id = 1
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Metadatos de auditoría y rate limiting
-- ---------------------------------------------------------------------------

ALTER TABLE login_attempts ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS login_attempts_email_time_idx
  ON login_attempts (lower(email), attempted_at DESC);

ALTER TABLE admin_action_attempts
  ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL;

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS created_by_user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL;
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS updated_by_user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS posts_created_by_idx ON posts (created_by_user_id);
CREATE INDEX IF NOT EXISTS posts_updated_by_idx ON posts (updated_by_user_id);
