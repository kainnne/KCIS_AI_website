ALTER TABLE public_questions ADD COLUMN solution_method TEXT NOT NULL DEFAULT '';
ALTER TABLE public_questions ADD COLUMN solution_steps TEXT NOT NULL DEFAULT '';
ALTER TABLE public_questions ADD COLUMN solution_result TEXT NOT NULL DEFAULT '';
CREATE TABLE solution_archive (
 event_id TEXT PRIMARY KEY, question_id TEXT NOT NULL, version INTEGER NOT NULL,
 markdown TEXT NOT NULL, created_at INTEGER NOT NULL,
 UNIQUE(question_id,version)
);
CREATE TABLE wikinb_outbox (
 event_id TEXT PRIMARY KEY REFERENCES solution_archive(event_id),
 synced_at INTEGER, attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at INTEGER NOT NULL DEFAULT 0, lease_until INTEGER NOT NULL DEFAULT 0, lease_token TEXT,
 last_error TEXT
);
CREATE TRIGGER solution_archive_enqueue AFTER INSERT ON solution_archive BEGIN
 INSERT INTO wikinb_outbox(event_id) VALUES(NEW.event_id);
END;
CREATE TRIGGER solution_archive_no_update BEFORE UPDATE ON solution_archive BEGIN
 SELECT RAISE(ABORT,'solution archive is append-only');
END;
CREATE TRIGGER solution_archive_no_delete BEFORE DELETE ON solution_archive BEGIN
 SELECT RAISE(ABORT,'solution archive is append-only');
END;
