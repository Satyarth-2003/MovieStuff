# Adda247 Screening Seat Selection

Internal seat-reservation tool for the Adda247 employee screening of **Mirzapur: The Movie** (05 Sep, 02:45 PM). No pricing, no payments — employees sign in with Google, pick one open seat, and confirm. Admins manage the approved employee list and the seat map from `/admin`.

## Stack

- Next.js 14 (App Router, TypeScript)
- NextAuth (Google provider) for both employee and admin sign-in — the same login gates access by checking the signed-in email against the approved list (employee) or `ADMIN_EMAILS` (admin)
- Upstash Redis (REST, works on Vercel Edge/Serverless) as the only datastore. Seat reservation is done with a Lua script executed via `EVAL`, which Redis runs atomically — this is what guarantees only one of two simultaneous requests for the same seat can win.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to get it |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Vercel → Storage → Marketplace → Upstash → create a Redis database → copy the REST credentials (or from the Upstash console directly). |
| `NEXTAUTH_SECRET` | Any long random string, e.g. `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | `http://localhost:3000` locally; your deployed URL in production. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application). Add `http://localhost:3000/api/auth/callback/google` and `https://<your-domain>/api/auth/callback/google` as authorized redirect URIs. |
| `ADMIN_EMAILS` | Comma-separated Google account emails allowed into `/admin`, e.g. `admin1@adda247.com,admin2@adda247.com`. |

## Local development

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

- **Employees**: redirected to `/login`, sign in with Google. Only emails on the approved list (managed from the admin dashboard) are allowed through — everyone else gets "not on the approved employee list".
- **Admins**: go to `/admin`, redirected to `/admin/login`. Only emails in `ADMIN_EMAILS` are allowed through.

## Deploying to Vercel

This repo is already a local git repository (`git log` to check) — either push it to GitHub/GitLab/Bitbucket and import it from the Vercel dashboard, or deploy straight from the CLI:

```bash
vercel login   # interactive — opens a browser/email confirmation
vercel link    # or `vercel` to create + link a new project
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production        # https://<your-vercel-domain>
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
vercel env add ADMIN_EMAILS production
vercel --prod
```

1. **Upstash Redis**: in the Vercel dashboard → your project → Storage → Marketplace Database Providers → Upstash → create a Redis database. This auto-populates `UPSTASH_REDIS_REST_URL`/`TOKEN` as project env vars, so you can skip those two `vercel env add` calls above if you provision it this way.
2. **Google OAuth redirect URI**: in Google Cloud Console → APIs & Services → Credentials → your OAuth client → Authorized redirect URIs, add `https://<your-vercel-domain>/api/auth/callback/google` (keep `http://localhost:3000/api/auth/callback/google` too, for local dev). Vercel preview deployments get their own random domain each time, so redirect URIs only reliably work for `localhost` and the production domain — use `vercel --prod` / the assigned production domain for anything you need Google sign-in to work on.
3. Rows A and B are always admin-reserved and never shown as selectable to employees, regardless of environment — this is enforced server-side, not just in the UI.

## Data model (Redis)

- `whitelist` — Set of approved employee emails.
- `employee:{email}` — Hash: `name`, `email`, `role`, `seat`, `status`, `bookingTime`.
- `seat:{seatId}` — String holding the owner's email; only exists once a seat is reserved. Presence of this key is the source of truth for "is this seat taken," and it's set/checked atomically by a Lua script so two simultaneous confirmations for the same seat can't both succeed.

## What was intentionally left out

Per the request, there's no pricing, seat categories (Gold/Premium/Recliner), payment, or checkout anywhere in the UI or API responses — seats are simply available, selected, reserved, or admin-reserved (rows A & B).
