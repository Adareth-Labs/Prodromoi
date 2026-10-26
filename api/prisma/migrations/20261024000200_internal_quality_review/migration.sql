-- Internal quality-review workflow. Reviewer registration is explicit and server-side only.
CREATE TYPE "InternalReviewerRole" AS ENUM ('QUALITY_REVIEWER', 'QUALITY_ADMIN');

CREATE TABLE "InternalReviewer" (
  "id" TEXT NOT NULL,
  "supabaseId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" "InternalReviewerRole" NOT NULL DEFAULT 'QUALITY_REVIEWER',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "InternalReviewer_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InternalReviewer_supabaseId_key" ON "InternalReviewer"("supabaseId");
CREATE UNIQUE INDEX "InternalReviewer_email_key" ON "InternalReviewer"("email");
CREATE INDEX "InternalReviewer_isActive_role_idx" ON "InternalReviewer"("isActive", "role");

ALTER TABLE "CARReport"
  ADD COLUMN "reviewerNotes" TEXT,
  ADD COLUMN "reviewedBy" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);
