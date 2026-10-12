CREATE TABLE translation_jobs (
 kind TEXT NOT NULL, post_id TEXT NOT NULL, version INTEGER NOT NULL, target TEXT NOT NULL,
 claim_id TEXT NOT NULL, expires_at INTEGER NOT NULL,
 PRIMARY KEY(kind,post_id,version,target)
);
