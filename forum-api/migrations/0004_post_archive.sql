-- Version history and durable Drive outbox are committed with each post mutation.
CREATE TABLE post_archive (
 event_id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('questions','replies')),
 post_id TEXT NOT NULL, question_id TEXT, version INTEGER NOT NULL,
 event_type TEXT NOT NULL CHECK(event_type IN ('baseline','published','edited','deleted','restored')),
 name TEXT NOT NULL, department TEXT NOT NULL, body TEXT NOT NULL,
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, deleted_at INTEGER,
 UNIQUE(kind,post_id,version)
);
CREATE INDEX post_archive_post ON post_archive(kind,post_id,version DESC);
CREATE TABLE drive_outbox (
 event_id TEXT PRIMARY KEY REFERENCES post_archive(event_id),
 drive_file_id TEXT, synced_at INTEGER, attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at INTEGER NOT NULL DEFAULT 0, last_error TEXT,
 lease_until INTEGER NOT NULL DEFAULT 0, lease_token TEXT
);
CREATE INDEX drive_outbox_pending ON drive_outbox(synced_at,next_attempt_at,lease_until);
CREATE TRIGGER post_archive_enqueue AFTER INSERT ON post_archive BEGIN
 INSERT INTO drive_outbox(event_id) VALUES(NEW.event_id);
END;
CREATE TRIGGER post_archive_no_update BEFORE UPDATE ON post_archive BEGIN
 SELECT RAISE(ABORT,'post archive is append-only');
END;
CREATE TRIGGER post_archive_no_delete BEFORE DELETE ON post_archive BEGIN
 SELECT RAISE(ABORT,'post archive is append-only');
END;

INSERT INTO post_archive(event_id,kind,post_id,question_id,version,event_type,name,department,body,created_at,updated_at,deleted_at) SELECT 'questions:'||id||':v'||version,'questions',id,id,version,'baseline',name,department,body,created_at,updated_at,deleted_at FROM public_questions;
CREATE TRIGGER archive_questions_insert AFTER INSERT ON public_questions BEGIN
 INSERT INTO post_archive(event_id,kind,post_id,question_id,version,event_type,name,department,body,created_at,updated_at,deleted_at) VALUES('questions:'||NEW.id||':v'||NEW.version,'questions',NEW.id,NEW.id,NEW.version,'published',NEW.name,NEW.department,NEW.body,NEW.created_at,NEW.updated_at,NEW.deleted_at);
END;
CREATE TRIGGER archive_questions_update AFTER UPDATE ON public_questions WHEN NEW.version<>OLD.version BEGIN
 INSERT INTO post_archive(event_id,kind,post_id,question_id,version,event_type,name,department,body,created_at,updated_at,deleted_at) VALUES('questions:'||NEW.id||':v'||NEW.version,'questions',NEW.id,NEW.id,NEW.version,CASE WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN 'deleted' WHEN OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN 'restored' ELSE 'edited' END,NEW.name,NEW.department,NEW.body,NEW.created_at,NEW.updated_at,NEW.deleted_at);
END;
CREATE TRIGGER public_questions_no_hard_delete BEFORE DELETE ON public_questions BEGIN
 SELECT RAISE(ABORT,'use reversible moderation');
END;

INSERT INTO post_archive(event_id,kind,post_id,question_id,version,event_type,name,department,body,created_at,updated_at,deleted_at) SELECT 'replies:'||id||':v'||version,'replies',id,question_id,version,'baseline',name,department,body,created_at,updated_at,deleted_at FROM public_replies;
CREATE TRIGGER archive_replies_insert AFTER INSERT ON public_replies BEGIN
 INSERT INTO post_archive(event_id,kind,post_id,question_id,version,event_type,name,department,body,created_at,updated_at,deleted_at) VALUES('replies:'||NEW.id||':v'||NEW.version,'replies',NEW.id,NEW.question_id,NEW.version,'published',NEW.name,NEW.department,NEW.body,NEW.created_at,NEW.updated_at,NEW.deleted_at);
END;
CREATE TRIGGER archive_replies_update AFTER UPDATE ON public_replies WHEN NEW.version<>OLD.version BEGIN
 INSERT INTO post_archive(event_id,kind,post_id,question_id,version,event_type,name,department,body,created_at,updated_at,deleted_at) VALUES('replies:'||NEW.id||':v'||NEW.version,'replies',NEW.id,NEW.question_id,NEW.version,CASE WHEN OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN 'deleted' WHEN OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN 'restored' ELSE 'edited' END,NEW.name,NEW.department,NEW.body,NEW.created_at,NEW.updated_at,NEW.deleted_at);
END;
CREATE TRIGGER public_replies_no_hard_delete BEFORE DELETE ON public_replies BEGIN
 SELECT RAISE(ABORT,'use reversible moderation');
END;
