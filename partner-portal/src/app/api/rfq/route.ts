// src/app/api/rfq/route.ts
import { getPortalUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateRefId } from '@/lib/db';
import { requireTier } from '@/lib/rbac';
import { PORTAL_RFQ_STATUS_TO_DB, toPortalRFQ } from '@/lib/mappers';
import type { CreateRFQInput, RFQStatus } from '@/types';

// GET /api/rfq — list the supplier's RFQ submissions
export async function GET(req: NextRequest) {
  try {
    const user = await getPortalUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    requireTier(user, 2);

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20', 10);
    const status = searchParams.get('status');

    if (status && !(status in PORTAL_RFQ_STATUS_TO_DB)) {
      return NextResponse.json({ error: 'Unknown status filter' }, { status: 400 });
    }
    if (!user.supplierId) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    const where = {
      supplierId: user.supplierId,
      ...(status ? { status: { in: PORTAL_RFQ_STATUS_TO_DB[status as RFQStatus] } } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.rFQ.findMany({
        where,
        include: { documents: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.rFQ.count({ where }),
    ]);

    return NextResponse.json({ items: rows.map(toPortalRFQ), total, page, pageSize });
  } catch (err) {
    console.error('[GET /api/rfq]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/rfq — create a new RFQ submission
export async function POST(req: NextRequest) {
  try {
    const user = await getPortalUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    requireTier(user, 2);

    const body: CreateRFQInput = await req.json();

    // Basic validation
    if (!body.partNumber || !body.partName || !body.annualVolume || !body.targetPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!user.supplierId) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    // The portal submits straight away, so the RFQ is created already SUBMITTED
    // and the DRAFT -> SUBMITTED step is recorded the same way the API's
    // state machine records it.
    const rfq = await prisma.rFQ.create({
      data: {
        trackingId:     generateRefId('RFQ'),
        supplierId:     user.supplierId,
        partFamily:     body.partName,
        partNumber:     body.partNumber,
        partName:       body.partName,
        annualVolume:   body.annualVolume,
        targetPrice:    body.targetPrice,
        material:       body.material,
        toleranceClass: body.toleranceClass,
        drawingRef:     body.drawingRef,
        requiredBy:     body.requiredBy ? new Date(body.requiredBy) : undefined,
        notes:          body.notes,
        status:         'SUBMITTED',
        submittedAt:    new Date(),
        createdBy:      user.sub,
        transitions: {
          create: { fromStatus: 'DRAFT', toStatus: 'SUBMITTED', actorId: user.sub, actorEmail: user.email },
        },
      },
      include: { documents: true },
    });

    return NextResponse.json({ data: toPortalRFQ(rfq), message: 'RFQ submitted successfully' }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/rfq]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
