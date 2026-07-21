-- Update reaction types to watching, angry, downvote

PRAGMA foreign_keys = OFF;

CREATE TABLE report_reactions_new (
  id TEXT PRIMARY KEY,
  crime_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('watching', 'angry', 'downvote')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (crime_id) REFERENCES crimes(id),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  UNIQUE (crime_id, business_id)
);

INSERT INTO report_reactions_new (id, crime_id, business_id, reaction_type, created_at)
SELECT
  id,
  crime_id,
  business_id,
  CASE reaction_type
    WHEN 'support' THEN 'watching'
    WHEN 'concern' THEN 'angry'
    WHEN 'thanks' THEN 'downvote'
    ELSE 'watching'
  END,
  created_at
FROM report_reactions;

DROP TABLE report_reactions;

ALTER TABLE report_reactions_new RENAME TO report_reactions;

CREATE INDEX IF NOT EXISTS idx_report_reactions_crime ON report_reactions(crime_id);

PRAGMA foreign_keys = ON;
