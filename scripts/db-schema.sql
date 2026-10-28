-- Blog posts (replaces the local-Markdown/Decap content source).
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  categories JSONB NOT NULL DEFAULT '[]',
  pub_date DATE NOT NULL,
  updated_date DATE,
  image TEXT,
  image_alt TEXT NOT NULL DEFAULT '',
  image_width INT,
  image_height INT,
  author TEXT NOT NULL DEFAULT 'Professional Academy',
  reading_time INT NOT NULL DEFAULT 5,
  draft BOOLEAN NOT NULL DEFAULT true,
  body TEXT NOT NULL,       -- Markdown source (re-editable in the admin panel)
  html TEXT NOT NULL,       -- Rendered HTML (cached at save time, served as-is)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_pub_date_idx ON posts (pub_date DESC);
CREATE INDEX IF NOT EXISTS posts_draft_idx ON posts (draft);
CREATE INDEX IF NOT EXISTS posts_category_slug_idx ON posts (category_slug);

-- Hidden/SEO metadata for a post: overrides that don't appear in the article body.
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS noindex BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS keywords TEXT;

-- Reusable content blocks the editor can save and re-insert.
CREATE TABLE IF NOT EXISTS snippets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Basic login rate limiting for the admin panel (defense against password guessing).
CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_attempts_ip_time_idx ON login_attempts (ip, attempted_at DESC);

-- Admin credentials. A single row (id = 1): this is a one-editor panel, not a
-- multi-user system. The hash lives here rather than in ADMIN_PASSWORD_HASH so
-- the password can be changed from the panel itself without a redeploy; the env
-- var is still used to seed this row the first time.
CREATE TABLE IF NOT EXISTS admin_credentials (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  password_hash TEXT NOT NULL,
  -- Sessions issued before this instant are rejected. Bumped whenever the
  -- password changes or the admin signs out everywhere, so a leaked or stale
  -- session cookie stops working immediately.
  sessions_valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rate limiting for sensitive admin actions beyond login (password changes).
CREATE TABLE IF NOT EXISTS admin_action_attempts (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  action TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_action_attempts_idx
  ON admin_action_attempts (ip, action, attempted_at DESC);

-- ---------------------------------------------------------------------------
-- RBAC: usuarios, roles y permisos (migración 0006)
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

DELETE FROM role_permissions
WHERE role_id IN (SELECT id FROM roles WHERE is_system = true);

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, p.key
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'superadmin'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_key)
SELECT r.id, p.key
FROM roles r
CROSS JOIN permissions p
WHERE r.slug = 'admin'
  AND p.key NOT IN ('roles.manage', 'settings.manage', 'users.manage_superadmins')
ON CONFLICT DO NOTHING;

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

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_lower_idx
  ON admin_users (lower(email));
CREATE INDEX IF NOT EXISTS admin_users_role_idx ON admin_users (role_id);
CREATE INDEX IF NOT EXISTS admin_users_active_idx ON admin_users (active);

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
