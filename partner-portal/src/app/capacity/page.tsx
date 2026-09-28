import { requirePortalUser } from '@/lib/auth';
import { apiFetchServer } from '@/lib/api-server';
import CapacityClient from './CapacityClient';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Capacity Dashboard' };

export default async function CapacityPage() {
  const user = await requirePortalUser({ minTier: 3 });
  const response = await apiFetchServer<any>('/v1/quality/capacity').catch((err) => {
    console.error('[CapacityPage] API request failed', err);
    return { data: null };
  });
  return <CapacityClient user={user} lines={response.data?.lines ?? []} history={response.data?.weeklyHistory ?? []} overallOEE={response.data?.overallOEE ?? 0} />;
}
