function required(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const DEFAULT_ADMIN_EMAILS = 'jck.ooo.lic@gmail.com';

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_ANON_KEY: required('SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  RSVP_DEADLINE: process.env.RSVP_DEADLINE ?? '2027-05-13T23:59:00-07:00',
  VENUE_TIMEZONE: process.env.VENUE_TIMEZONE ?? 'America/Los_Angeles',
  ADMIN_ALLOWED_EMAILS: (process.env.ADMIN_ALLOWED_EMAILS?.trim() || DEFAULT_ADMIN_EMAILS)
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean),
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  NOTIFY_FROM_EMAIL: process.env.NOTIFY_FROM_EMAIL,
  NOTIFY_TO_EMAIL: process.env.NOTIFY_TO_EMAIL
};

export const isSupabaseConfigured =
  !env.SUPABASE_URL.includes('YOUR-PROJECT') &&
  !env.SUPABASE_ANON_KEY.includes('YOUR_SUPABASE') &&
  Boolean(env.SUPABASE_URL) &&
  Boolean(env.SUPABASE_ANON_KEY);
