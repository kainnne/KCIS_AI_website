CREATE TABLE users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, nickname TEXT NOT NULL DEFAULT '',
 role TEXT NOT NULL DEFAULT 'teacher' CHECK(role IN ('teacher','admin')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended')),
 created_at INTEGER NOT NULL
);
CREATE TABLE sessions (hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE otp (email TEXT PRIMARY KEY, challenge TEXT NOT NULL, hash TEXT NOT NULL, expires_at INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, sent_at INTEGER NOT NULL);
CREATE TABLE limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX limits_expiry ON limits(expires_at);
CREATE TABLE questions (
 id TEXT PRIMARY KEY, author_id TEXT NOT NULL REFERENCES users(id), body TEXT NOT NULL,
 resolved INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
 deleted_at INTEGER, version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX questions_created ON questions(created_at DESC,id);
CREATE TABLE replies (
 id TEXT PRIMARY KEY, question_id TEXT NOT NULL REFERENCES questions(id), author_id TEXT NOT NULL REFERENCES users(id),
 body TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, deleted_at INTEGER, version INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX replies_question ON replies(question_id,created_at);
CREATE TABLE audit (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, target_id TEXT NOT NULL, action TEXT NOT NULL, created_at INTEGER NOT NULL);
