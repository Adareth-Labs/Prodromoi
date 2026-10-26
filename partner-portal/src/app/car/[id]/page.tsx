import { notFound, redirect } from 'next/navigation';
import { requirePortalUser } from '@/lib/auth';
import { apiFetchServer } from '@/lib/api-server';
import { toPortalCAR } from '@/lib/mappers';
import CARDetailClient from './CARDetailClient';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'CAR Detail' };

export default async function CARDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePortalUser({ minTier: 2 });
  if (!user.supplierId) redirect('/dashboard');

  const response = await apiFetchServer<any>(`/v1/quality/${encodeURIComponent(id)}`).catch((err) => {
    console.error('[CARDetailPage] API request failed', err);
    return { data: null };
  });
  if (!response.data) notFound();

  return <CARDetailClient user={user} car={toPortalCAR(response.data)} />;
}
