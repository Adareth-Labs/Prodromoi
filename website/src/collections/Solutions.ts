import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Solutions: CollectionConfig = {
  slug: 'solutions',
  labels: { singular: 'Solution', plural: 'Solutions' },
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'domain', 'status', 'updatedAt'],
    listSearchableFields: ['title', 'summary', 'domain'],
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL}/solutions/${doc.slug}`,
  },
  access: { read: () => true },
  versions: { drafts: { autosave: { interval: 800 } } },
  fields: [
    // ── Identity ──────────────────────────────────────────────────────────────
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL path segment — lowercase, hyphens only' },
    },
    {
      name: 'domain',
      type: 'select',
      required: true,
      options: [
        { label: 'Electric Vehicle',         value: 'EV' },
        { label: 'ADAS & Autonomy',          value: 'ADAS' },
        { label: 'Powertrain',               value: 'Powertrain' },
        { label: 'Thermal Management',       value: 'Thermal' },
        { label: 'Chassis & Safety',         value: 'Chassis' },
        { label: 'Connected Systems',        value: 'Connected' },
        { label: 'Interiors',                value: 'Interiors' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft',     value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar', description: 'CMS publishing state — not the product lifecycle stage, see Lifecycle status below' },
    },
    {
      name: 'lifecycleStatus',
      type: 'select',
      label: 'Lifecycle status',
      admin: { position: 'sidebar', description: 'Product lifecycle stage (was Contentful "status")' },
      options: [
        { label: 'Active production',   value: 'active-production' },
        { label: 'Beta validation',     value: 'beta-validation' },
        { label: 'Engineering sample',  value: 'engineering-sample' },
        { label: 'End of life',         value: 'end-of-life' },
      ],
    },
    {
      name: 'partFamily',
      type: 'text',
      admin: { description: 'e.g. "Battery Thermal Modules" — from Contentful partFamily' },
    },
    {
      name: 'vehicleSegments',
      type: 'select',
      hasMany: true,
      label: 'Vehicle segments',
      options: [
        { label: 'Passenger cars',            value: 'passenger-cars' },
        { label: 'Commercial vehicles',       value: 'commercial-vehicles' },
        { label: 'Off-highway',               value: 'off-highway' },
        { label: 'Motorcycles & powersports', value: 'motorcycles-powersports' },
      ],
    },
    {
      name: 'certifications',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'IATF 16949',          value: 'IATF 16949' },
        { label: 'ISO 9001:2015',       value: 'ISO 9001:2015' },
        { label: 'ISO 14001',           value: 'ISO 14001' },
        { label: 'ISO 26262 ASIL D',    value: 'ISO 26262 ASIL D' },
        { label: 'ISO 26262 ASIL B',    value: 'ISO 26262 ASIL B' },
        { label: 'REACH',               value: 'REACH' },
        { label: 'RoHS',                value: 'RoHS' },
      ],
    },
    {
      name: 'oemCompatibility',
      type: 'text',
      hasMany: true,
      label: 'OEM compatibility',
      admin: { description: 'e.g. "GM", "Ford"' },
    },
    {
      name: 'technicalDataSheetUrl',
      type: 'text',
      label: 'Technical data sheet URL',
    },
    {
      name: 'featuredOnHomepage',
      type: 'checkbox',
      label: 'Featured on homepage',
      defaultValue: false,
    },
    // ── Content ───────────────────────────────────────────────────────────────
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      admin: { description: 'One-paragraph teaser shown on the solutions listing page' },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'body',
      type: 'richText',
      editor: lexicalEditor({}),
    },
    // ── Specs table ──────────────────────────────────────────────────────────
    {
      name: 'specs',
      type: 'array',
      label: 'Technical specifications',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'value', type: 'text', required: true },
        { name: 'unit',  type: 'text' },
      ],
    },
    // ── SEO ───────────────────────────────────────────────────────────────────
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'title',       type: 'text',     label: 'Meta title' },
        { name: 'description', type: 'textarea',  label: 'Meta description', admin: { rows: 3 } },
        { name: 'ogImage',     type: 'upload',    label: 'OG image', relationTo: 'media' },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc }) => {
        // Trigger Next.js ISR revalidation
        if (process.env.NEXT_PUBLIC_SITE_URL && process.env.REVALIDATION_SECRET) {
          await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate?secret=${process.env.REVALIDATION_SECRET}&tag=solutions`,
            { method: 'POST' }
          ).catch(console.error)
        }
        return doc
      },
    ],
  },
}
