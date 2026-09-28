// Portal authentication is owned by Supabase; supplier/application data is owned by Express API.
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { apiFetchServer } from '@/lib/api-server';
import { normalizeTier } from '@/lib/mappers';
import type { PortalUser, Tier } from '@/types';

interface SupplierResponse {
  data: {
    id: string;
    vendorId: string;
    companyName: string;
    tier: 'BASIC' | 'QUALIFIED' | 'STRATEGIC';
    isActive: boolean;
    contactEmail: string;
  };
}

export async function getPortalUser(): Promise<PortalUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const response = await apiFetchServer<SupplierResponse>('/v1/suppliers/me');
    const supplier = response.data;
    const tier: Tier = normalizeTier(supplier.tier);

    return {
      sub: user.id,
      email: user.email ?? supplier.contactEmail ?? '',
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Partner',
      picture: user.user_metadata?.avatar_url as string | undefined,
      vendorId: supplier.vendorId,
      supplierId: supplier.id,
      company: supplier.companyName,
      tier,
      role: tier === 3 ? 'strategic' : tier === 2 ? 'qualified' : 'basic',
    };
  } catch (err) {
    console.error('[getPortalUser] profile/API lookup failed', err);
    return null;
  }
}

export function assertTier(user: PortalUser, minTier: Tier): void {
  if (user.tier < minTier) {
    throw new Error(`Insufficient access tier. Required: ${minTier}, current: ${user.tier}`);
  }
}

export async function requirePortalUser(options: { minTier?: Tier } = {}): Promise<PortalUser> {
  const user = await getPortalUser();
  if (!user) redirect('/login');

  if (options.minTier !== undefined && user.tier < options.minTier) {
    redirect(`/dashboard?error=insufficient_tier&required=${options.minTier}`);
  }

  return user;
}
