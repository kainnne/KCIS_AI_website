# KCIS AI Forum API

Cloudflare Worker and D1 backend for `/forum/` on the existing AI Tools site. No GPT Sites runtime is used.

## Deployment

- Frontend: `https://ai-tools.kcis.kainnne.com/forum/` (GitHub Pages; publish only after backend configuration).
- API: `https://kcis-ai-forum-api.chaos60649.workers.dev`.
- Worker: `kcis-ai-forum-api`; database: `kcis-ai-forum`.
- CORS: exact frontend origin, configured in `wrangler.json`.
- Frontend build variable: `NEXT_PUBLIC_FORUM_API_URL` (public URL, no credential).
- Latest status, 2026-09-16: initial API and schema deployed; SMTP credential transfer awaiting owner approval. Full login and frontend publication are not yet complete.

Run `wrangler d1 migrations apply kcis-ai-forum --remote`, then `wrangler deploy` from this directory. Use an authenticated Cloudflare account. Existing local networking requires `NODE_OPTIONS=--dns-result-order=ipv4first` for Wrangler.

The Worker needs encrypted secrets: `OTP_SECRET` (random 32-byte or longer secret), `ADMIN_EMAIL` (one verified school account belonging to the operator), `SMTP_USER`, `SMTP_PASS` (Gmail application password). Never put their values in this repository or frontend configuration. Reusing credentials from another project requires explicit owner approval. Do not rotate OTP_SECRET during an ordinary redeploy.

## Access and data

- Exact school domains: `kcis.com.tw`, `kcis.ntpc.edu.tw`. Verified accounts become pending teachers; only the configured administrator bootstraps as active.
- Administrator approves or suspends accounts in Members. Approval/suspension invalidates existing sessions; the member signs in again.
- Email is visible only in the administrator membership view. Posts show nicknames. UUID ownership never changes with nicknames.
- Random bearer sessions last 24 hours; only their SHA-256 hashes are stored in D1. The frontend keeps the token in sessionStorage so tab closure ends local persistence. A token is never included in URLs or logs. This avoids dependence on third-party cookies between GitHub Pages and workers.dev.
- OTP is HMAC protected, expires in 10 minutes, has at most 5 verification attempts, and is atomically consumed. Resend cooldown is 60 seconds; daily limits are 5 per email, 100 per IP and 200 globally. There are no automatic retry loops or paid-plan upgrades.
- No email lookup/teacher roster import or password migration. No AI model receives forum content.
- Withdrawals clear the body immediately and retain a tombstone to preserve others' replies. Edits use optimistic versions. Server timestamps and identities are authoritative. Idempotency IDs prevent duplicate post/reply submission.
- Nightly cleanup removes expired sessions, codes and rate buckets, plus audit entries older than 90 days. D1 recovery retention depends on the existing account plan. Configure longer-term export/restore policy before relying on the forum for archival records.
- No application logs contain OTP, message content, tokens or SMTP credentials; Worker request observability is disabled. Infrastructure providers may still have their own operational logs.

## Checks

`node --test test/*.test.mjs` requires Node with `node:sqlite` support. Tests use an in-memory SQLite adapter and a simulated SMTP socket; no email is sent. They cover domain restrictions, approval, suspension, CORS, ownership, OTP expiry/replay/lockout, optimistic updates, withdrawal, idempotency, cleanup and SMTP TLS/authentication sequencing.

Production checks may read `/api/health` and verify unauthenticated requests are denied. SMTP login can be checked without RCPT/DATA; end-to-end OTP delivery must be performed by the operator using an explicitly approved account. Do not send test mail to colleagues.

Rollback: restore the previous frontend commit through the normal Pages workflow and the previous Worker version if necessary. Preserve D1; never drop or recreate the database as a rollback.
