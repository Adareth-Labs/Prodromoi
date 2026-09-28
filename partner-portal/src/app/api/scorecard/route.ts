// src/app/api/scorecard/route.ts
import { getPortalUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireTier } from '@/lib/rbac';
import { toPortalScorecardPeriod } from '@/lib/mappers';

const SCORECARD_MONTHS = 12;

// GET /api/scorecard — fetch scorecard data for the authenticated supplier
export async function GET(_req: NextRequest) {
  try {
    const user = await getPortalUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    requireTier(user, 2);
    if (!user.supplierId) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    const rows = await prisma.scorecardPeriod.findMany({
      where: { supplierId: user.supplierId },
      orderBy: { period: 'desc' },
      take: SCORECARD_MONTHS,
    });
    const periods = rows.map(toPortalScorecardPeriod);

    // Overall grade comes from the most recent period
    const overallGrade = periods[0]?.overallGrade ?? 'N/A';

    return NextResponse.json({
      data: {
        vendorId: user.vendorId,
        company: user.company,
        tier: user.tier,
        overallGrade,
        periods,
      },
    });
  } catch (err) {
    console.error('[GET /api/scorecard]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
