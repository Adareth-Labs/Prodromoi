# PrecisionCore API

Node.js REST API for the PrecisionCore partner portal. JWT auth via Supabase Auth, RBAC by supplier tier, RFQ state machine, PPAP management, CAR quality workflow, audit logging, and SMTP2Go email notifications.

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Language | TypeScript |
| ORM | Prisma + PostgreSQL |
| Auth | Supabase Auth (JWT via JWKS) |
| Storage | Supabase Storage via S3-compatible endpoint (pre-signed URLs) |
| Email | SMTP2Go (SMTP) |
| Logging | Winston + daily rotate |

## Architecture

```
Request → CORS → Helmet → Rate Limit → Auth Middleware → RBAC → Route Handler → Service → PostgreSQL/Supabase Storage/Email → Audit Log → Response
```

## Tier permissions

| Permission | BASIC | QUALIFIED | STRATEGIC |
|------------|-------|-----------|-----------|
| rfq:read | ✓ | ✓ | ✓ |
| rfq:create | | ✓ | ✓ |
| ppap:read | | ✓ | ✓ |
| ppap:upload | | ✓ | ✓ |
| car:read | | ✓ | ✓ |
| car:create | | ✓ | ✓ |
| document:certs | ✓ | ✓ | ✓ |
| document:cad | | ✓ | ✓ |
| document:roadmap | | | ✓ |

## RFQ State Machine

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → IN_PRODUCTION
                                 ↘ REJECTED
                 ↘ CLARIFICATION_REQUIRED → SUBMITTED
Any → CANCELLED
```

## Authentication

The API verifies Supabase Auth access tokens using the project JWKS endpoint. Supplier tier and membership are resolved from the server-managed `SupplierUser` and `Supplier` records, not client-editable metadata. Internal quality reviewers are separately provisioned in the server-managed `InternalReviewer` table; a Supabase Auth account alone never grants reviewer permissions.

## Setup

```bash
cp .env.example .env
# Populate all values. Generate server-only S3-compatible credentials in Supabase:
# Dashboard → Storage → Configuration / S3 Configuration → Enable S3 protocol → Generate keys.
# Use the Storage project's endpoint https://<project-ref>.supabase.co/storage/v1/s3
# and its exact region. Keep the generated access/secret keys server-side only.

npm ci
npx prisma generate
npm run dev
```

Create a **private** Supabase Storage bucket named `partner-private` for RFQ, PPAP,
certificate, CAD and roadmap files. The API signs short-lived upload/download URLs
using the Supabase S3-compatible endpoint. Ensure the `site-media` bucket is separate
and contains only assets approved for public retrieval.

Cloudflare R2 implementation details are retained in commented legacy blocks for rollback
reference; R2 variables are no longer required by the active API configuration.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Liveness check |
| GET | /health/ready | Readiness check (DB ping) |
| GET | /v1/rfq | List supplier RFQs |
| POST | /v1/rfq | Create RFQ |
| GET | /v1/rfq/:id | Get RFQ detail |
| POST | /v1/rfq/:id/transition | State machine event |
| POST | /v1/rfq/:id/documents/upload-url | Get Supabase Storage upload URL |
| GET | /v1/rfq/:id/documents/:docId/download | Get Supabase Storage download URL |
| GET | /v1/ppap | List PPAP submissions |
| POST | /v1/ppap | Create PPAP submission |
| POST | /v1/ppap/:id/documents/upload-url | Upload PPAP document |
| GET | /v1/quality | List supplier-owned CAR reports |
| POST | /v1/quality | Create supplier CAR report |
| POST | /v1/quality/:id/transition | Advance supplier CAR workflow (cannot close) |
| GET | /v1/quality/reviewer/me | Resolve the authenticated internal reviewer role |
| GET | /v1/quality/reviewer/queue | List CARs awaiting internal verification |
| GET | /v1/quality/reviewer/cars/:id | View CAR and supplier evidence for internal review |
| GET | /v1/quality/reviewer/cars/:id/documents/:documentId/download | Audit and sign a CAR document download |
| POST | /v1/quality/reviewer/cars/:id/decision | Approve and close, or return for changes with required notes |
| GET | /v1/suppliers/me | Supplier profile |
| GET | /v1/suppliers/me/scorecard | Supplier scorecard |
| GET | /v1/suppliers/me/audit-log | Audit trail |
| GET | /v1/documents/certs/:certId | Download certificate |
| GET | /v1/documents/cad/:key | Download CAD file |
| GET | /v1/documents/roadmap/:key | Download roadmap (STRATEGIC) |


## Internal CAR quality-review workflow

Internal reviewers use the same Supabase Auth sign-in at the partner portal. The portal root routes an authorized internal account to `/quality-review`; supplier accounts continue to `/dashboard`. Accounts with neither active supplier mapping nor an `InternalReviewer` row receive an account-not-provisioned message.

After the `20261024000200_internal_quality_review` migration is applied, provision each reviewer explicitly using the SQL procedure in `prisma/migrations/README.md`. The API uses the row's `supabaseId`, `isActive`, and role as the authorization source of truth. Do not assign internal roles through user-editable metadata or expose database credentials to the browser.

The queue includes CARs in `VERIFICATION_PENDING` only. Every decision requires notes of at least 10 characters. `APPROVE` records the reviewer as verifier and closer, stamps the verification/closure times, and sets status to `CLOSED`. `REQUEST_CHANGES` returns the CAR to `ACTION_PLAN_SUBMITTED`, persists the review notes and reviewer identity, and clears the closure/verification stamps so the supplier can revise and resubmit. A compare-and-swap status update ensures only one concurrent reviewer decision is accepted. Reviewer decisions and document downloads are audited, and the supplier contact receives a decision email when SMTP is configured.

### Apply schema changes

From `api/`, after backing up the database and confirming the existing migration history:

```powershell
npx prisma migrate deploy
npx prisma generate
```

For a previously initialized database, follow `prisma/migrations/README.md` before applying migrations; do not mark migrations applied without confirming the existing schema matches.
