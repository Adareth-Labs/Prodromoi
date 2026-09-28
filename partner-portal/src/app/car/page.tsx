import { requirePortalUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { toPortalCAR } from '@/lib/mappers';
import CARClient from './CARClient';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'CAR Workflow' };

export default async function CARPage() {
  const user = await requirePortalUser({ minTier: 3 });
  const cars = user.supplierId ? await prisma.cARReport.findMany({
    where: { supplierId: user.supplierId }, orderBy: { createdAt: 'desc' },
  }).catch((err) => { console.error('[CARPage] cars query failed', err); return []; }) : [];
  return <CARClient user={user} initialCARs={cars.map(toPortalCAR)} />;
}
