import { requirePortalUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { toPortalScorecardPeriod } from '@/lib/mappers';
import ScorecardClient from './ScorecardClient';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Supplier Scorecard' };

const SCORECARD_MONTHS = 12;

export default async function ScorecardPage() {
  const user = await requirePortalUser({ minTier: 2 });
  const rows = user.supplierId ? await prisma.scorecardPeriod.findMany({
    where: { supplierId: user.supplierId },
    orderBy: { period: 'desc' },
    take: SCORECARD_MONTHS,
  }).catch((err) => { console.error('[ScorecardPage] periods query failed', err); return []; }) : [];
  return <ScorecardClient user={user} periods={rows.map(toPortalScorecardPeriod)} company={user.company} />;
}
