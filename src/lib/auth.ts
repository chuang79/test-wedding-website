import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';

export async function requireAdminUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/admin/login');
  }

  const email = user.email.toLowerCase();
  const allowed = env.ADMIN_ALLOWED_EMAILS;

  if (allowed.length > 0 && !allowed.includes(email)) {
    redirect('/admin/login?error=unauthorized');
  }

  return user;
}
