# PrecisionCore Automotive — Public Site

Next.js 16 public marketing site. App Router, TypeScript, Tailwind CSS.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS — Achromatic Industrial design system |
| CMS | Payload CMS (delivery + preview + webhooks) |
| Investor docs | Supabase Storage via S3-compatible signed URLs |
| Job listings | Greenhouse ATS API |
| Search | Algolia |
| Deployment | Vercel |

## Routes

| Route | Strategy | Revalidation |
|-------|----------|-------------|
| `/` | ISR | 1 hour |
| `/solutions` | ISR | 1 hour |
| `/solutions/[slug]` | SSG + ISR | 1 hour |
| `/innovation` | ISR | 1 hour |
| `/innovation/[slug]` | SSG + ISR | 1 hour |
| `/company` | ISR | 24 hours |
| `/company/investors` | SSR (force-dynamic) | Always fresh |
| `/newsroom` | ISR | 5 minutes |
| `/newsroom/[slug]` | SSG + ISR | 5 minutes |
| `/careers` | ISR | 30 minutes |
| `/governance` | ISR | 24 hours |
| `/privacy` | Static | Build only |

## Setup

```bash
cp .env.example .env.local
# Populate all values in .env.local

npm install
npm run dev
```

## Environment variables

See `.env.example` — all variables are documented inline.

Required before first run:
- `DATABASE_URL` (PostgreSQL connection string with the `payload` schema)
- `PAYLOAD_SECRET`
- Supabase Storage S3 endpoint, region, access key, secret key, public URL and the configured bucket names (see `.env.example`)
- `SMTP_USER`, `SMTP_PASS` and `SMTP_FROM` when CMS email is enabled
- `ATS_API_KEY` only when the live careers integration is enabled

## Payload CMS content models

The collections below are defined in code. Create or migrate the Payload database before using them:

- `solution` — product records
- `innovationArticle` — R&D editorial
- `newsArticle` — press releases and announcements
- `leadershipProfile` — executive bios
- `facility` — manufacturing locations
- `boardMember` — governance profiles
- `siteMetrics` — homepage KPIs

Field schemas match the type definitions in `src/types/index.ts`.

## Revalidation

Payload CMS publishes → webhook to `/api/revalidate` → path-specific ISR.
Vercel Cron runs every 6 hours → `/api/revalidate/scheduled` → full refresh.
Configure the webhook secret in both Payload CMS and `Payload CMS_WEBHOOK_SECRET`.

## Deployment

```bash
# Preview
vercel

# Production
vercel --prod
```

Regions: `lhr1` (London) + `iad1` (Virginia). Configure additional regions in `vercel.json`.

## Partner portal

The authenticated partner portal is a **separate application** at `portal.precisioncore.com`.
The public site links to it but does not share code or infrastructure.
Set `NEXT_PUBLIC_PORTAL_URL` to the portal deployment URL.

<!-- Legacy R2 note retained for rollback reference only: the previous setup used R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_INVESTOR_BUCKET. These are not active requirements. -->
