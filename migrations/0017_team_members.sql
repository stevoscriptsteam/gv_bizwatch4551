CREATE TABLE IF NOT EXISTS business_members (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE INDEX IF NOT EXISTS idx_members_business ON business_members(business_id);

ALTER TABLE sessions ADD COLUMN member_id TEXT;
ALTER TABLE report_comments ADD COLUMN member_id TEXT;
ALTER TABLE article_comments ADD COLUMN member_id TEXT;
