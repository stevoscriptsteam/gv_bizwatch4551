-- Comments, reactions, and soft-delete for reports

ALTER TABLE crimes ADD COLUMN deleted_at TEXT;

CREATE TABLE IF NOT EXISTS report_comments (
  id TEXT PRIMARY KEY,
  crime_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (crime_id) REFERENCES crimes(id),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE INDEX IF NOT EXISTS idx_report_comments_crime ON report_comments(crime_id, created_at);

CREATE TABLE IF NOT EXISTS report_reactions (
  id TEXT PRIMARY KEY,
  crime_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('support', 'concern', 'thanks')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (crime_id) REFERENCES crimes(id),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  UNIQUE (crime_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_report_reactions_crime ON report_reactions(crime_id);
