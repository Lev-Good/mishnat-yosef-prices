CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL DEFAULT 'אחר',
  sender_name TEXT DEFAULT '',
  reply_to TEXT DEFAULT '',
  message TEXT NOT NULL,
  app_version TEXT DEFAULT '',
  sender_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_created
  ON contact_messages(created_at DESC);
