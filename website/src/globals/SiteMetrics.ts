import type { GlobalConfig } from 'payload'

import { triggerContentRevalidation } from '../lib/revalidate-content'
// The siteMetrics model content type had no Payload equivalent at all.
// Modeled as a Global (one singleton document) rather than a Collection,
// since this is exactly the aggregate data the homepage currently hardcodes
// (revenue, facility count, headcount, etc.) — there's only ever one
// "current" set of site-wide numbers, not a list of many.
//
// Note: The previous lastUpdated field field needs no equivalent here — Payload
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
        await triggerContentRevalidation('siteMetrics')
        return doc
      }
    ],
  },
}
