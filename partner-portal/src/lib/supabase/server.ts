import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => {
          return cookieStore.getAll();
        },

        setAll: (
          cookieValues: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) => {
          try {
            cookieValues.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            console.debug(
              '[supabase/server] Cookie update skipped',
              error,
            );
          }
        },
      },
    },
  );
};