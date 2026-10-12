CREATE TABLE account_profiles(owner_hash TEXT PRIMARY KEY,name TEXT NOT NULL,department TEXT NOT NULL,updated_at TEXT NOT NULL);
ALTER TABLE public_articles ADD COLUMN department TEXT NOT NULL DEFAULT '教職員';
ALTER TABLE article_archive ADD COLUMN department TEXT NOT NULL DEFAULT '教職員';
CREATE TRIGGER archive_article_profile AFTER UPDATE ON public_articles
WHEN NEW.version<>OLD.version AND (NEW.name<>OLD.name OR NEW.department<>OLD.department) BEGIN
 INSERT INTO article_archive(event_id,article_id,version,title,author,department,markdown,created_at,deleted_at)
 VALUES('article:'||NEW.id||':v'||NEW.version,NEW.id,NEW.version,NEW.title,NEW.name,NEW.department,
 '---'||char(10)||'kind: forum-article'||char(10)||'article_id: '||NEW.id||char(10)||'version: '||NEW.version||char(10)||'title: '||json_quote(NEW.title)||char(10)||'author: '||json_quote(NEW.name)||char(10)||'department: '||json_quote(NEW.department)||char(10)||'status: '||CASE WHEN NEW.deleted_at IS NOT NULL THEN 'deleted' ELSE 'published' END||char(10)||'---'||char(10)||char(10)||'# '||NEW.title||char(10)||char(10)||NEW.body||char(10)||char(10)||'作者：'||NEW.name,NEW.updated_at,NEW.deleted_at);
END;
