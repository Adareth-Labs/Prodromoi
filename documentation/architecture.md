# Architecture Notes

## Authentication

Supabase Auth is used end-to-end. The partner portal uses SSR session cookies and `getUser()` validation. The API verifies Supabase JWTs using the project JWKS endpoint.

## Authorization

The portal uses three supplier tiers. Authorization metadata is kept in Supabase `app_metadata`; server-side application data is linked through the `Vendor.authUserId` field.

The API normalizes the same tier model to `BASIC`, `QUALIFIED`, and `STRATEGIC`.

## Storage

Cloudflare R2 is the object store. Because R2 exposes an S3-compatible API, the Express API uses the AWS SDK's S3 protocol client to issue pre-signed upload/download URLs. AWS cloud infrastructure is not part of the deployment. R2 credentials are supplied through the API runtime environment and are not part of the repository.

## Backend boundary

The Express API is the single application-data boundary for the partner portal and public RFQ intake. The portal uses Supabase only for authentication/session state and calls `/v1/*` with the Supabase access token. The portal does not import Prisma or connect to PostgreSQL.

The public website calls `POST /v1/public/rfq` directly for anonymous RFQ lead intake. Payload CMS remains a separate website CMS/data store under the `payload` PostgreSQL schema.
