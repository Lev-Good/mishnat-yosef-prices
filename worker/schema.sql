-- סכמת מסד הנתונים (Cloudflare D1 / SQLite) לפורום הערות המוצרים של "מוסיף למשנת"

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pid TEXT NOT NULL,
  product_name TEXT DEFAULT '',
  author TEXT NOT NULL,
  author_hash TEXT NOT NULL,
  body TEXT NOT NULL,
  sale_week TEXT DEFAULT '',
  likes INTEGER NOT NULL DEFAULT 0,
  spam_count INTEGER NOT NULL DEFAULT 0,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_pid_visible
  ON comments(pid, hidden, likes DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS votes (
  comment_id INTEGER NOT NULL,
  voter_hash TEXT NOT NULL,
  vote_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (comment_id, voter_hash, vote_type)
);

CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_actor
  ON rate_limits(actor_hash, created_at);
