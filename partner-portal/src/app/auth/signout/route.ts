// src/app/auth/signout/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    // Best-effort: even if Supabase couldn't be reached to invalidate the
    // session server-side, still send the browser back to /login so the
    // client-side session state doesn't appear signed in.
    console.error('[auth/signout] sign-out failed', err);
  }
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`, { status: 302 });
}
