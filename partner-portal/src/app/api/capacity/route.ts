// src/app/api/capacity/route.ts
import { getPortalUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireTier } from '@/lib/rbac';

// GET /api/capacity — fetch capacity dashboard data
export async function GET(req: NextRequest) {
  try {
    const user = await getPortalUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    
    requireTier(user, 3);

    if (!user.supplierId) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    // Get latest snapshot per line
    const snapshots = await prisma.capacitySnapshot.findMany({
      where: { supplierId: user.supplierId },
      orderBy: { snapshotAt: 'desc' },
      distinct: ['lineId'],
      take: 20,
    });

    // Get 7-day OEE history for the chart
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const history = await prisma.capacitySnapshot.findMany({
      where: { supplierId: user.supplierId, snapshotAt: { gte: sevenDaysAgo } },
      orderBy: { snapshotAt: 'asc' },
      select: { snapshotAt: true, oee: true, utilization: true, lineId: true },
    });

    const overallOEE = snapshots.length > 0
      ? snapshots.reduce((sum, s) => sum + Number(s.oee), 0) / snapshots.length
      : 0;

    return NextResponse.json({
      data: {
        vendorId: user.vendorId,
        snapshotAt: new Date().toISOString(),
        overallOEE: Math.round(overallOEE * 10) / 10,
        partsShippedMTD: 142850,   // Would come from ERP integration
        monthlyTarget: 200000,
        lines: snapshots.map(s => ({
          lineId: s.lineId,
          lineName: s.lineName,
          oee: Number(s.oee),
          utilization: Number(s.utilization),
          status: s.status,
        })),
        weeklyHistory: history.map(h => ({
          day: new Date(h.snapshotAt).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
          oee: Number(h.oee),
          utilization: Number(h.utilization),
        })),
      },
    });
  } catch (err) {
    console.error('[GET /api/capacity]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}