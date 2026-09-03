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

-- Basic login rate limiting for the admin panel (defense against password guessing).
CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_attempts_ip_time_idx ON login_attempts (ip, attempted_at DESC);
