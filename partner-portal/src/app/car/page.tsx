import { requirePortalUser } from '@/lib/auth';
import { apiFetchServer } from '@/lib/api-server';
import { toPortalCAR } from '@/lib/mappers';
import CARClient from './CARClient';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'CAR Workflow' };

export default async function CARPage() {
  const user = await requirePortalUser({ minTier: 3 });
  const response = await apiFetchServer<any>('/v1/quality').catch((err) => {
    console.error('[CARPage] API request failed', err);
    return { data: [] };
  });
  return <CARClient user={user} initialCARs={(response.data ?? []).map(toPortalCAR)} />;
}
