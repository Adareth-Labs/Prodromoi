-- One-off data migration: legacy partner-portal tables -> the unified API schema.
--
-- WHEN TO USE: only if the portal already has real data in the legacy tables
-- (vendors, rfq_submissions, ppap_documents, supplier_scorecards, cars,
-- capacity_snapshots, rfq_documents, public_rfq_leads). Fresh installs skip this.
--
-- ORDER OF OPERATIONS
--   1. Back up the database.
--   2. Run STEP 0 below (renames the legacy enum types, which clash by name
--      with the API's enums of the same names but different values).
--   3. From ../api run:  npx prisma db push      (creates the unified tables)
--   4. Run STEP 1 (this rest of the file) in a transaction.
--   5. Verify row counts / spot-check in the portal, THEN drop the legacy tables.
--
-- NOT TESTED against a live database — review and dry-run on a copy first.

-- ── STEP 0 (run BEFORE `prisma db push`) ─────────────────────────────────────
-- ALTER TYPE "RFQStatus"   RENAME TO "RFQStatus_legacy";
-- ALTER TYPE "PPAPStatus"  RENAME TO "PPAPStatus_legacy";
-- ALTER TYPE "CARSeverity" RENAME TO "CARSeverity_legacy";
-- ALTER TYPE "CARStatus"   RENAME TO "CARStatus_legacy";
-- ("LineStatus" is defined identically in both schemas and is shared as-is.)

-- ── STEP 1 (run AFTER `prisma db push`) ──────────────────────────────────────
BEGIN;

-- Vendors -> Supplier. contactEmail is required by the unified schema; take it
-- from the linked Supabase user, else a clearly-fake placeholder to fix by hand.
INSERT INTO "Supplier" (id, "vendorId", "companyName", tier, "isActive", "contactEmail", oems, "createdAt", "updatedAt")
SELECT v.id,
       v."vendorId",
       v.company,
       (CASE v.tier WHEN 3 THEN 'STRATEGIC' WHEN 2 THEN 'QUALIFIED' ELSE 'BASIC' END)::"PortalTier",
       (v.status = 'active'),
       COALESCE(u.email, 'unknown+' || v."vendorId" || '@invalid.example'),
       ARRAY[]::text[],
       v."createdAt",
       v."updatedAt"
FROM vendors v
LEFT JOIN auth.users u ON u.id::text = v."authUserId";

-- The linked Supabase login becomes a SupplierUser (this is what the portal's
-- getPortalUser() now looks up by supabaseId).
INSERT INTO "SupplierUser" (id, "supplierId", "supabaseId", email, name, role, "createdAt")
SELECT 'su-' || v.id,
       v.id,
       v."authUserId",
       u.email,
       COALESCE(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', u.email),
       'member',
       v."createdAt"
FROM vendors v
JOIN auth.users u ON u.id::text = v."authUserId"
WHERE v."authUserId" IS NOT NULL;

-- RFQ submissions -> RFQ. Legacy PENDING == submitted.
INSERT INTO "RFQ" (id, "trackingId", "supplierId", "partFamily", "partNumber", "partName", "targetPrice",
                   material, "toleranceClass", "drawingRef", "requiredBy", notes, "annualVolume",
                   status, "submittedAt", "createdAt", "updatedAt", "createdBy")
SELECT r.id, r."referenceId", r."vendorId", r."partName", r."partNumber", r."partName", r."targetPrice",
       r.material, r."toleranceClass", r."drawingRef", r."requiredBy", r.notes, r."annualVolume",
       (CASE r.status::text WHEN 'PENDING' THEN 'SUBMITTED' ELSE r.status::text END)::"RFQStatus",
       r."submittedAt", r."submittedAt", r."updatedAt",
       COALESCE((SELECT su."supabaseId" FROM "SupplierUser" su WHERE su."supplierId" = r."vendorId" LIMIT 1), 'legacy-import')
FROM rfq_submissions r;

INSERT INTO "RFQDocument" (id, "rfqId", "s3Key", "fileName", "contentType", "sizeBytes", "isRequired", "uploadedBy", "uploadedAt")
SELECT d.id, d."rfqId", d."s3Key", d."fileName", d."fileType", d."sizeBytes", false, 'legacy-import', d."uploadedAt"
FROM rfq_documents d;

-- Legacy PPAP documents were per-vendor; the unified model groups documents
-- under a PPAPSubmission. One submission per (vendor, level), status derived
-- from its documents, platform recorded as LEGACY-L<level>.
INSERT INTO "PPAPSubmission" (id, "supplierId", "platformId", status, "createdAt", "updatedAt")
SELECT 'legacy-ppap-' || d."vendorId" || '-' || d."ppapLevel",
       d."vendorId",
       'LEGACY-L' || d."ppapLevel",
       (CASE
          WHEN bool_and(d.status::text = 'APPROVED')     THEN 'APPROVED'
          WHEN bool_or(d.status::text = 'REJECTED')      THEN 'REJECTED'
          WHEN bool_or(d.status::text = 'UNDER_REVIEW')  THEN 'UNDER_REVIEW'
          ELSE 'PENDING'
        END)::"PPAPStatus",
       min(d."uploadedAt"),
       max(d."updatedAt")
FROM ppap_documents d
GROUP BY d."vendorId", d."ppapLevel";

INSERT INTO "PPAPDocument" (id, "ppapId", "documentType", "s3Key", "fileName", "sizeBytes", "ppapLevel", "isRequired", "uploadedBy", "uploadedAt")
SELECT d.id, 'legacy-ppap-' || d."vendorId" || '-' || d."ppapLevel", 'Legacy', d."s3Key", d.name,
       d."sizeBytes", d."ppapLevel", true, 'legacy-import', d."uploadedAt"
FROM ppap_documents d;

-- Monthly scorecards
INSERT INTO "ScorecardPeriod" (id, "supplierId", period, "qualityPPM", "deliveryOTD", responsiveness,
                               documentation, innovation, sustainability, "overallGrade", "createdAt")
SELECT s.id, s."vendorId", s.period, s."qualityPPM", s."deliveryOTD", s.responsiveness,
       s.documentation, s.innovation, s.sustainability, s."overallGrade", s."createdAt"
FROM supplier_scorecards s;

-- CARs -> CARReport
INSERT INTO "CARReport" (id, "carId", "supplierId", severity, status, "deviationDescription", "partId",
                         "affectedQty", "detectedBy", why1, "rootCause", "correctiveAction", "preventiveAction",
                         "closureNotes", "currentStep", "closedAt", "createdBy", "createdAt", "updatedAt")
SELECT c.id, c."referenceId", c."vendorId",
       c.severity::text::"CARSeverity",
       (CASE c.status::text
          WHEN 'OPEN'           THEN 'OPEN'
          WHEN 'IN_PROGRESS'    THEN 'ROOT_CAUSE_IDENTIFIED'
          WHEN 'PENDING_REVIEW' THEN 'VERIFICATION_PENDING'
          WHEN 'CLOSED'         THEN 'CLOSED'
        END)::"CARStatus",
       c.deviation, c."nonConformingPart", c."affectedQty", c."detectedBy", c.why1, c."rootCause",
       c."correctiveActions", c."preventiveActions", c."closureNotes", c."currentStep", c."closedAt",
       COALESCE((SELECT su."supabaseId" FROM "SupplierUser" su WHERE su."supplierId" = c."vendorId" LIMIT 1), 'legacy-import'),
       c."openedAt", c."updatedAt"
FROM cars c;

-- Capacity + public leads carry over 1:1
INSERT INTO "CapacitySnapshot" (id, "supplierId", "lineId", "lineName", oee, utilization, status, "snapshotAt")
SELECT id, "vendorId", "lineId", "lineName", oee, utilization, status, "snapshotAt" FROM capacity_snapshots;

INSERT INTO "PublicRFQLead" (id, "trackingId", "productSlug", sku, "annualVolume", "sopDate", "contactEmail", step, "convertedToId", "createdAt")
SELECT id, "trackingId", "productSlug", sku, "annualVolume", "sopDate", "contactEmail", step, "convertedToId", "createdAt"
FROM public_rfq_leads;

COMMIT;

-- Verify (counts should match), then drop the legacy tables:
--   SELECT (SELECT count(*) FROM vendors) legacy_vendors, (SELECT count(*) FROM "Supplier") suppliers;
--   DROP TABLE public_rfq_leads, capacity_snapshots, cars, supplier_scorecards, ppap_documents,
--              rfq_documents, rfq_submissions, vendors;
--   DROP TYPE "RFQStatus_legacy", "PPAPStatus_legacy", "CARSeverity_legacy", "CARStatus_legacy";
