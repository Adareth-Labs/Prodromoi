// Server-side client for the central Express API.
import { createClient } from '@/lib/supabase/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function apiFetchServer<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_BASE_URL) throw new Error('NEXT_PUBLIC_API_BASE_URL is required');

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Unauthenticated');

  const headers = new Headers(init.headers);
  headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
  headers.set('Authorization', `Bearer ${session.access_token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error ?? body?.message ?? `API request failed (${response.status})`);
  }
  return body as T;
}
