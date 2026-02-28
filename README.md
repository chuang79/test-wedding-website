# C+J Wedding — Guest Portal

A private, invitation-only wedding website with household RSVP, multilingual support, a rule-based guest chat assistant, and a password-protected admin dashboard.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Plain CSS (`globals.css`) — no CSS framework |
| i18n | next-intl |
| Database ORM | Prisma |
| Database | PostgreSQL (hosted on Supabase) |
| Auth | Supabase Auth (magic link, server-side) |
| Email | Resend |
| Smooth scroll | Lenis |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout — mounts SmoothScroll
│   ├── smooth-scroll.tsx             # Lenis client component
│   ├── globals.css                   # All styles (single stylesheet, no modules)
│   ├── [locale]/                     # All guest-facing routes (i18n-prefixed)
│   │   ├── layout.tsx                # Site shell: header, nav, footer, locale switcher
│   │   ├── page.tsx                  # Home — sticky-stack chapter flow
│   │   ├── rsvp/
│   │   │   ├── page.tsx              # RSVP page (server component wrapper)
│   │   │   └── rsvp-form.tsx         # RSVP form (client component)
│   │   ├── faq/page.tsx              # FAQ page
│   │   └── chat/page.tsx             # Guest chat assistant
│   ├── admin/
│   │   ├── page.tsx                  # RSVP dashboard (server-rendered, auth-gated)
│   │   └── login/page.tsx            # Magic link login
│   ├── api/
│   │   ├── guest/
│   │   │   ├── lookup/route.ts       # GET  — validate invite code
│   │   │   └── rsvp/route.ts         # GET/POST — fetch or submit RSVP
│   │   ├── admin/
│   │   │   ├── send-magic-link/route.ts
│   │   │   └── export/route.ts       # CSV export of all RSVPs
│   │   └── chat/route.ts             # Rule-based chat API
│   └── auth/callback/route.ts        # Supabase OAuth callback
├── lib/
│   ├── prisma.ts                     # Prisma client singleton
│   ├── supabase/
│   │   ├── server.ts                 # SSR Supabase client
│   │   └── browser.ts                # Client-side Supabase client
│   ├── auth.ts                       # requireAdminUser() helper
│   ├── rsvp.ts                       # Validation, deadline, normalisation
│   ├── chat.ts                       # Keyword-matching FAQ logic
│   ├── notifications.ts              # Resend email on RSVP submit
│   ├── csv.ts                        # CSV export logic
│   └── env.ts                        # Typed environment variable access
├── i18n/
│   ├── routing.ts                    # Locale list and default
│   └── request.ts                    # Per-request locale resolution
├── messages/
│   ├── en.json
│   ├── zh-TW.json
│   └── zh-CN.json
└── middleware.ts                     # next-intl locale routing middleware
prisma/
├── schema.prisma
└── seed.ts
scripts/
└── import-households.ts              # Bulk import from CSV
```

---

## Database Schema

All data lives in PostgreSQL via Prisma. The connection uses two URLs: `DATABASE_URL` for pooled connections (Prisma runtime) and `DIRECT_URL` for migrations.

### `Household`
One record per invited household. `code` is a short unique invite code guests enter to look up their RSVP. `maxGuests` caps attendee counts during validation.

### `Event`
Each individual wedding event (welcome dinner, ceremony, breakfast, etc.) that guests RSVP to separately. `sortOrder` controls display order; `enabled` soft-hides events without deleting them.

### `HouseholdEventResponse`
Per-household, per-event attendance decision. Unique on `(householdId, eventId)`. Stores `attending` (bool) and `attendeeCount` (zeroed automatically when `attending` is false).

### `HouseholdRsvp`
Top-level RSVP record per household (one-to-one with `Household`). Holds `dietaryNotes`, `plushieCount`, `karaokeSongsText`, and `submittedAt` timestamp.

### `RsvpAuditLog`
Immutable append-only log of every RSVP submission. Stores full payload JSON, `actorType` (`guest`), and `action` (`guest.submit`). Never updated or deleted.

---

## Key Features

### RSVP flow
1. Guest enters their household invite code on `/[locale]/rsvp`.
2. `GET /api/guest/rsvp?code=...` validates the code and returns household details plus any existing submission.
3. Guest fills the form and submits. `POST /api/guest/rsvp` runs a Prisma transaction: upserts `HouseholdRsvp`, upserts one `HouseholdEventResponse` per event, appends an `RsvpAuditLog` entry.
4. On success, Resend fires an email notification to the couple.
5. Submissions after `RSVP_DEADLINE` are accepted but flagged `late: true` in the response and in the audit log. The form warns guests but does not block.

### Admin dashboard (`/admin`)
- Auth-gated via `requireAdminUser()`: calls Supabase `auth.getUser()`, then checks the email against `ADMIN_ALLOWED_EMAILS`. Unapproved emails redirect to `/admin/login?error=unauthorized`.
- Login uses Supabase magic link sent via `POST /api/admin/send-magic-link` (uses the service role key to bypass RLS).
- Dashboard shows all households, RSVP status, and per-event attendance counts in a table.
- `GET /api/admin/export` streams a CSV for offline use.

### Multilingual (i18n)
- Three locales: `en`, `zh-TW`, `zh-CN`. Default is `en`.
- next-intl middleware rewrites all guest routes to `/[locale]/...`. Admin and API routes are excluded via the middleware matcher.
- Translation strings live in `src/messages/*.json`. Some home-page copy is hardcoded as inline typed objects keyed by locale in `page.tsx` (avoids adding translation keys for one-off strings).
- The locale switcher in the header links to `/<locale>` and next-intl's `Link` handles the rewrite.

### Guest chat assistant
- Rule-based keyword matcher in `src/lib/chat.ts` — no LLM involved.
- Each locale has its own `Rule[]` list (keywords + answer pairs) covering parking, dress code, deadline, and event schedule.
- Falls back to a "try the FAQ" message if no keyword matches.
- Exposed via `POST /api/chat`, called client-side from the chat page.

### Smooth scroll
- Lenis (`src/app/smooth-scroll.tsx`) is mounted in the root layout and applies to all pages.
- Uses exponential-decay easing (`t => Math.min(1, 1.001 - 2^(-10t))`) with `duration: 1.2s` — approximates the spring-physics scroll feel of Framer-built sites.
- Respects `prefers-reduced-motion`: sets `duration: 0` so Lenis passes events through immediately, matching native scroll behaviour.

---

## Routing

| Path | Description |
|---|---|
| `/` | Redirects to `/en` (middleware default locale) |
| `/[locale]` | Home — sticky-stack chapter sections |
| `/[locale]/rsvp` | RSVP form |
| `/[locale]/faq` | FAQ |
| `/[locale]/chat` | Guest chat assistant |
| `/admin` | RSVP dashboard (auth required) |
| `/admin/login` | Magic link login |
| `/api/guest/lookup` | Invite code validation |
| `/api/guest/rsvp` | RSVP read / write |
| `/api/admin/send-magic-link` | Trigger Supabase magic link |
| `/api/admin/export` | CSV download |
| `/api/chat` | Chat assistant |
| `/auth/callback` | Supabase auth redirect handler |

---

## Environment Variables

```bash
# Database (Supabase connection strings)
DATABASE_URL=           # Pooled — used by Prisma at runtime
DIRECT_URL=             # Direct — used by Prisma migrate

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Server-only; used to send magic links

# App
NEXT_PUBLIC_SITE_URL=        # Full URL, used as the magic link redirect base
RSVP_DEADLINE=2027-05-13T23:59:00-07:00
VENUE_TIMEZONE=America/Los_Angeles

# Admin access (comma-separated)
ADMIN_ALLOWED_EMAILS=

# Email notifications via Resend
RESEND_API_KEY=
NOTIFY_FROM_EMAIL=
NOTIFY_TO_EMAIL=
```

---

## Local Development

```bash
npm install
npm run dev                  # http://localhost:3000

# Database
npm run prisma:generate      # Regenerate Prisma client after schema changes
npm run prisma:migrate       # Run pending migrations
npm run prisma:seed          # Seed events table

# Import guest list
npm run import:households -- ./households.sample.csv
```

CSV import expects headers: `householdName`, `maxGuests`, `contactEmail`, `localeDefault`, `notes`.

### Testing on mobile

| Method | How |
|---|---|
| Browser DevTools | Chrome F12 → device toolbar → pick a phone preset |
| Local network | `ipconfig getifaddr en0` → open `http://<ip>:3000` on any device on the same Wi-Fi |
| Explicit bind | `npm run dev -- -H 0.0.0.0` to ensure network binding |
| Public HTTPS tunnel | `npx ngrok http 3000` — works across networks, useful for auth redirect testing |
