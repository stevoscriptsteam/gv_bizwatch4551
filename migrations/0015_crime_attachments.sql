CREATE TABLE IF NOT EXISTS crime_attachments (
  id TEXT PRIMARY KEY,
  crime_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('photo', 'video', 'other')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (crime_id) REFERENCES crimes(id),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE INDEX IF NOT EXISTS idx_crime_attachments_crime_id
  ON crime_attachments (crime_id)
  WHERE deleted_at IS NULL;
