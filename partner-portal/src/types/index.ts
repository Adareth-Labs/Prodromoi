// src/types/index.ts

// ─── Auth / RBAC ──────────────────────────────────────────────

export type Tier = 1 | 2 | 3;

export interface PortalUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  vendorId: string;   // public supplier code, e.g. "BW-49201"
  supplierId: string; // Supplier.id (database key); empty if the user has no supplier yet
  company: string;
  tier: Tier;
  role: string;
}

// ─── RFQ ──────────────────────────────────────────────────────

export type RFQStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface RFQSubmission {
  id: string;
  referenceId: string;
  vendorId: string;
  partNumber: string;
  partName: string;
  annualVolume: number;
  targetPrice: number;
  material?: string;
  toleranceClass?: string;
  drawingRef?: string;
  requiredBy?: string;
  notes?: string;
  status: RFQStatus;
  submittedAt: string;
  documents: RFQDocument[];
}

export interface RFQDocument {
  id: string;
  rfqId: string;
  fileName: string;
  fileType: string;
  s3Key: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface CreateRFQInput {
  partNumber: string;
  partName: string;
  annualVolume: number;
  targetPrice: number;
  material?: string;
  toleranceClass?: string;
  drawingRef?: string;
  requiredBy?: string;
  notes?: string;
}

// ─── PPAP ─────────────────────────────────────────────────────

export type PPAPStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface PPAPDocument {
  id: string;
  vendorId: string;
  name: string;
  fileType: string;
  s3Key: string;
  sizeBytes: number;
  ppapLevel: number;
  status: PPAPStatus;
  uploadedAt: string;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  s3Key: string;
  expiresAt: string;
}

// ─── Scorecard ────────────────────────────────────────────────

export interface ScorecardPeriod {
  period: string;
  qualityPPM: number;
  deliveryOTD: number;
  responsiveness: number;
  documentation: number;
  innovation: number;
  sustainability: number;
  overallGrade: string;
}

export interface SupplierScorecard {
  vendorId: string;
  company: string;
  tier: Tier;
  overallGrade: string;
  periods: ScorecardPeriod[];
}

// ─── CAR ──────────────────────────────────────────────────────

export type CARSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';
export type CARStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_REVIEW' | 'CLOSED';

export interface CAR {
  id: string;
  referenceId: string;
  vendorId: string;
  nonConformingPart: string;
  deviation: string;
  affectedQty: number;
  detectedBy: string;
  why1?: string;
  rootCause?: string;
  correctiveActions?: string;
  preventiveActions?: string;
  closureNotes?: string;
  severity: CARSeverity;
  status: CARStatus;
  currentStep: number;
  openedAt: string;
  closedAt?: string;
}

export interface CreateCARInput {
  nonConformingPart: string;
  deviation: string;
  affectedQty: number;
  detectedBy: string;
  severity: CARSeverity;
}

export interface UpdateCARInput {
  why1?: string;
  rootCause?: string;
  correctiveActions?: string;
  preventiveActions?: string;
  closureNotes?: string;
  currentStep?: number;
  status?: CARStatus;
}

// ─── Capacity ─────────────────────────────────────────────────

export type LineStatus = 'ACTIVE' | 'MAINTENANCE' | 'CRITICAL' | 'OFFLINE';

export interface ProductionLine {
  lineId: string;
  lineName: string;
  oee: number;
  utilization: number;
  status: LineStatus;
}

export interface CapacityDashboard {
  vendorId: string;
  snapshotAt: string;
  overallOEE: number;
  partsShippedMTD: number;
  monthlyTarget: number;
  lines: ProductionLine[];
  weeklyHistory: { day: string; oee: number; utilization: number }[];
}

// ─── API Responses ────────────────────────────────────────────

export interface APIResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
