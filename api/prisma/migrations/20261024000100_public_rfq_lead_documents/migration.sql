-- Store verified uploads made by the public RFQ intake form.
CREATE TABLE "PublicRFQLeadDocument" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublicRFQLeadDocument_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PublicRFQLeadDocument_storageKey_key" ON "PublicRFQLeadDocument"("storageKey");
CREATE INDEX "PublicRFQLeadDocument_leadId_idx" ON "PublicRFQLeadDocument"("leadId");
ALTER TABLE "PublicRFQLeadDocument" ADD CONSTRAINT "PublicRFQLeadDocument_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "PublicRFQLead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
