-- Admin panel: roles, report archive, comment moderation, audit log

ALTER TABLE businesses ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;

ALTER TABLE crimes ADD COLUMN archived_at TEXT;
ALTER TABLE crimes ADD COLUMN archived_by TEXT;

ALTER TABLE report_comments ADD COLUMN deleted_at TEXT;
ALTER TABLE report_comments ADD COLUMN deleted_by TEXT;

ALTER TABLE article_comments ADD COLUMN deleted_at TEXT;
ALTER TABLE article_comments ADD COLUMN deleted_by TEXT;

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id TEXT PRIMARY KEY,
  admin_business_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (admin_business_id) REFERENCES businesses(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crimes_archived ON crimes(archived_at);

-- Master account admin flag (0402940839)
UPDATE businesses SET is_admin = 1 WHERE phone = '+61402940839';
