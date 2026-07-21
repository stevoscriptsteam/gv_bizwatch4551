-- BizWatch 4551 schema

CREATE TABLE IF NOT EXISTS businesses (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  suburb TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

CREATE TABLE IF NOT EXISTS crimes (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  crime_type TEXT NOT NULL,
  location TEXT NOT NULL,
  suburb TEXT,
  postcode TEXT NOT NULL DEFAULT '4551',
  status TEXT NOT NULL DEFAULT 'reported',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE INDEX IF NOT EXISTS idx_crimes_postcode ON crimes(postcode);
CREATE INDEX IF NOT EXISTS idx_crimes_created ON crimes(created_at DESC);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  crime_id TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (crime_id) REFERENCES crimes(id)
);

CREATE INDEX IF NOT EXISTS idx_alerts_business ON alerts(business_id, read);
