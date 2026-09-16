# KCIS AI Forum API

Cloudflare Worker and D1 backend for the third card on the AI Tools homepage.

- Frontend: https://ai-tools.kcis.kainnne.com/forum/ (GitHub Pages).
- API: https://kcis-ai-forum-api.chaos60649.workers.dev.
- Worker: `kcis-ai-forum-api`; database: `kcis-ai-forum`.
- Frontend build variable: `NEXT_PUBLIC_FORUM_API_URL`, a public URL.

## Deployment

From this directory, run `wrangler d1 migrations apply kcis-ai-forum --remote`, then `wrangler deploy`, using the existing authenticated Cloudflare account. Local networking may require `NODE_OPTIONS=--dns-result-order=ipv4first`. The frontend publishes through `.github/workflows/deploy-pages.yml` on pushes to main.

No login, SMTP, email address, OTP or account approval is required. No secrets from other projects are needed. The AI binding uses the account's existing Workers AI access; deployment does not upgrade the account plan.

## Identity and access

The entry screen asks for name and department before displaying the forum. These are self-entered labels, not verified identities or an access-control boundary. API reads are public. Each question/reply records the submitted name and department.

A browser-generated random 256-bit capability is kept in localStorage. Only its SHA-256 hash is stored with posts, and it is never included in public API responses. It allows editing and withdrawing posts from that browser. Clearing browser storage loses that ability. Reusing a name or department does not grant ownership. The entry fields are prefilled from sessionStorage but still require explicit entry on a new page load.

The old authentication schema remains unused. Migration 0002 creates separate public tables and does not expose or migrate any private legacy content. CORS permits only the configured frontend origin for browser requests; it is not authentication. Rate counters limit writes, and version checks prevent lost edits. Client IDs prevent duplicate submission on retries.

Withdrawal clears the author's name, department and body, retaining a tombstone and other people's replies. Operational moderation can use the authenticated D1 console for specific post IDs; there is no public administrator route.

## Translation

Each question and reply offers English and Traditional Chinese translation. Only the chosen post body is sent to Cloudflare Workers AI when requested; name/department are not added to the inference input. Translations render as plain text. Original content is retained.

The model is `@cf/meta/llama-3.1-8b-instruct-fp8-fast`, with 4,096 output tokens maximum. Results are cached by post ID, version and target language. Edits invalidate old translations; withdrawal makes translation unavailable. A global daily cap of 40 new translations bounds inference use, while cached results remain available. The account's shared Workers AI quota may also limit requests. No automatic retry loops or plan upgrades are performed.

Nightly cleanup removes expired rate counters and translations older than 30 days. Request observability is disabled; application errors do not include credentials or internal error details.

## Checks and rollback

`node --test test/*.test.mjs` uses an in-memory SQLite D1 adapter and mocked AI responses. It covers public access, required identity, ownership, CORS, idempotency, version conflicts, withdrawal, translation caching/invalidation, rate caps and cleanup.

Production health: `GET /api/health`. Rollback uses the previous frontend commit and Worker version. Preserve D1; never drop or recreate it as a rollback.
