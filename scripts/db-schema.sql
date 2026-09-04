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
