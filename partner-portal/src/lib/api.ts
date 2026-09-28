// Browser-side client for the central Express API.
import { createClient } from '@/lib/supabase/client';
import { normalizeTier } from '@/lib/mappers';
import type { PortalUser } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL is required');
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'omit',
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error ?? body?.message ?? `API request failed (${response.status})`);
  }
  return body as T;
}

export async function getPortalUserClient(): Promise<PortalUser | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const response = await apiFetch<any>('/v1/suppliers/me');
  const supplier = response.data;
  const tier = normalizeTier(supplier.tier);
  return {
    sub: user.id, email: user.email ?? supplier.contactEmail ?? '',
    name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Partner',
    picture: user.user_metadata?.avatar_url as string | undefined, vendorId: supplier.vendorId,
    supplierId: supplier.id, company: supplier.companyName, tier,
    role: tier === 3 ? 'strategic' : tier === 2 ? 'qualified' : 'basic',
  };
}
