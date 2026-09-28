// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

type CookieToSet = { name: string; value: string; options?: Partial<ResponseCookie> };

/**
 * Tier requirements per route prefix.
 * Tier is stored in user.app_metadata.tier (set via Supabase admin SDK
 * or a custom access-token hook — see README).
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Build a Supabase client that can read/write the session cookie
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: use getUser(), not getSession() — getUser() validates the JWT
  // against Supabase's server, getSession() only reads from cookie (less secure).
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null;
  try {
    ({ data: { user } } = await supabase.auth.getUser());
  } catch (err) {
    // Fail closed: if Supabase itself is unreachable, treat the request as
    // unauthenticated rather than letting an unhandled rejection crash the
    // middleware for every request.
    console.error('[middleware] Supabase auth check failed', err);
  }

  const { pathname } = request.nextUrl;
  const isPublicRoute =
    pathname === '/login' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico';

  // Not authenticated → send to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Authenticated but hitting login page → redirect to dashboard
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }



  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
