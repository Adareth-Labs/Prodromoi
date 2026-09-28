import { notFound, redirect } from 'next/navigation';
import { requirePortalUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { toPortalCAR } from '@/lib/mappers';
import CARDetailClient from './CARDetailClient';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'CAR Detail' };

export default async function CARDetailPage({ params }: { params: { id: string } }) {
  const user = await requirePortalUser({ minTier: 3 });
  if (!user.supplierId) redirect('/dashboard');

  const car = await prisma.cARReport
    .findFirst({ where: { id: params.id, supplierId: user.supplierId } })
    .catch((err) => { console.error('[CARDetailPage] CAR lookup failed', err); return null; });
  if (!car) notFound();

  return <CARDetailClient user={user} car={toPortalCAR(car)} />;
}
