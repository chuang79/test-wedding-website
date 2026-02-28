# Wedding RSVP Site

Next.js + Supabase + Prisma implementation for a multilingual wedding RSVP website.

## Features in this scaffold
- Invite-code household RSVP flow
- Multi-event responses (yes/no + attendee count)
- Custom fields: dietary notes, plushie count, karaoke songs
- Soft-close deadline behavior
- Admin dashboard with CSV export
- Magic-link admin login via Supabase
- Rule-based guest FAQ chatbot
- i18n: English, Traditional Chinese, Simplified Chinese

## Quick start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env.local
   ```
3. Set required variables in `.env.local` (Supabase keys, database URL, admin email allowlist).
4. Generate Prisma client and run migration:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```
5. Seed events and demo household:
   ```bash
   npm run prisma:seed
   ```
6. Start development server:
   ```bash
   npm run dev
   ```

## CSV import for households
Expected CSV headers:
- `householdName`
- `maxGuests`
- `contactEmail`
- `localeDefault`
- `notes`

Run:
```bash
npm run import:households -- ./households.csv
```

You can start from `households.sample.csv`.

## Important routes
- `/{locale}` home
- `/{locale}/rsvp` RSVP form
- `/{locale}/faq` FAQ
- `/{locale}/chat` guest assistant
- `/admin/login` admin magic-link login
- `/admin` admin dashboard
