# PrecisionCore Automotive — Partner Portal

Next.js 15 App Router application for authenticated supplier collaboration across PrecisionCore Automotive’s partner network. Supabase Auth handles sessions; the central Express API owns supplier/business data; Cloudflare R2 owns document storage.

## Architecture

```text
partners.precisioncore.example
├── Supabase Auth                 ← password, magic-link and OAuth sessions
├── Express API                   ← authentication context, RBAC, supplier/business data
├── PostgreSQL + Prisma           ← owned and accessed by the API only
├── Cloudflare R2                 ← RFQ and PPAP documents via API-issued pre-signed URLs
└── Next.js middleware            ← session validation only
```

## Access tiers

| Tier | Name | Access |
|---|---|---|
| 1 | Basic | Dashboard and basic supplier information |
| 2 | Qualified | + RFQ submission, PPAP, supplier scorecard |
| 3 | Strategic | + CAR workflow and capacity dashboard |

Tier is sourced from the linked `Supplier` record by the Express API. The portal sends the Supabase access token to the API, and the API enforces tier permissions server-side.

## Authentication

The application uses Supabase Auth end-to-end. The login screen supports password, magic-link, Google and Azure sign-in. OAuth and magic-link callbacks are handled by `/auth/callback`, which exchanges the PKCE code for a session.

The portal does not store authorization state locally. The API maps the Supabase `sub` to `SupplierUser` and derives supplier membership, vendor ID, active status, and tier from PostgreSQL. Never expose the Supabase service-role key to the browser.

## Quick start

```bash
npm install
npm run dev
```

Populate the required environment variables in `.env.local` before starting the app. Keep that file out of version control.

## Project structure

```text
portal/
├── middleware.ts
└── src/
    ├── app/
    │   ├── auth/callback/
    │   ├── dashboard/
    │   ├── rfq/
    │   ├── ppap/
    │   ├── scorecard/
    │   ├── car/
    │   └── capacity/
    ├── components/
    ├── hooks/
    ├── lib/
    │   ├── auth.ts
    │   ├── api.ts
    │   ├── api-server.ts
    │   ├── rbac.ts
    │   └── supabase/
    ├── styles/
    └── types/
```

## RBAC defense in depth

1. Middleware validates the Supabase user session.
2. The Express API validates the Supabase JWT, resolves the SupplierUser/Supplier mapping, and enforces permissions/tier.
3. The portal has no direct PostgreSQL/Prisma access.
4. UI components hide or lock features for lower tiers, but UI state is never treated as the security boundary.

## Document uploads

Files are uploaded directly from the browser to Cloudflare R2 using pre-signed URLs issued by the Express API. PostgreSQL stores the metadata and ownership relationship behind the API.
