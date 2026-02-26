-- TheShard database schema
-- Run this against your Vercel Postgres (Neon) database to initialize tables.

-- Auth tables (used by Auth.js / @hono/auth-js)

CREATE TABLE IF NOT EXISTS auth_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT,
  email         TEXT UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image         TEXT
);

CREATE TABLE IF NOT EXISTS auth_accounts (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"             UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  provider             TEXT NOT NULL,
  type                 TEXT NOT NULL,
  "providerAccountId"  TEXT NOT NULL,
  access_token         TEXT,
  expires_at           INTEGER,
  refresh_token        TEXT,
  id_token             TEXT,
  scope                TEXT,
  session_state        TEXT,
  token_type           TEXT,
  password             TEXT
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"        UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  "sessionToken"  TEXT UNIQUE NOT NULL,
  expires         TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_verification_token (
  identifier  TEXT NOT NULL,
  token       TEXT NOT NULL,
  expires     TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- App tables

CREATE TABLE IF NOT EXISTS groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  created_by  UUID REFERENCES auth_users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS todos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  UUID REFERENCES auth_users(id),
  title       TEXT NOT NULL,
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  due_date    DATE,
  assigned_to UUID[],
  completed   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  UUID REFERENCES auth_users(id),
  content     TEXT,
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth_users(id),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
