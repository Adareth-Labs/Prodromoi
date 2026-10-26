-- Baseline schema for the PrecisionCore API PostgreSQL database.
-- For an existing database with these tables already present, read api/prisma/migrations/README.md
-- and baseline it with `prisma migrate resolve --applied 20261024000000_init` before deployment.

CREATE TYPE "PortalTier" AS ENUM ('BASIC', 'QUALIFIED', 'STRATEGIC');
CREATE TYPE "RFQStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_REQUIRED', 'APPROVED', 'REJECTED', 'IN_PRODUCTION', 'CANCELLED');
CREATE TYPE "PPAPStatus" AS ENUM ('PENDING', 'PARTIAL', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE "CARSeverity" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL');
CREATE TYPE "CARStatus" AS ENUM ('OPEN', 'ROOT_CAUSE_IDENTIFIED', 'ACTION_PLAN_SUBMITTED', 'VERIFICATION_PENDING', 'CLOSED', 'ESCALATED');
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'TRANSITION', 'DOWNLOAD', 'LOGIN', 'LOGOUT', 'ACCESS_DENIED');
CREATE TYPE "LineStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'CRITICAL', 'OFFLINE');

CREATE TABLE "Supplier" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  "tier" "PortalTier" NOT NULL DEFAULT 'BASIC',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "contactEmail" TEXT NOT NULL,
  "oems" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Supplier_vendorId_key" ON "Supplier"("vendorId");
CREATE INDEX "Supplier_tier_idx" ON "Supplier"("tier");
CREATE INDEX "Supplier_isActive_idx" ON "Supplier"("isActive");

CREATE TABLE "SupplierUser" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "supabaseId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'member',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupplierUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SupplierUser_supabaseId_key" ON "SupplierUser"("supabaseId");
CREATE UNIQUE INDEX "SupplierUser_email_key" ON "SupplierUser"("email");
CREATE INDEX "SupplierUser_supplierId_idx" ON "SupplierUser"("supplierId");
CREATE INDEX "SupplierUser_supabaseId_idx" ON "SupplierUser"("supabaseId");

CREATE TABLE "RFQ" (
  "id" TEXT NOT NULL,
  "trackingId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "productSlug" TEXT,
  "partFamily" TEXT NOT NULL,
  "sku" TEXT,
  "partNumber" TEXT,
  "partName" TEXT,
  "targetPrice" DECIMAL(10,2),
  "material" TEXT,
  "toleranceClass" TEXT,
  "drawingRef" TEXT,
  "requiredBy" TIMESTAMP(3),
  "notes" TEXT,
  "status" "RFQStatus" NOT NULL DEFAULT 'DRAFT',
  "annualVolume" INTEGER,
  "minLotSize" INTEGER,
  "peakWeekly" INTEGER,
  "sopTargetDate" TIMESTAMP(3),
  "protoTargetDate" TIMESTAMP(3),
  "reviewNotes" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  CONSTRAINT "RFQ_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RFQ_trackingId_key" ON "RFQ"("trackingId");
CREATE INDEX "RFQ_supplierId_idx" ON "RFQ"("supplierId");
CREATE INDEX "RFQ_status_idx" ON "RFQ"("status");
CREATE INDEX "RFQ_trackingId_idx" ON "RFQ"("trackingId");

CREATE TABLE "RFQDocument" (
  "id" TEXT NOT NULL,
  "rfqId" TEXT NOT NULL,
  "s3Key" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "isRequired" BOOLEAN NOT NULL DEFAULT false,
  "uploadedBy" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RFQDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RFQDocument_rfqId_idx" ON "RFQDocument"("rfqId");

CREATE TABLE "RFQTransition" (
  "id" TEXT NOT NULL,
  "rfqId" TEXT NOT NULL,
  "fromStatus" "RFQStatus" NOT NULL,
  "toStatus" "RFQStatus" NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorEmail" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RFQTransition_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RFQTransition_rfqId_idx" ON "RFQTransition"("rfqId");

CREATE TABLE "PPAPSubmission" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "rfqId" TEXT,
  "platformId" TEXT NOT NULL,
  "status" "PPAPStatus" NOT NULL DEFAULT 'PENDING',
  "requiredBy" TIMESTAMP(3),
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "rejectedBy" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "rejectReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PPAPSubmission_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PPAPSubmission_supplierId_idx" ON "PPAPSubmission"("supplierId");
CREATE INDEX "PPAPSubmission_status_idx" ON "PPAPSubmission"("status");

CREATE TABLE "PPAPDocument" (
  "id" TEXT NOT NULL,
  "ppapId" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "s3Key" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "ppapLevel" INTEGER,
  "isRequired" BOOLEAN NOT NULL DEFAULT true,
  "uploadedBy" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PPAPDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PPAPDocument_ppapId_idx" ON "PPAPDocument"("ppapId");

CREATE TABLE "CARReport" (
  "id" TEXT NOT NULL,
  "carId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "rfqId" TEXT,
  "lotNumber" TEXT,
  "severity" "CARSeverity" NOT NULL,
  "status" "CARStatus" NOT NULL DEFAULT 'OPEN',
  "deviationDescription" TEXT NOT NULL,
  "partId" TEXT,
  "batchNumber" TEXT,
  "affectedQty" INTEGER,
  "detectedBy" TEXT,
  "why1" TEXT,
  "rootCause" TEXT,
  "rootCauseMethod" TEXT,
  "correctiveAction" TEXT,
  "preventiveAction" TEXT,
  "actionDueDate" TIMESTAMP(3),
  "actionResponsibleId" TEXT,
  "verifiedBy" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "closedBy" TEXT,
  "closedAt" TIMESTAMP(3),
  "closureNotes" TEXT,
  "currentStep" INTEGER NOT NULL DEFAULT 1,
  "assignedTo" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CARReport_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CARReport_carId_key" ON "CARReport"("carId");
CREATE INDEX "CARReport_supplierId_idx" ON "CARReport"("supplierId");
CREATE INDEX "CARReport_status_idx" ON "CARReport"("status");
CREATE INDEX "CARReport_carId_idx" ON "CARReport"("carId");

CREATE TABLE "CARDocument" (
  "id" TEXT NOT NULL,
  "carId" TEXT NOT NULL,
  "s3Key" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "uploadedBy" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CARDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CARDocument_carId_idx" ON "CARDocument"("carId");

CREATE TABLE "SupplierScorecard" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "qualityPPM" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "deliveryOTD" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "iatfCertified" BOOLEAN NOT NULL DEFAULT false,
  "iatfExpiresAt" TIMESTAMP(3),
  "innovationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "globalRating" TEXT NOT NULL DEFAULT 'B',
  "riskLevel" TEXT NOT NULL DEFAULT 'low',
  "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupplierScorecard_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SupplierScorecard_supplierId_key" ON "SupplierScorecard"("supplierId");

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "action" "AuditAction" NOT NULL,
  "actorId" TEXT NOT NULL,
  "actorEmail" TEXT NOT NULL,
  "actorTier" "PortalTier",
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "resourceType" TEXT NOT NULL,
  "resourceId" TEXT,
  "supplierId" TEXT,
  "rfqId" TEXT,
  "ppapId" TEXT,
  "carId" TEXT,
  "beforeState" JSONB,
  "afterState" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");
CREATE INDEX "AuditLog_supplierId_idx" ON "AuditLog"("supplierId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

CREATE TABLE "ScorecardPeriod" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "qualityPPM" INTEGER NOT NULL,
  "deliveryOTD" DECIMAL(5,2) NOT NULL,
  "responsiveness" INTEGER NOT NULL,
  "documentation" INTEGER NOT NULL,
  "innovation" INTEGER NOT NULL,
  "sustainability" INTEGER NOT NULL,
  "overallGrade" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ScorecardPeriod_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ScorecardPeriod_supplierId_period_key" ON "ScorecardPeriod"("supplierId", "period");

CREATE TABLE "CapacitySnapshot" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "lineId" TEXT NOT NULL,
  "lineName" TEXT NOT NULL,
  "oee" DECIMAL(5,2) NOT NULL,
  "utilization" DECIMAL(5,2) NOT NULL,
  "status" "LineStatus" NOT NULL,
  "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CapacitySnapshot_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CapacitySnapshot_supplierId_snapshotAt_idx" ON "CapacitySnapshot"("supplierId", "snapshotAt");

CREATE TABLE "PublicRFQLead" (
  "id" TEXT NOT NULL,
  "trackingId" TEXT NOT NULL,
  "productSlug" TEXT,
  "sku" TEXT,
  "annualVolume" INTEGER,
  "sopDate" TIMESTAMP(3),
  "contactEmail" TEXT,
  "step" INTEGER NOT NULL,
  "convertedToId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublicRFQLead_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PublicRFQLead_trackingId_key" ON "PublicRFQLead"("trackingId");

ALTER TABLE "SupplierUser" ADD CONSTRAINT "SupplierUser_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RFQ" ADD CONSTRAINT "RFQ_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RFQDocument" ADD CONSTRAINT "RFQDocument_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RFQTransition" ADD CONSTRAINT "RFQTransition_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PPAPSubmission" ADD CONSTRAINT "PPAPSubmission_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PPAPDocument" ADD CONSTRAINT "PPAPDocument_ppapId_fkey" FOREIGN KEY ("ppapId") REFERENCES "PPAPSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CARReport" ADD CONSTRAINT "CARReport_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CARDocument" ADD CONSTRAINT "CARDocument_carId_fkey" FOREIGN KEY ("carId") REFERENCES "CARReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierScorecard" ADD CONSTRAINT "SupplierScorecard_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_rfqId_fkey" FOREIGN KEY ("rfqId") REFERENCES "RFQ"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_ppapId_fkey" FOREIGN KEY ("ppapId") REFERENCES "PPAPSubmission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_carId_fkey" FOREIGN KEY ("carId") REFERENCES "CARReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScorecardPeriod" ADD CONSTRAINT "ScorecardPeriod_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CapacitySnapshot" ADD CONSTRAINT "CapacitySnapshot_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
