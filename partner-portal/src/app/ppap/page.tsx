import { requirePortalUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { toPortalPPAPDocument } from '@/lib/mappers';
import PPAPClient from './PPAPClient';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'PPAP Hub' };

export default async function PPAPPage() {
  const user = await requirePortalUser({ minTier: 2 });
  const docs = user.supplierId ? await prisma.pPAPDocument.findMany({
    where: { ppap: { supplierId: user.supplierId } },
    include: { ppap: true },
    orderBy: { uploadedAt: 'desc' },
  }).catch((err) => { console.error('[PPAPPage] docs query failed', err); return []; }) : [];
  return <PPAPClient user={user} initialDocs={docs.map(toPortalPPAPDocument)} />;
}
