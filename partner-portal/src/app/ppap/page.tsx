import { requirePortalUser } from '@/lib/auth';
import { apiFetchServer } from '@/lib/api-server';
import { toPortalPPAPDocument } from '@/lib/mappers';
import PPAPClient from './PPAPClient';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'PPAP Hub' };

export default async function PPAPPage() {
  const user = await requirePortalUser({ minTier: 2 });
  const response = await apiFetchServer<any>('/v1/ppap/documents').catch((err) => {
    console.error('[PPAPPage] API request failed', err);
    return { data: [] };
  });
  return <PPAPClient user={user} initialDocs={(response.data ?? []).map(toPortalPPAPDocument)} />;
}
