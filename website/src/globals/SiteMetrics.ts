import type { GlobalConfig } from 'payload'

// Contentful's `siteMetrics` content type had no Payload equivalent at all.
// Modeled as a Global (one singleton document) rather than a Collection,
// since this is exactly the aggregate data the homepage currently hardcodes
// (revenue, facility count, headcount, etc.) — there's only ever one
// "current" set of site-wide numbers, not a list of many.
//
// Note: Contentful's `lastUpdated` field needs no equivalent here — Payload
// globals already carry an automatic `updatedAt` timestamp on every save.
export const SiteMetrics: GlobalConfig = {
  slug: 'site-metrics',
  label: 'Site metrics',
  access: { read: () => true },
  fields: [
    {
      name: 'revenueRunRate',
      type: 'text',
      required: true,
      label: 'Revenue run rate',
      admin: { description: 'Display string, e.g. "$1.2B"' },
    },
    {
      name: 'revenueYear',
      type: 'text',
      required: true,
    },
    {
      name: 'facilityCount',
      type: 'number',
      required: true,
    },
    {
      name: 'headcount',
      type: 'number',
      required: true,
    },
    {
      name: 'iatfCertifiedCount',
      type: 'number',
      required: true,
      label: 'IATF-certified facility count',
    },
    {
      name: 'countryCount',
      type: 'number',
      required: true,
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc }) => {
        // Mirrors the existing collection revalidation hooks (see Solutions.ts)
        if (process.env.NEXT_PUBLIC_SITE_URL && process.env.REVALIDATION_SECRET) {
          await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate?secret=${process.env.REVALIDATION_SECRET}&tag=site-metrics`,
            { method: 'POST' }
          ).catch((err) => console.error('[SiteMetrics] revalidation failed', err))
        }
        return doc
      },
    ],
  },
}
