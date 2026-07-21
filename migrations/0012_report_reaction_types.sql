-- Report reaction types for community responses

DELETE FROM report_reactions;

CREATE TABLE report_reactions_new (
  id TEXT PRIMARY KEY,
  crime_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (
    reaction_type IN (
      'following',
      'also_affected',
      'seen_nearby',
      'have_information'
    )
  ),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (crime_id) REFERENCES crimes(id),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  UNIQUE (crime_id, business_id)
);

DROP TABLE report_reactions;

ALTER TABLE report_reactions_new RENAME TO report_reactions;

CREATE INDEX IF NOT EXISTS idx_report_reactions_crime ON report_reactions(crime_id);
