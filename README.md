# SIP Compass

A focused SIP pause/reduction decision co-pilot prototype, built around the golden path in `Copilot.txt`.

## Run locally

1. Install Node.js (18.18+ recommended).
2. From this folder, run `npm install`.
3. Copy `.env.example` to `.env` and configure `DATABASE_URL` for PostgreSQL.
4. Create a Google OAuth web client. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI, then set `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and a random `AUTH_SECRET` in `.env` (`npx auth secret` can generate one).
5. Run `npm run db:generate`, then `npm run db:migrate` to apply the schema. For an existing prototype database without a migration history, review the schema changes and use `npx prisma db push` for local development. `npm run db:seed` adds illustrative data to the seeded account; sign in with that account's Google identity to see it.
6. Optionally set `GEMINI_API_KEY` to enable AI-written explanations. With no key or an API error, a deterministic guided explanation is shown instead.
7. Run `npm run dev` and open the local address printed in the terminal.

## What is in the prototype

- A responsive investor dashboard with portfolio, SIP, goal, risk, and market context.
- A pre-confirmation co-pilot for either pausing a SIP or reducing its monthly amount.
- Auth.js Google sign-in with database-backed sessions and a sign-out control.
- User-scoped portfolio, SIP, decision context, AI explanation, and decision-review API routes.
- Zod input validation and deterministic contribution arithmetic in `lib/calculations.ts`; the prototype does not predict returns.
- Prisma/PostgreSQL schema and synthetic seed data. The authentication boundary is a demo identity, not production auth.
- Gemini explanations are optional; AI cannot calculate impact or submit an investment instruction.
- The dashboard uses the signed-in user's stored SIP and portfolio data and shows an empty state when no active SIP exists. Shared market snapshots are not private user records.
- SIP change requests are recorded for review only. No live account connection or real order submission exists.

## Next implementation steps

1. Replace seeded example records with consented provider integrations and freshness metadata.
2. Add a separate verified transaction-provider integration only after review, authorization, and compliance requirements are established.
3. Configure production secrets, monitoring, rate limits, and deployment environment (for example Vercel plus Neon/Supabase PostgreSQL).

The included `Copilot.txt` is treated as a technical recommendation. This project uses its Next.js/TypeScript, Tailwind, Prisma/PostgreSQL, Zod, and Gemini direction while keeping the intelligence and action boundary explicit.
