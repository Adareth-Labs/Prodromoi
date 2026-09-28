// src/lib/mappers.ts
//
// The portal now reads the API's schema (Supplier / RFQ / CARReport / ...)
// but its pages and client components were built around the old portal
// shapes (referenceId, vendorId, IN_PROGRESS, tier 1-3, ...). These adapters
// convert database rows into those shapes in ONE place, so the UI code did
// not have to change when the database was unified.
import type {
  PortalTier,
  RFQStatus as DbRFQStatus,
  CARStatus as DbCARStatus,
  PPAPStatus as DbPPAPStatus,
  Prisma,
} from '@prisma/client';
import type {
  Tier,
  RFQStatus,
  RFQSubmission,
  RFQDocument,
  CAR,
  CARStatus,
  PPAPDocument,
  PPAPStatus,
  ScorecardPeriod,
} from '@/types';

// ─── Tier ─────────────────────────────────────────────────────

const TIER_TO_NUMBER: Record<PortalTier, Tier> = { BASIC: 1, QUALIFIED: 2, STRATEGIC: 3 };

export const tierToNumber = (tier: PortalTier): Tier => TIER_TO_NUMBER[tier];

// Supabase app_metadata.tier may be 1|2|3, "1"|"2"|"3", or a PortalTier name.
export function normalizeTier(value: unknown): Tier {
  if (value === 3 || value === '3' || value === 'STRATEGIC') return 3;
  if (value === 2 || value === '2' || value === 'QUALIFIED') return 2;
  return 1;
}

// ─── Status vocabularies ──────────────────────────────────────

const RFQ_STATUS_TO_PORTAL: Record<DbRFQStatus, RFQStatus> = {
  DRAFT:                  'PENDING',
  SUBMITTED:              'PENDING',
  UNDER_REVIEW:           'UNDER_REVIEW',
  CLARIFICATION_REQUIRED: 'UNDER_REVIEW',
  APPROVED:               'APPROVED',
  IN_PRODUCTION:          'APPROVED',
  REJECTED:               'REJECTED',
  CANCELLED:              'CANCELLED',
};

// Inverse, for `?status=` filters: one portal status covers several DB statuses.
export const PORTAL_RFQ_STATUS_TO_DB: Record<RFQStatus, DbRFQStatus[]> = {
  PENDING:      ['DRAFT', 'SUBMITTED'],
  UNDER_REVIEW: ['UNDER_REVIEW', 'CLARIFICATION_REQUIRED'],
  APPROVED:     ['APPROVED', 'IN_PRODUCTION'],
  REJECTED:     ['REJECTED'],
  CANCELLED:    ['CANCELLED'],
};

const CAR_STATUS_TO_PORTAL: Record<DbCARStatus, CARStatus> = {
  OPEN:                   'OPEN',
  ROOT_CAUSE_IDENTIFIED:  'IN_PROGRESS',
  ACTION_PLAN_SUBMITTED:  'IN_PROGRESS',
  VERIFICATION_PENDING:   'PENDING_REVIEW',
  CLOSED:                 'CLOSED',
  ESCALATED:              'IN_PROGRESS',
};

export const PORTAL_CAR_STATUS_TO_DB: Record<CARStatus, DbCARStatus> = {
  OPEN:           'OPEN',
  IN_PROGRESS:    'ROOT_CAUSE_IDENTIFIED',
  PENDING_REVIEW: 'VERIFICATION_PENDING',
  CLOSED:         'CLOSED',
};

// PPAP status lives on the submission; the portal shows it per document.
const PPAP_STATUS_TO_DOC: Record<DbPPAPStatus, PPAPStatus> = {
  PENDING:      'DRAFT',
  PARTIAL:      'DRAFT',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED:     'APPROVED',
  REJECTED:     'REJECTED',
};

// ─── Row adapters ─────────────────────────────────────────────

type RFQRow = Prisma.RFQGetPayload<{ include: { documents: true } }>;
type RFQDocumentRow = Prisma.RFQDocumentGetPayload<object>;
type CARRow = Prisma.CARReportGetPayload<object>;
type PPAPDocumentRow = Prisma.PPAPDocumentGetPayload<{ include: { ppap: true } }>;
type ScorecardPeriodRow = Prisma.ScorecardPeriodGetPayload<object>;

export function toPortalRFQDocument(doc: RFQDocumentRow): RFQDocument {
  return {
    id:         doc.id,
    rfqId:      doc.rfqId,
    fileName:   doc.fileName,
    fileType:   doc.contentType,
    s3Key:      doc.s3Key,
    sizeBytes:  doc.sizeBytes,
    uploadedAt: doc.uploadedAt.toISOString(),
  };
}

export function toPortalRFQ(rfq: RFQRow): RFQSubmission {
  return {
    id:             rfq.id,
    referenceId:    rfq.trackingId,
    vendorId:       rfq.supplierId,
    partNumber:     rfq.partNumber ?? rfq.sku ?? '',
    partName:       rfq.partName ?? rfq.partFamily,
    annualVolume:   rfq.annualVolume ?? 0,
    targetPrice:    Number(rfq.targetPrice ?? 0),
    material:       rfq.material ?? undefined,
    toleranceClass: rfq.toleranceClass ?? undefined,
    drawingRef:     rfq.drawingRef ?? undefined,
    requiredBy:     rfq.requiredBy?.toISOString(),
    notes:          rfq.notes ?? undefined,
    status:         RFQ_STATUS_TO_PORTAL[rfq.status],
    submittedAt:    (rfq.submittedAt ?? rfq.createdAt).toISOString(),
    documents:      rfq.documents.map(toPortalRFQDocument),
  };
}

export function toPortalCAR(car: CARRow): CAR {
  return {
    id:                car.id,
    referenceId:       car.carId,
    vendorId:          car.supplierId,
    nonConformingPart: car.partId ?? '',
    deviation:         car.deviationDescription,
    affectedQty:       car.affectedQty ?? 0,
    detectedBy:        car.detectedBy ?? '',
    why1:              car.why1 ?? undefined,
    rootCause:         car.rootCause ?? undefined,
    correctiveActions: car.correctiveAction ?? undefined,
    preventiveActions: car.preventiveAction ?? undefined,
    closureNotes:      car.closureNotes ?? undefined,
    severity:          car.severity,
    status:            CAR_STATUS_TO_PORTAL[car.status],
    currentStep:       car.currentStep,
    openedAt:          car.createdAt.toISOString(),
    closedAt:          car.closedAt?.toISOString(),
  };
}

export function toPortalPPAPDocument(doc: PPAPDocumentRow): PPAPDocument {
  return {
    id:         doc.id,
    vendorId:   doc.ppap.supplierId,
    name:       doc.fileName,
    fileType:   doc.fileName.split('.').pop()?.toUpperCase() ?? '',
    s3Key:      doc.s3Key,
    sizeBytes:  doc.sizeBytes,
    ppapLevel:  doc.ppapLevel ?? 3,
    status:     PPAP_STATUS_TO_DOC[doc.ppap.status],
    uploadedAt: doc.uploadedAt.toISOString(),
  };
}

export function toPortalScorecardPeriod(row: ScorecardPeriodRow): ScorecardPeriod {
  return {
    period:         row.period,
    qualityPPM:     row.qualityPPM,
    deliveryOTD:    Number(row.deliveryOTD),
    responsiveness: row.responsiveness,
    documentation:  row.documentation,
    innovation:     row.innovation,
    sustainability: row.sustainability,
    overallGrade:   row.overallGrade,
  };
}
