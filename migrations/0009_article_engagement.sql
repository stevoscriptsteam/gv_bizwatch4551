-- Comments and reactions on safety articles

CREATE TABLE IF NOT EXISTS article_comments (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (article_id) REFERENCES safety_articles(id),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);

CREATE INDEX IF NOT EXISTS idx_article_comments_article ON article_comments(article_id, created_at);

CREATE TABLE IF NOT EXISTS article_reactions (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('watching', 'angry', 'downvote')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (article_id) REFERENCES safety_articles(id),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  UNIQUE (article_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_article_reactions_article ON article_reactions(article_id);
