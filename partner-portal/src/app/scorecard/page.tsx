import { requirePortalUser } from '@/lib/auth';
import { apiFetchServer } from '@/lib/api-server';
import { toPortalScorecardPeriod } from '@/lib/mappers';
import ScorecardClient from './ScorecardClient';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Supplier Scorecard' };

const SCORECARD_MONTHS = 12;

export default async function ScorecardPage() {
  const user = await requirePortalUser({ minTier: 2 });
  const response = await apiFetchServer<any>('/v1/suppliers/me/scorecard/periods').catch((err) => {
    console.error('[ScorecardPage] API request failed', err);
    return { data: [] };
  });
  const rows = (response.data ?? []).slice(0, SCORECARD_MONTHS);
  return <ScorecardClient user={user} periods={rows.map(toPortalScorecardPeriod)} company={user.company} />;
}
