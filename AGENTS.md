# Crema

Takehome interview platform for Dripos engineering hires. Interviewers author an assessment (initial prompt, starter code, ordered follow-up tasks), invite a candidate with an 8-character code, and review submissions. Candidates work locally and submit links (Expo, deployment URL, repo, video), never code. Follow-up tasks unlock one at a time after each submission so the candidate cannot plan for them ahead.

Production: https://crema.dripos.com (Vercel project `crema`, team `abhishek-more`, auto-deploys from `main`).

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind v4
- shadcn/ui on **Base UI** (`base-nova` style), not Radix. `Button` defaults to `type="button"`; form submit buttons must set `type="submit"`. `asChild` does not exist; use the `render` prop.
- Drizzle ORM + Neon Postgres (`@neondatabase/serverless`, HTTP driver). Schema in `src/db/schema.ts`; apply with `pnpm drizzle-kit push` (no migration files).
- Vercel Blob (public store `takehome-files`) for starter zips
- Auth.js v5 (`next-auth@beta`) with Google for admins; `jose` JWT cookie for candidates
- Server actions for all mutations (`src/actions/*.ts`), `useActionState` on the client. No API routes except the Auth.js handler.
- `react-markdown` + `remark-gfm` for prompts, tasks, notes

## Layout

```
src/
  auth.ts                   Auth.js config, requireAdmin()
  db/schema.ts, db/index.ts
  actions/candidate.ts      startWithCode, submitStage
  actions/admin.ts          assessment/stage/invite/review mutations
  lib/invite.ts             status derivation, durations, deadline math
  lib/candidate-session.ts  cookie helpers
  lib/links.ts              link type labels (shared server/client)
  components/bits.tsx       ThemeToggle, SubmitButton, CopyButton, StatusBadge, selectClass
  components/markdown.tsx
  app/start                 candidate code entry
  app/c                     candidate workspace (single page, force-dynamic)
  app/login                 admin Google sign-in
  app/admin/candidates      table, detail (timeline + review), new invite dialog
  app/admin/assessments     list, editor (prompt, starter zip, stages)
```

## Domain rules

- Stage position 0 is the initial prompt; follow-ups are 1..n. Total deliverables = stages + 1.
- Current stage for a candidate = number of submissions. `submitStage` rejects a position that does not match, so double submits are no-ops.
- When a candidate first signs in, the assessment (prompt, starter URLs, time limit, stages) is copied onto `invites.snapshot`. Editing an assessment never changes an in-flight candidate. Read from the snapshot on the candidate side, always.
- Invite status is derived, not stored: revoked > finished (reviewed if any review exists, else submitted) > started (in progress) > invited. See `inviteStatus`.
- Time limit is soft. Candidates see a countdown and can go over; admins see `+Xm late` on stages and total. Nothing is blocked by the deadline.
- Codes are 8 chars from an alphabet without 0/O/1/I. A code stops working once the invite is revoked or finished.
- Admin access is any Google account on `ADMIN_EMAIL_DOMAIN` (default `dripos.com`). No roles.
- Reviews are one row per (invite, reviewer), upserted. Scores are 1-5 per stage position.

## Environment

`DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ADMIN_EMAIL_DOMAIN`. Pull with `vercel env pull .env.local`. Google OAuth redirect URIs: `https://crema.dripos.com/api/auth/callback/google` and `http://localhost:3111/api/auth/callback/google`.

Local dev: `pnpm dev -p 3111`. If your shell exports a `DATABASE_URL` from another project it shadows `.env.local`; set it explicitly when starting.

## Infra

- DNS: `crema.dripos.com` is a CNAME to `cname.vercel-dns.com` in the Route 53 zone for `dripos.com` (AWS account 905410892446).
- Vercel deployment protection is `all_except_custom_domains`, so only `crema.dripos.com` is public; `*.vercel.app` URLs require Vercel SSO.
- Vercel project settings that the CLI cannot express (domains, redirects, protection) are edited via the REST API.

## Conventions

- Guard clauses, happy path at the lowest indent.
- Native `<select>` with `selectClass`, not the shadcn Select, inside forms.
- Constants shared between server and client components live in `src/lib`, not in `"use client"` files (importing a non-component export from a client module into a server component yields a client reference, not the value).
- Server component pages that read the DB are `force-dynamic`.
- Deliberate shortcuts carry a `ponytail:` comment naming the ceiling and the upgrade path.

## Not built (on purpose)

Notifications, candidate/admin messaging, in-browser editor or sandbox, real-time updates, roles, AI grading. Starter zips are capped at 4MB by the server action body limit; move to `@vercel/blob` client uploads if that becomes a problem.
