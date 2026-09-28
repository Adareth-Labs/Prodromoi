# PrecisionCore Automotive — Public Site

Next.js 14 public marketing site. App Router, TypeScript, Tailwind CSS.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS — Achromatic Industrial design system |
| CMS | Payload CMS (delivery + preview + webhooks) |
| Investor docs | AWS S3 + pre-signed URLs |
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
- `Payload CMS_SPACE_ID`
- `Payload CMS_DELIVERY_TOKEN`
- `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY` + `R2_INVESTOR_BUCKET`
- `ATS_API_KEY`

## Payload CMS content models

Create these content types in Payload CMS before the first build:

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