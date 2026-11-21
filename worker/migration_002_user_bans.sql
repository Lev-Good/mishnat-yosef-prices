ALTER TABLE comments ADD COLUMN ip_hash TEXT DEFAULT '';

CREATE TABLE IF NOT EXISTS user_reports (
  target_hash TEXT NOT NULL,
  reporter_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (target_hash, reporter_hash)
);

CREATE TABLE IF NOT EXISTS banned_users (
  user_hash TEXT PRIMARY KEY,
  report_count INTEGER NOT NULL DEFAULT 10,
  banned_at INTEGER NOT NULL
);
