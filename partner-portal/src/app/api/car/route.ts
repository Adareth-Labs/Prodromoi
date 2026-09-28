// src/app/api/car/route.ts
import { getPortalUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateRefId } from '@/lib/db';
import { requireTier } from '@/lib/rbac';
import { toPortalCAR } from '@/lib/mappers';
import type { CreateCARInput } from '@/types';

// GET /api/car — list CARs for the supplier
export async function GET(_req: NextRequest) {
  try {
    const user = await getPortalUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    requireTier(user, 3);
    if (!user.supplierId) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    const cars = await prisma.cARReport.findMany({
      where: { supplierId: user.supplierId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: cars.map(toPortalCAR) });
  } catch (err) {
    console.error('[GET /api/car]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/car — open a new CAR
export async function POST(req: NextRequest) {
  try {
    const user = await getPortalUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    requireTier(user, 3);

    const body: CreateCARInput = await req.json();

    if (!body.nonConformingPart || !body.deviation || !body.affectedQty || !body.severity) {
      return NextResponse.json({ error: 'Missing required CAR fields' }, { status: 400 });
    }
    if (!user.supplierId) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    const car = await prisma.cARReport.create({
      data: {
        carId:                generateRefId('CAR'),
        supplierId:           user.supplierId,
        partId:               body.nonConformingPart,
        deviationDescription: body.deviation,
        affectedQty:          body.affectedQty,
        detectedBy:           body.detectedBy,
        severity:             body.severity,
        status:               'OPEN',
        currentStep:          1,
        createdBy:            user.sub,
      },
    });

    return NextResponse.json({ data: toPortalCAR(car) }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/car]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
