# Database

There is **one schema**, owned by the API: `api/prisma/schema.prisma`.

| App | How it uses the database |
|---|---|
| `api` | Prisma, directly. Runs `prisma db push` / migrations. |
| `partner-portal` | Prisma against the **same schema file** (`package.json` → `"prisma": { "schema": "../api/prisma/schema.prisma" }`). Never edit a schema here. |
| `website` | Payload CMS (`postgresAdapter`) — its own tables, see below. |

## Model mapping (old portal schema → unified schema)

| Old portal model | Unified model | Notes |
|---|---|---|
| `Vendor` | `Supplier` + `SupplierUser` | `company`→`companyName`, `tier` 1/2/3→`PortalTier`, `status`→`isActive`. The Supabase login (`authUserId`) is now `SupplierUser.supabaseId`. |
| `RFQSubmission` | `RFQ` | `referenceId`→`trackingId`; part fields added to `RFQ`. Portal `PENDING` = API `SUBMITTED`. |
| `RFQDocument` | `RFQDocument` | `fileType`→`contentType`. |
| `PPAPDocument` (per vendor) | `PPAPDocument` under `PPAPSubmission` | `ppapLevel` added; status now comes from the parent submission. |
| `SupplierScorecard` (monthly) | `ScorecardPeriod` | Renamed: the API's `SupplierScorecard` is the single current-rating row. |
| `CAR` | `CARReport` | `referenceId`→`carId`, `deviation`→`deviationDescription`, `nonConformingPart`→`partId`; step-tracking fields added. |
| `CapacitySnapshot`, `PublicRFQLead` | same names | Added to the unified schema unchanged. |

The portal's UI still uses its own vocabulary (`referenceId`, `IN_PROGRESS`, tier `1|2|3`).
`partner-portal/src/lib/mappers.ts` converts database rows into those shapes in one place.

## Existing data

If the legacy portal tables hold real data, follow `api/prisma/migrate-portal-data.sql`
(rename clashing enums → `prisma db push` → copy data → verify → drop legacy tables).
It has not been run against a live database — dry-run it on a copy first.

## Payload (website) shares `DATABASE_URL` — separate it

`website/payload.config.ts` reads the same `DATABASE_URL`. Payload creates and manages its
own tables; Prisma does not know about them, so `prisma migrate` / `db push` can flag them as
drift (and `db push --accept-data-loss` would drop them). Give each its own Postgres schema:

    api + partner-portal:  DATABASE_URL=postgresql://…/postgres?schema=public
    website (Payload):     DATABASE_URL=postgresql://…/postgres?schema=payload

(Or use a separate database.) This is a deployment setting; no code change is needed.
