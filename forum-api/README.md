# KCIS AI Forum API

Cloudflare Worker and D1 backend for the third card on the AI Tools homepage.

- Frontend: https://ai-tools.kcis.kainnne.com/forum/ (GitHub Pages).
- API: https://kcis-ai-forum-api.chaos60649.workers.dev.
- Worker: `kcis-ai-forum-api`; database: `kcis-ai-forum`.
- Frontend build variable: `NEXT_PUBLIC_FORUM_API_URL`, a public URL.

## Identity and permissions (development version)

WikiNB KCIS and AI Tools share school-email OTP and nickname settings. AI Tools hosts the sign-in control. The frontend retrieves a short-lived shared-session response from the configured HTTPS auth API, using its HttpOnly cookie. Forum requests carry the signed JWT; the Worker independently verifies HS256, expiry and the allowed school domain. `SESSION_SECRET` must match the auth server and must be configured only as a Worker secret.

Visitors can read and reply with a temporary editing capability. Verified school accounts can ask questions; ownership is derived from the verified email, never the entered name. The only administrator is `kainnne@kcis.com.tw`. The previous name/department management condition is no longer accepted. Legacy posts without an account association remain manageable by the administrator; they are not claimed by matching names.

Only the verified author or administrator can resolve/reopen a question. Resolving requires solution, steps and verification result. Resolved questions cannot be edited directly or withdrawn; administrator moderation is reversible and preserves originals.

Migrations 0005–0006 add immutable solution Markdown and a durable WikiNB delivery queue. Configure backend-only `WIKINB_API_URL` and `WIKINB_INGEST_SECRET` (32+ characters) to deliver to `/api/library/forum-solutions`. The same ingest secret belongs in WikiNB's backend `.env`. Delivery retries and import version checks are idempotent. Admin hide/restore propagates to the school library, while every prior version remains stored. Drive version snapshots also include their solution Markdown. Missing delivery/Drive settings keep records in the database queue; they do not mean cloud backup has completed.

The newer auth/resolution backend is currently verified locally, not deployed to production. Apply all migrations through 0006 before deploying it and configure the shared HTTPS login service first. Never publish a signing/ingest secret as `NEXT_PUBLIC_*`.

## Translation

Visible questions and replies automatically translate to the selected interface language, with an original-text toggle in the thread. Requests are queued and shared in the browser; concurrent readers share a D1 translation lease. Only the post body is sent to Cloudflare Workers AI; name/department are not added to the inference input. Translations render as plain text. Original content is retained.

The model is `@cf/meta/llama-3.1-8b-instruct-fp8-fast`, with a length-dependent output allowance of 256–8,192 tokens. Results are cached by post ID, version and target language. Edits invalidate old translations. Failed, stale or truncated output is not cached; the original remains available. New inferences reserve a conservative estimated Neuron allowance before running. `TRANSLATION_DAILY_LIMIT` defaults to 200 calls and `TRANSLATION_DAILY_NEURONS` to 8,000 estimated Neurons per UTC day; cached results remain available at the cap. The account's shared Workers AI quota may also limit requests. Only a pending lease is polled, up to four attempts; provider failures and quota errors are not retried automatically. No plan upgrade is performed. The account-wide free allowance is 10,000 Neurons/day, shared with other AI services: https://developers.cloudflare.com/workers-ai/platform/pricing/

Nightly cleanup removes expired rate counters, translation leases and translations older than 30 days. Request observability is disabled; application errors do not include credentials or internal error details.

## Version archive and Drive backup

Migration 0004 adds append-only `post_archive` snapshots and a durable `drive_outbox`. Publishing, editing, hiding and restoring commit a new original-text version and its backup job in the same database transaction. Cleanup never removes these versions. Existing posts become baseline snapshots; previously overwritten or cleared content cannot be recovered.

Drive is not connected by default. Configure backend-only `DRIVE_FOLDER_ID`, `DRIVE_CLIENT_ID`, `DRIVE_CLIENT_SECRET` and `DRIVE_REFRESH_TOKEN` to enable the five-minute scheduled upload. Each version is a separate JSON file. Retries preserve a preallocated Drive file ID and verify conflicting files before marking a job successful. No author editing capabilities are exported. This is an asynchronous content backup, not a complete D1 restore image.

Authenticated management endpoints expose `/api/admin/backup-status` and `/api/admin/archive?kind=questions&post_id=<UUID>` (also `kind=replies`). The interface shows retained versions and Drive pending/synced status. Resolution status and required solution fields are available through the authenticated resolution endpoint.

Portable handoff documentation and scripts are maintained in `scripts/handoff/templates/` at the repository root. `scripts/package_handoff.py` builds an explicit-allowlist ZIP without local data, original account bindings or private management settings.

## Checks and rollback

`node --test test/*.test.mjs` uses an in-memory SQLite D1 adapter and mocked AI responses. It covers public access, required identity, ownership, CORS, idempotency, version conflicts, disabled withdrawal, translation caching/invalidation, concurrent readers, stale output, provider failures, rate caps, signed moderation sessions, hidden-content access, delete/restore version conflicts and cleanup.

Production health: `GET /api/health`. Rollback uses the previous frontend commit and Worker version. Preserve D1; never drop or recreate it as a rollback.

## Local interface preview

Requires Node 22.13 or later with `node:sqlite`. From the repository root, run in two terminals:

```bash
node forum-api/dev.mjs
node web/preview-local.mjs
```

Open `http://localhost:3000/forum/`. The API binds to 127.0.0.1:8787 and stores only local preview content in the ignored `forum-api/.local/forum.sqlite`. The frontend preview uses lockfile dependencies in a temporary runtime, mirrors edits in `web/src` and `web/public`, and supports hot reload. Stop both terminals with Ctrl+C.

The local adapter needs no Workers AI credentials; post/reply translation has been removed. Apply migrations through 0008 before deploying. Do not package `.env`, `.local/`, `.wrangler/` or dependencies.

Local auth requires `SESSION_SECRET` matching the local WikiNB API. Use `WIKINB_API_URL=http://localhost:8790` and the shared backend-only ingest secret for local delivery. `LOCAL_MODE` permits only localhost HTTP targets. The old local name/department admin configuration is ignored. Restart the API after changes; do not package `.env` or `.local` data.

## Shared login account exceptions (2026-10-08)

The shared backend now signs in with email + OTP only; it assigns the email local-part as the initial display name. The two explicitly approved exceptions are `chaos60649@gmail.com` (teacher) and `st101031616@gmail.com` (student); they still need a valid OTP-derived JWT. Other Gmail identities remain rejected. `EXTRA_ALLOWED_EMAILS` is an exact-address allowlist shared with the Node backend; an empty setting disables the exceptions. `dev.mjs` forwards this setting. These accounts do not gain administrator rights; moderation remains exclusive to `kainnne@kcis.com.tw`. The account exceptions are included in this release; secrets remain in the receiving backend and Worker configuration.


## 2026-10-09：文章分享與同步

`POST /api/articles` 接受 `id`（UUID）、`title`（160 字）、`body`（20,000 字），只允許已驗證教職員／管理員；名稱來自簽署帳號，不能由輸入假冒。`GET /api/articles` 是公開文章列表；分享前須確認內容可公開。WikiNB 的副本仍需校內登入才能讀。學生與訪客無分享權限。

0007 建立文章、不可變版本及 WikiNB／Drive outbox，0008 留存新問題的老師／學生來源。管理員可刪除或復原文章，無硬刪除。發布與歸檔在同一筆交易完成；任何歸檔失敗都拒絕發布。同步有租約、重試及版本去重；發布後背景嘗試，排程每五分鐘補送。排入佇列不等於已在 Drive 留存。

部署前先匯出 D1，套用 migrations，再部署 Worker。設定既有 `WIKINB_API_URL` 與 `WIKINB_INGEST_SECRET`；接手時換成主管的 API 網址與秘密，接收端必須開放限定 `/api/library/forum-articles` 路由。不要把 SMTP 或模型金鑰寫入 Worker。

已移除貼文／回覆翻譯路由和 Workers AI binding。舊翻譯資料表保留為相容歷史，不會再呼叫翻譯模型。介面語言切換與文章原文無關。


## Account profiles (2026-10-12)

Forum UI is English. The existing guest entrance layout is retained; a verified school session bypasses it automatically, without a transient guest form. The separate department control is removed. Main, Forum and WikiNB account buttons/dialogs use the same CSS, Name and Department fields, save feedback and sign-out confirmation.

Apply migration 0009 after backing up D1, then publish the Worker and configure the Node receiver FORUM_API_URL. POST /api/account/profile accepts a signed school account; name, department and revision come from the signed identity, not the request body. It atomically updates only owned current rows, appends versions through existing triggers and queues WikiNB/Drive snapshots. Replays and older revisions do not revert names. Owned IDs let the private receiver link old copies safely; no email/owner hash is exposed in public post responses. Permissions continue to depend on verified role/admin email. Unknown legacy guest ownership is never inferred from a display name.

The handoff allowlist already includes the new CSS, migration and source modules. Secrets and local test data are excluded from the source release.
