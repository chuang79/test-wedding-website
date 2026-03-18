import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DEV_ADMIN_COOKIE } from '@/lib/auth';
import { env, isSupabaseConfigured } from '@/lib/env';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    if (env.ADMIN_ALLOWED_EMAILS.length > 0 && !env.ADMIN_ALLOWED_EMAILS.includes(email)) {
      return NextResponse.json({ error: 'Email is not authorized for admin access.' }, { status: 403 });
    }

    if (process.env.NODE_ENV === 'development' && !isSupabaseConfigured) {
      const response = NextResponse.json({
        message: `Signed in locally as ${email}.`,
        redirectTo: '/admin'
      });
      response.cookies.set(DEV_ADMIN_COOKIE, email, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7
      });
      return response;
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    const siteUrl = env.NEXT_PUBLIC_SITE_URL;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=/admin`
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Magic link sent. Check your email.' });
  } catch {
    return NextResponse.json({ error: 'Unable to send magic link.' }, { status: 500 });
  }
}
