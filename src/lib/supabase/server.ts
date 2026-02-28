import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

type CookieStore = ReturnType<typeof cookies>;
type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<CookieStore['set']>[2];
};

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll can be called from a server component where writes are not allowed.
        }
      }
    }
  });
}
