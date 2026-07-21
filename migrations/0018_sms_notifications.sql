-- SMS alert notification preferences per business

ALTER TABLE businesses ADD COLUMN sms_alerts_enabled INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS notification_prefs (
  business_id TEXT NOT NULL,
  pref_type TEXT NOT NULL CHECK (pref_type IN ('category', 'suburb')),
  value TEXT NOT NULL,
  PRIMARY KEY (business_id, pref_type, value),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_lookup
  ON notification_prefs(pref_type, value);
