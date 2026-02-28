# Wedding RSVP Project Status

## Snapshot
- Reviewed on: **February 21, 2026**
- Project path: `~/Downloads/new-wedding-rsvp`
- Status type: **current implementation snapshot** (not a forward plan)

## What Is Implemented

### Core stack and project setup
- Next.js App Router project scaffolded with TypeScript.
- Dependencies declared for Prisma, Supabase, next-intl, and Resend.
- Environment templates and local env file are present (`.env.example`, `.env.local`).
- Prisma schema is defined for households, events, RSVP data, and audit logs.
- Seed script exists for 3 wedding events and one demo household.

### Guest-facing experience
- Localized routes are implemented:
  - `/{locale}`
  - `/{locale}/rsvp`
  - `/{locale}/faq`
  - `/{locale}/chat`
- Language support implemented for:
  - English (`en`)
  - Traditional Chinese (`zh-TW`)
  - Simplified Chinese (`zh-CN`)
- RSVP flow includes:
  - invite-code lookup
  - per-event attendance (yes/no + attendee count)
  - dietary notes
  - plushie count
  - karaoke song text input
  - success/error handling
  - soft-close late-warning behavior in UI

### API endpoints
- `POST /api/guest/lookup` implemented.
- `GET /api/guest/rsvp` implemented.
- `POST /api/guest/rsvp` implemented.
- `POST /api/chat` implemented (rule-based FAQ matching).
- `POST /api/admin/send-magic-link` implemented.
- `GET /api/admin/export` implemented (CSV download).

### Admin experience
- `/admin/login` implemented with magic-link request flow.
- `/admin` dashboard implemented with:
  - household counts
  - completion percentage
  - attendance-by-event summary
  - household response table
  - CSV export button
- Auth guard exists (`requireAdminUser`) and enforces optional email allowlist.

### Data validation and protection
- Invite code normalization is applied.
- Server-side RSVP validation includes:
  - non-negative plushie count
  - per-event response validity
  - duplicate event rejection
  - event ID allowlist check against enabled events
  - attendee count <= household maxGuests
- RSVP writes and audit-log entry are wrapped in a Prisma transaction.

### Utilities
- CSV import script exists (`scripts/import-households.ts`) and sample file is included (`households.sample.csv`).
- Notification helper exists using Resend (`src/lib/notifications.ts`).

## Partially Implemented / Conditional
- Email notifications on RSVP update are wired in code, but only send when `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL`, and `NOTIFY_TO_EMAIL` are configured.
- Admin auth relies on Supabase project configuration and valid redirect URL setup.
- Deadline uses `RSVP_DEADLINE` env parsing; `VENUE_TIMEZONE` is present but not used for timezone conversion logic.

## Not Implemented Yet (Compared to Original Plan)
- No dedicated webhook endpoint like `/api/webhooks/rsvp-notify`.
- No admin UI for manual RSVP override/editing.
- No admin-side household create/edit UI (household creation is via seed/import script only).
- No automated tests (unit/integration/e2e) are present.
- No Prisma migration files are committed yet (`prisma/migrations` not present).
- No custom-domain deployment/config automation included in repo.
- Cat-language mode is not present (intentionally deferred).

## Current Verification State
- Static code review completed across app routes, APIs, Prisma schema, i18n, and scripts.
- Local build artifacts exist in `.next`, indicating the app has been run locally at least once.
- In this shell session, `npm` is not currently available on PATH, so I could not run fresh `npm run lint` or `npm run build` verification.

## Known Risks / Gaps
- CSV parser in `scripts/import-households.ts` is simple split-based parsing and does not handle quoted commas.
- No test coverage currently protects regressions.
- Production readiness depends on correct Supabase + database environment setup.

## Suggested Immediate Next Steps
1. Ensure Node/NPM are available in shell, then run lint/build checks.
2. Generate and commit Prisma migrations.
3. Add admin edit/override capability for RSVP rows.
4. Add at least minimal API and form validation tests.
5. Harden CSV import parser if guest data may contain commas/quotes.
