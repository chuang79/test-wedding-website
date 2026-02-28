import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/admin';

  if (tokenHash && type) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash
    });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
