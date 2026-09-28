// src/app/api/car/[id]/route.ts
import { getPortalUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireTier } from '@/lib/rbac';
import { PORTAL_CAR_STATUS_TO_DB, toPortalCAR } from '@/lib/mappers';
import type { UpdateCARInput } from '@/types';

const FINAL_STEP = 3;

// PATCH /api/car/[id] — advance step or update CAR fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getPortalUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    requireTier(user, 3);

    const body: UpdateCARInput = await req.json();

    if (!user.supplierId) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    // Ensure the CAR belongs to this supplier
    const existing = await prisma.cARReport.findFirst({
      where: { id: params.id, supplierId: user.supplierId },
    });
    if (!existing) return NextResponse.json({ error: 'CAR not found' }, { status: 404 });
    if (existing.status === 'CLOSED') {
      return NextResponse.json({ error: 'Cannot update a closed CAR' }, { status: 409 });
    }

    // Submitting the final step with closure notes sends the CAR for review.
    const submittedForReview = body.currentStep === FINAL_STEP && Boolean(body.closureNotes);

    // Explicit field list — the request body used to be spread straight into
    // the update, which let a caller overwrite any column (supplierId, ids...).
    const updated = await prisma.cARReport.update({
      where: { id: params.id },
      data: {
        why1:             body.why1,
        rootCause:        body.rootCause,
        correctiveAction: body.correctiveActions,
        preventiveAction: body.preventiveActions,
        closureNotes:     body.closureNotes,
        currentStep:      body.currentStep,
        ...(body.status ? { status: PORTAL_CAR_STATUS_TO_DB[body.status] } : {}),
        ...(submittedForReview ? { status: 'VERIFICATION_PENDING', closedAt: null } : {}),
      },
    });

    return NextResponse.json({ data: toPortalCAR(updated) });
  } catch (err) {
    console.error('[PATCH /api/car/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/car/[id] — fetch a single CAR
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getPortalUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    requireTier(user, 3);
    if (!user.supplierId) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });

    const car = await prisma.cARReport.findFirst({ where: { id: params.id, supplierId: user.supplierId } });
    if (!car) return NextResponse.json({ error: 'CAR not found' }, { status: 404 });

    return NextResponse.json({ data: toPortalCAR(car) });
  } catch (err) {
    console.error('[GET /api/car/[id]]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
