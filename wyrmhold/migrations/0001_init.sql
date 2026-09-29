-- Wyrmhold initial schema (Cloudflare D1 / SQLite)

CREATE TABLE users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  username    TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pass_hash   TEXT NOT NULL,
  pass_salt   TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE TABLE sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);

-- The full player state lives in `state` as JSON; the columns beside it are
-- copies used for listing and sorting. `version` guards against lost updates.
CREATE TABLE players (
  user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  renown       INTEGER NOT NULL DEFAULT 0,
  patron_until INTEGER NOT NULL DEFAULT 0,
  state        TEXT NOT NULL,
  version      INTEGER NOT NULL DEFAULT 0,
  updated_at   INTEGER NOT NULL
);
CREATE INDEX players_renown ON players(renown DESC);
CREATE UNIQUE INDEX players_name ON players(name COLLATE NOCASE);

CREATE TABLE events (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  at       INTEGER NOT NULL,
  text     TEXT NOT NULL
);
CREATE INDEX events_user_at ON events(user_id, at DESC);

-- Filled by the payment webhook once Stripe is connected.
CREATE TABLE purchases (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  pack          TEXT NOT NULL,
  provider_ref  TEXT NOT NULL UNIQUE,
  at            INTEGER NOT NULL
);
