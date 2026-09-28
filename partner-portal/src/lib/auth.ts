// src/lib/auth.ts
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { normalizeTier, tierToNumber } from '@/lib/mappers';
import type { PortalUser, Tier } from '@/types';

/**
 * Get the authenticated portal user, combining Supabase auth identity
 * with supplier/tier data from the database.
 *
 * A Supabase user maps to a SupplierUser (matched on `supabaseId`), which
 * belongs to a Supplier — the same tables the API uses. Tier is stored in
 * two places for performance:
 *  1. user.app_metadata.tier  — read by middleware (no DB hit)
 *  2. Supplier.tier           — source of truth, read here for page data
 */
export async function getPortalUser(): Promise<PortalUser | null> {
  let user: Awaited<ReturnType<typeof getAuthUser>>;
  try {
    user = await getAuthUser();
  } catch (err) {
    console.error('[getPortalUser] Supabase auth check failed', err);
    return null;
  }

  if (!user) return null;

  const supplierUser = await prisma.supplierUser
    .findUnique({ where: { supabaseId: user.id }, include: { supplier: true } })
    .catch((err) => {
      console.error('[getPortalUser] supplier lookup failed', err);
      return null;
    });
  const supplier = supplierUser?.supplier ?? null;

  const tier: Tier = supplier ? tierToNumber(supplier.tier) : normalizeTier(user.app_metadata?.tier);
  const name =
    supplierUser?.name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    'Partner';

  return {
    sub:        user.id,
    email:      user.email ?? '',
    name,
    picture:    user.user_metadata?.avatar_url as string | undefined,
    vendorId:   supplier?.vendorId ?? '',
    supplierId: supplier?.id ?? '',
    company:    supplier?.companyName ?? (user.user_metadata?.company as string) ?? '',
    tier,
    role:       tier === 3 ? 'strategic' : tier === 2 ? 'qualified' : 'basic',
  };
}

// Isolated so getPortalUser can distinguish "not signed in" from "Supabase
// itself failed" without duplicating the client-creation + getUser() call.
async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return error ? null : user;
}

/** Throw if the user's tier is below the required minimum. */
export function assertTier(user: PortalUser, minTier: Tier): void {
  if (user.tier < minTier) {
    throw new Error(
      `Insufficient access tier. Required: ${minTier}, current: ${user.tier}`,
    );
  }
}

// For server-rendered pages: redirect to /login if signed out, and to the
// dashboard if the user's tier is below `minTier`. Every dashboard page used
// to repeat these checks (plus its own vendor lookup) by hand. The supplier
// is already loaded by getPortalUser, so `user.supplierId` is all a page
// needs to scope its own queries — no second lookup.
export async function requirePortalUser(options: { minTier?: Tier } = {}): Promise<PortalUser> {
  const user = await getPortalUser();
  if (!user) redirect('/login');

  if (options.minTier !== undefined && user.tier < options.minTier) {
    redirect(`/dashboard?error=insufficient_tier&required=${options.minTier}`);
  }

  return user;
}
