// Adapters for the central Express API DTOs used by the portal UI.
import type {
  Tier,
  RFQStatus,
  RFQSubmission,
  RFQDocument,
  CAR,
  CARSeverity,
  CARStatus,
  PPAPDocument,
  PPAPStatus,
  ScorecardPeriod,
} from '@/types';

export const TIER_TO_NUMBER = {
  BASIC: 1,
  QUALIFIED: 2,
  STRATEGIC: 3,
} as const;

const RFQ_STATUS_TO_PORTAL: Record<string, RFQStatus> = {
  DRAFT: 'PENDING',
  SUBMITTED: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CLARIFICATION_REQUIRED: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  IN_PRODUCTION: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
};

const CAR_STATUS_TO_PORTAL: Record<string, CARStatus> = {
  OPEN: 'OPEN',
  ROOT_CAUSE_IDENTIFIED: 'IN_PROGRESS',
  ACTION_PLAN_SUBMITTED: 'IN_PROGRESS',
  VERIFICATION_PENDING: 'PENDING_REVIEW',
  CLOSED: 'CLOSED',
  ESCALATED: 'IN_PROGRESS',
};

const PPAP_STATUS_TO_DOC: Record<string, PPAPStatus> = {
  PENDING: 'DRAFT',
  PARTIAL: 'DRAFT',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const PORTAL_RFQ_STATUS_TO_DB: Record<RFQStatus, string[]> = {
  PENDING: ['DRAFT', 'SUBMITTED'],
  UNDER_REVIEW: ['UNDER_REVIEW', 'CLARIFICATION_REQUIRED'],
  APPROVED: ['APPROVED', 'IN_PRODUCTION'],
  REJECTED: ['REJECTED'],
  CANCELLED: ['CANCELLED'],
};

export const PORTAL_CAR_STATUS_TO_DB: Record<CARStatus, string> = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'ROOT_CAUSE_IDENTIFIED',
  PENDING_REVIEW: 'VERIFICATION_PENDING',
  CLOSED: 'CLOSED',
};

export interface RFQDocumentDTO {
  id: string;
  rfqId: string;
  fileName: string;
  contentType?: string;
  s3Key?: string;
  key?: string;
  sizeBytes?: number;
  uploadedAt: string;
}

export interface RFQDTO {
  id: string;
  trackingId: string;
  supplierId: string;
  partNumber?: string;
  sku?: string;
  partName?: string;
  partFamily?: string;
  annualVolume?: number;
  targetPrice?: number;
  material?: string;
  toleranceClass?: string;
  drawingRef?: string;
  requiredBy?: string;
  notes?: string;
  status: string;
  submittedAt?: string;
  createdAt: string;
  documents?: RFQDocumentDTO[];
}

export interface CARDTO {
  id: string;
  carId: string;
  supplierId: string;
  partId?: string;
  deviationDescription?: string;
  affectedQty?: number;
  detectedBy?: string;
  why1?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  closureNotes?: string;
  severity: CARSeverity;
  status: string;
  currentStep?: number;
  createdAt: string;
  closedAt?: string;
}

export interface PPAPDocumentDTO {
  id: string;
  vendorId?: string;
  supplierId?: string;
  fileName: string;
  s3Key?: string;
  sizeBytes?: number;
  ppapLevel?: number;
  status?: string;
  uploadedAt: string;
  ppap?: {
    supplierId?: string;
    status?: string;
  };
}

export interface ScorecardPeriodDTO {
  period: string;
  qualityPPM: number;
  deliveryOTD: number | string;
  responsiveness: number;
  documentation: number;
  innovation: number;
  sustainability: number;
  overallGrade: string;
}

export const tierToNumber = (
  tier: keyof typeof TIER_TO_NUMBER | string,
): Tier => {
  return TIER_TO_NUMBER[tier as keyof typeof TIER_TO_NUMBER] ?? 1;
};

export const normalizeTier = (value: unknown): Tier => {
  if (value === 3 || value === '3' || value === 'STRATEGIC') {
    return 3;
  }

  if (value === 2 || value === '2' || value === 'QUALIFIED') {
    return 2;
  }

  return 1;
};

export const toPortalRFQDocument = (
  doc: RFQDocumentDTO,
): RFQDocument => {
  return {
    id: doc.id,
    rfqId: doc.rfqId,
    fileName: doc.fileName,
    fileType: doc.contentType ?? '',
    s3Key: doc.s3Key ?? doc.key ?? '',
    sizeBytes: doc.sizeBytes ?? 0,
    uploadedAt: new Date(doc.uploadedAt).toISOString(),
  };
};

export const toPortalRFQ = (
  rfq: RFQDTO,
): RFQSubmission => {
  return {
    id: rfq.id,
    referenceId: rfq.trackingId,
    vendorId: rfq.supplierId,
    partNumber: rfq.partNumber ?? rfq.sku ?? '',
    partName: rfq.partName ?? rfq.partFamily ?? '',
    annualVolume: rfq.annualVolume ?? 0,
    targetPrice: Number(rfq.targetPrice ?? 0),
    material: rfq.material,
    toleranceClass: rfq.toleranceClass,
    drawingRef: rfq.drawingRef,
    requiredBy: rfq.requiredBy
      ? new Date(rfq.requiredBy).toISOString()
      : undefined,
    notes: rfq.notes,
    status: RFQ_STATUS_TO_PORTAL[rfq.status] ?? 'PENDING',
    submittedAt: new Date(
      rfq.submittedAt ?? rfq.createdAt,
    ).toISOString(),
    documents: (rfq.documents ?? []).map(toPortalRFQDocument),
  };
};

export const toPortalCAR = (
  car: CARDTO,
): CAR => {
  return {
    id: car.id,
    referenceId: car.carId,
    vendorId: car.supplierId,
    nonConformingPart: car.partId ?? '',
    deviation: car.deviationDescription ?? '',
    affectedQty: car.affectedQty ?? 0,
    detectedBy: car.detectedBy ?? '',
    why1: car.why1,
    rootCause: car.rootCause,
    correctiveActions: car.correctiveAction,
    preventiveActions: car.preventiveAction,
    closureNotes: car.closureNotes,
    severity: car.severity,
    status: CAR_STATUS_TO_PORTAL[car.status] ?? 'OPEN',
    currentStep: car.currentStep ?? 1,
    openedAt: new Date(car.createdAt).toISOString(),
    closedAt: car.closedAt
      ? new Date(car.closedAt).toISOString()
      : undefined,
  };
};

export const toPortalPPAPDocument = (
  doc: PPAPDocumentDTO,
): PPAPDocument => {
  const fileType =
    doc.fileName.split('.').pop()?.toUpperCase() ?? '';

  const documentStatus =
    doc.ppap?.status ?? doc.status ?? '';

  return {
    id: doc.id,
    vendorId:
      doc.ppap?.supplierId ??
      doc.supplierId ??
      doc.vendorId ??
      '',
    name: doc.fileName,
    fileType,
    s3Key: doc.s3Key ?? '',
    sizeBytes: doc.sizeBytes ?? 0,
    ppapLevel: doc.ppapLevel ?? 3,
    status: PPAP_STATUS_TO_DOC[documentStatus] ?? 'DRAFT',
    uploadedAt: new Date(doc.uploadedAt).toISOString(),
  };
};

export const toPortalScorecardPeriod = (
  row: ScorecardPeriodDTO,
): ScorecardPeriod => {
  return {
    period: row.period,
    qualityPPM: row.qualityPPM,
    deliveryOTD: Number(row.deliveryOTD),
    responsiveness: row.responsiveness,
    documentation: row.documentation,
    innovation: row.innovation,
    sustainability: row.sustainability,
    overallGrade: row.overallGrade,
  };
};