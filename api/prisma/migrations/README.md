# Prisma migration baseline

The API schema now has checked-in Prisma migrations:

- `20261024000000_init` creates the API schema as it existed before public RFQ document attachments.
- `20261024000100_public_rfq_lead_documents` adds the metadata table used to associate verified private uploads with public RFQ leads.
- `20261024000200_internal_quality_review` adds server-managed internal reviewer assignments and persisted CAR review notes.

## Fresh database

Use a dedicated PostgreSQL schema/database for the API, set `DATABASE_URL`, then run:

```powershell
npx prisma migrate deploy
npx prisma generate
```

## Existing database already created from this Prisma schema

**Back up the database first.** Do not run the baseline migration against an existing database without resolving the baseline; the initial migration intentionally creates the original API tables. Confirm that the existing API schema matches the initial migration (and that the new `PublicRFQLeadDocument` table does not already exist), then mark the initial migration as applied and apply only the follow-up migration:

```powershell
npx prisma migrate resolve --applied 20261024000000_init
npx prisma migrate deploy
npx prisma generate
```

If your existing schema differs, do not run those commands blindly. Compare it to `schema.prisma` and create a reviewed corrective migration first. Payload CMS must use its separately configured `payload` schema/database URL; do not use Prisma migrations to alter Payload's schema.


## Provision internal quality reviewers

The reviewer workflow is available at `/quality-review` in the partner portal, but **logging in to Supabase Auth alone does not grant internal access**. An administrator must create/invite the user in Supabase Auth and explicitly provision the user's Supabase Auth UUID in the API database's `InternalReviewer` table. Do not grant this role through client-editable user metadata.

After applying migrations, run a reviewed SQL insert in the **API database** using the exact Auth user UUID and verified email. Supply a new UUID for the `id` column:

```sql
INSERT INTO "InternalReviewer"
  ("id", "supabaseId", "email", "name", "role", "isActive", "createdAt", "updatedAt")
VALUES
  ('REPLACE_WITH_NEW_UUID', 'REPLACE_WITH_SUPABASE_AUTH_USER_UUID', 'reviewer@example.com', 'Quality Reviewer', 'QUALITY_REVIEWER', true, now(), now());
```

Use `QUALITY_ADMIN` only for staff who are explicitly authorized to act as internal quality reviewers. Both roles currently can approve or return CARs; neither role grants supplier dashboard permissions. Set `isActive = false` to revoke access while retaining the audit mapping.

Reviewers sign in through the normal portal login. The API authenticates the Supabase token, looks up the `InternalReviewer` row server-side, and records approval or return-for-changes decisions in the audit log. Each decision requires notes; approval closes a CAR, while requesting changes returns it to `ACTION_PLAN_SUBMITTED` for supplier updates and resubmission.
