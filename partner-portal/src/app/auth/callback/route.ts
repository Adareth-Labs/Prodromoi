// src/app/auth/callback/route.ts
// Handles the OAuth PKCE callback from Supabase (Google, Microsoft, etc.)
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  // 1. Surface any errors returned directly from the OAuth provider
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}`
    );
  }

  // 2. Validate the 'next' parameter to prevent Open Redirect vulnerabilities
  const nextParam = searchParams.get('next') ?? '/dashboard';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') 
    ? nextParam 
    : '/dashboard';

  // 3. Exchange the PKCE code for a secure session
  if (code) {
    try {
      const supabase = await createClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (!exchangeError) {
        // Successful sign-in — safely redirect to intended local destination
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch (err) {
      console.error('[auth/callback] session exchange failed', err);
    }
  }

  // 4. Catch-all fallback for failed exchanges
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}