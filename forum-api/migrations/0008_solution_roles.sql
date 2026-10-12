ALTER TABLE public_questions ADD COLUMN uploader_role TEXT NOT NULL DEFAULT 'teachers';
ALTER TABLE solution_archive ADD COLUMN uploader_role TEXT NOT NULL DEFAULT 'teachers';
DROP TRIGGER archive_question_solution;
CREATE TRIGGER archive_question_solution AFTER UPDATE ON public_questions
WHEN NEW.version<>OLD.version AND (NEW.resolved=1 OR OLD.resolved=1 OR EXISTS(SELECT 1 FROM solution_archive WHERE question_id=NEW.id)) BEGIN
 INSERT INTO solution_archive(event_id,question_id,version,markdown,created_at,deleted_at,uploader_role)
 VALUES('solution:'||NEW.id||':v'||NEW.version,NEW.id,NEW.version,
 '---'||char(10)||'kind: forum-solution'||char(10)||'question_id: '||NEW.id||char(10)||'version: '||NEW.version||char(10)||'status: '||CASE WHEN NEW.deleted_at IS NOT NULL THEN 'deleted' WHEN NEW.resolved=1 THEN 'resolved' ELSE 'unresolved' END||char(10)||'updated: '||strftime('%Y-%m-%dT%H:%M:%fZ',NEW.updated_at/1000.0,'unixepoch')||char(10)||'---'||char(10)||char(10)||'# AI 論壇解決紀錄'||char(10)||char(10)||'## 問題'||char(10)||NEW.body||char(10)||char(10)||'## 提問者'||char(10)||NEW.name||' · '||NEW.department||char(10)||char(10)||'## 解決方法'||char(10)||NEW.solution_method||char(10)||char(10)||'## 操作步驟'||char(10)||NEW.solution_steps||char(10)||char(10)||'## 驗證結果'||char(10)||NEW.solution_result||char(10),NEW.updated_at,NEW.deleted_at,NEW.uploader_role);
END;
