CREATE TABLE public_articles (
 id TEXT PRIMARY KEY,owner_hash TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,name TEXT NOT NULL,
 created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL,version INTEGER NOT NULL DEFAULT 1,deleted_at INTEGER
);
CREATE INDEX articles_created ON public_articles(created_at DESC);
CREATE TABLE article_archive (
 event_id TEXT PRIMARY KEY,article_id TEXT NOT NULL,version INTEGER NOT NULL,title TEXT NOT NULL,author TEXT NOT NULL,
 markdown TEXT NOT NULL,created_at INTEGER NOT NULL,deleted_at INTEGER,UNIQUE(article_id,version)
);
CREATE TABLE article_outbox (
 event_id TEXT PRIMARY KEY REFERENCES article_archive(event_id),synced_at INTEGER,attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at INTEGER NOT NULL DEFAULT 0,lease_until INTEGER NOT NULL DEFAULT 0,lease_token TEXT,last_error TEXT
);
CREATE TRIGGER article_enqueue AFTER INSERT ON article_archive BEGIN
 INSERT INTO article_outbox(event_id) VALUES(NEW.event_id);
END;
CREATE TRIGGER article_no_update BEFORE UPDATE ON article_archive BEGIN SELECT RAISE(ABORT,'article archive is append-only'); END;
CREATE TRIGGER article_no_delete BEFORE DELETE ON article_archive BEGIN SELECT RAISE(ABORT,'article archive is append-only'); END;

CREATE TABLE article_drive_outbox (
 event_id TEXT PRIMARY KEY REFERENCES article_archive(event_id),drive_file_id TEXT,synced_at INTEGER,attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at INTEGER NOT NULL DEFAULT 0,last_error TEXT,lease_until INTEGER NOT NULL DEFAULT 0,lease_token TEXT
);
CREATE TRIGGER article_drive_enqueue AFTER INSERT ON article_archive BEGIN INSERT INTO article_drive_outbox(event_id) VALUES(NEW.event_id); END;
CREATE TRIGGER articles_no_hard_delete BEFORE DELETE ON public_articles BEGIN SELECT RAISE(ABORT,'use reversible moderation'); END;
