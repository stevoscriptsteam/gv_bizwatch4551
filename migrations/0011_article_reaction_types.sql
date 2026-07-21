-- Article reaction types: helpful, interesting, needs_more_detail

DELETE FROM article_reactions;

CREATE TABLE article_reactions_new (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  business_id TEXT NOT NULL,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('helpful', 'interesting', 'needs_more_detail')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (article_id) REFERENCES safety_articles(id),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  UNIQUE (article_id, business_id)
);

DROP TABLE article_reactions;

ALTER TABLE article_reactions_new RENAME TO article_reactions;

CREATE INDEX IF NOT EXISTS idx_article_reactions_article ON article_reactions(article_id);
