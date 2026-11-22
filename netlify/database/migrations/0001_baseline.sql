-- Baseline: esquema completo de ProAcademy
-- Aplicado automáticamente por Netlify Database en cada deploy.

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
  body TEXT NOT NULL,
  html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  seo_title TEXT,
  seo_description TEXT,
  canonical_url TEXT,
  noindex BOOLEAN NOT NULL DEFAULT false,
  og_image TEXT,
  keywords TEXT
);

CREATE INDEX IF NOT EXISTS posts_pub_date_idx ON posts (pub_date DESC);
CREATE INDEX IF NOT EXISTS posts_draft_idx ON posts (draft);
CREATE INDEX IF NOT EXISTS posts_category_slug_idx ON posts (category_slug);

CREATE TABLE IF NOT EXISTS snippets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_attempts_ip_time_idx ON login_attempts (ip, attempted_at DESC);

CREATE TABLE IF NOT EXISTS admin_credentials (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  password_hash TEXT NOT NULL,
  sessions_valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_action_attempts (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  action TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_action_attempts_idx
  ON admin_action_attempts (ip, action, attempted_at DESC);
