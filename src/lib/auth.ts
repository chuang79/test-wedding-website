import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { env, isSupabaseConfigured } from '@/lib/env';

export const DEV_ADMIN_COOKIE = 'cj-dev-admin-email';

function isAllowedAdminEmail(email: string) {
  return env.ADMIN_ALLOWED_EMAILS.length === 0 || env.ADMIN_ALLOWED_EMAILS.includes(email.toLowerCase());
}

async function getDevAdminUser() {
  if (process.env.NODE_ENV !== 'development' || isSupabaseConfigured) {
    return null;
  }

  const email = cookies().get(DEV_ADMIN_COOKIE)?.value?.trim().toLowerCase();
  if (!email || !isAllowedAdminEmail(email)) {
    return null;
  }

  return { email };
}

export async function getAdminUserOrNull() {
  const devUser = await getDevAdminUser();
  if (devUser) {
    return devUser;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return null;
  }

  const email = user.email.toLowerCase();
  if (!isAllowedAdminEmail(email)) {
    return null;
  }

  return user;
}

export async function requireAdminUser() {
  const user = await getAdminUserOrNull();

  if (!user?.email) {
    redirect('/admin/login');
  }

  return user;
}
