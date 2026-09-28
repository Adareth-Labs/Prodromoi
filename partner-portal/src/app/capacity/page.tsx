import { requirePortalUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import CapacityClient from './CapacityClient';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Capacity Dashboard' };

export default async function CapacityPage() {
  const user = await requirePortalUser({ minTier: 3 });
  const snapshots = user.supplierId ? await prisma.capacitySnapshot.findMany({
    where: { supplierId: user.supplierId },
    orderBy: { snapshotAt: 'desc' },
    distinct: ['lineId'],
  }).catch((err) => { console.error('[CapacityPage] snapshot query failed', err); return []; }) : [];
  const lines = snapshots.map(s => ({
    lineId: s.lineId, lineName: s.lineName,
    oee: Number(s.oee), utilization: Number(s.utilization), status: s.status,
  }));
  return <CapacityClient user={user} lines={lines} />;
}
