CREATE TABLE public_questions (
 id TEXT PRIMARY KEY, owner_hash TEXT NOT NULL, name TEXT NOT NULL, department TEXT NOT NULL,
 body TEXT NOT NULL, resolved INTEGER NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, deleted_at INTEGER, version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX public_questions_created ON public_questions(created_at DESC,id);
CREATE TABLE public_replies (
 id TEXT PRIMARY KEY, question_id TEXT NOT NULL REFERENCES public_questions(id),
 owner_hash TEXT NOT NULL, name TEXT NOT NULL, department TEXT NOT NULL, body TEXT NOT NULL,
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, deleted_at INTEGER, version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX public_replies_question ON public_replies(question_id,created_at,id);
CREATE TABLE translations (
 kind TEXT NOT NULL, post_id TEXT NOT NULL, version INTEGER NOT NULL, target TEXT NOT NULL,
 body TEXT NOT NULL, created_at INTEGER NOT NULL,
 PRIMARY KEY(kind,post_id,version,target)
);
