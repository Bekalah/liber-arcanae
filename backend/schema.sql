CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,              -- ISO timestamp
  card_id TEXT NOT NULL,         -- arcana id (e.g., "fool")
  event TEXT NOT NULL,           -- "enter-door" | "view-folio"
  ua TEXT,                       -- user agent (trimmed)
  ip_hash TEXT                   -- sha256(ip + LOG_SALT)
);

CREATE INDEX IF NOT EXISTS idx_visits_ts ON visits(ts);
CREATE INDEX IF NOT EXISTS idx_visits_card ON visits(card_id);
