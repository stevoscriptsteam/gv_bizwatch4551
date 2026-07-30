-- Community flags for false/fraudulent reports
CREATE TABLE IF NOT EXISTS report_flags (
  id TEXT PRIMARY KEY,
  crime_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (crime_id) REFERENCES crimes(id),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  UNIQUE (crime_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_report_flags_crime ON report_flags(crime_id);

-- Why a report was archived (admin vs community auto-archive)
ALTER TABLE crimes ADD COLUMN archive_reason TEXT;
