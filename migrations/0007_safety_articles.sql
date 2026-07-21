-- Safety resource articles

CREATE TABLE IF NOT EXISTS safety_articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_safety_articles_status ON safety_articles(status, published_at DESC);

CREATE TABLE IF NOT EXISTS article_related (
  article_id TEXT NOT NULL,
  related_article_id TEXT NOT NULL,
  PRIMARY KEY (article_id, related_article_id),
  FOREIGN KEY (article_id) REFERENCES safety_articles(id),
  FOREIGN KEY (related_article_id) REFERENCES safety_articles(id)
);
