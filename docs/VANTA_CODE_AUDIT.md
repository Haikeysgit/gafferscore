# Lightweight Code Audit — GafferScore

Reviewed cheaply, because Haikeys is not paying token rent.

## Scope

Quick pass over:

- project structure
- package scripts/dependencies
- README and environment docs
- API routes under `app/api`
- Supabase admin usage
- obvious secret/debug patterns

No full build was run in this pass.

## What looks good

- Clear Next.js App Router structure.
- TypeScript across the app.
- Supabase admin client is isolated in `lib/supabase/admin.ts` and explicitly marked server-side only.
- Sync endpoints use `crypto.timingSafeEqual` instead of plain string comparison.
- Product concept is legible from the README: EPL prediction game, scoring, leaderboard.

## Findings

### 1. README env docs are incomplete

The code references more environment variables than the README lists.

Currently documented:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Also referenced in code:

- `SUPABASE_SERVICE_ROLE_KEY`
- `SYNC_SECRET`
- `FOOTBALL_DATA_API_KEY`
- `GROQ_API_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `JWT_SECRET`

Impact: new contributors/deploys will fail by surprise.

Suggested fix: add `.env.example` and expand README setup docs.

### 2. Powerful maintenance routes use query-string secrets

Routes like `/api/sync`, `/api/sync/scores`, `/api/reset`, and `/api/reminders` read `?key=...`.

This works, but query strings can leak through logs, browser history, analytics, reverse proxies, and screenshots.

Suggested fix: prefer an `Authorization: Bearer <secret>` header, while optionally keeping query support temporarily for cron compatibility.

### 3. Reset route is intentionally destructive

`/api/reset` wipes predictions, fixtures, and gameweeks before resyncing.

The secret check helps, but the endpoint deserves extra hardening because one exposed secret could become a very bad afternoon.

Suggested hardening:

- only allow POST
- require a second confirmation value, e.g. `{ "confirm": "RESET_GAFFERSCORE" }`
- log who/what triggered it where possible
- optionally restrict by deployment environment

### 4. AI chat endpoint trusts client-provided match context/history

`app/api/gaffer/chat/route.ts` accepts `conversationHistory` and `allMatches` from the request body, then forwards them into the LLM context.

Impact: users can shape the model's context and potentially bypass intended behavior. Not catastrophic, but it weakens the "only answer about provided matches" guardrail.

Suggested fix: fetch trusted match data server-side by fixture/gameweek ID, and sanitize/limit conversation history before sending to Groq.

### 5. Public repo contains heavy agent/generated folders

There are `.agent`, `.agents`, and `skills-lock.json`-style artifacts in the repo. If these are not required at runtime, they add noise and may confuse contributors.

Suggested fix: move them to internal docs or exclude from the product repo unless they are part of the actual workflow.

## Cheap next steps

1. Add `.env.example`.
2. Update README setup instructions.
3. Change cron/admin endpoints to accept bearer headers.
4. Add a safety confirmation to reset.
5. Add one CI check: `npm run lint` on PRs.

## Verdict

Promising product. Sane stack. Main risk is not architecture — it is operational hygiene around secrets, maintenance routes, and contributor setup.

Translation for the group chat: the app is not broke, it is pre-hardened.
