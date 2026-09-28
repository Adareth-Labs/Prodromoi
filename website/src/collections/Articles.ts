import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'Innovation article', plural: 'Innovation articles' },
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'domain', 'publishedAt', 'status'],
    preview: (doc) => `${process.env.NEXT_PUBLIC_SITE_URL}/innovation/${doc.slug}`,
  },
  access: { read: () => true },
  versions: { drafts: { autosave: { interval: 800 } } },
  fields: [
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
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft',     value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'domain',
      type: 'select',
      admin: { description: 'Product domain this article relates to — separate from Topic category below' },
      options: [
        { label: 'Electric Vehicle',   value: 'EV' },
        { label: 'ADAS & Autonomy',    value: 'ADAS' },
        { label: 'Powertrain',         value: 'Powertrain' },
        { label: 'Thermal Management', value: 'Thermal' },
        { label: 'Chassis & Safety',   value: 'Chassis' },
        { label: 'Connected Systems',  value: 'Connected' },
      ],
    },
    {
      name: 'topicCategory',
      type: 'select',
      label: 'Topic category',
      admin: { description: 'Innovation topic (Contentful "category") — a different classification than Domain above' },
      options: [
        { label: 'Software-defined vehicle', value: 'software-defined-vehicle' },
        { label: 'Electrification',          value: 'electrification' },
        { label: 'Hydrogen fuel cell',       value: 'hydrogen-fuel-cell' },
        { label: 'Cybersecurity',            value: 'cybersecurity' },
        { label: 'E/E architecture',         value: 'ee-architecture' },
        { label: 'Autonomous driving',       value: 'autonomous-driving' },
        { label: 'Circular economy',         value: 'circular-economy' },
      ],
    },
    {
      name: 'authorName',
      type: 'text',
      label: 'Author name',
    },
    {
      name: 'authorRole',
      type: 'text',
      label: 'Author role',
    },
    {
      name: 'readTimeMinutes',
      type: 'number',
      label: 'Read time (minutes)',
    },
    {
      name: 'isWhitePaper',
      type: 'checkbox',
      label: 'Is white paper',
      defaultValue: false,
    },
    {
      name: 'whitePaperAsset',
      type: 'upload',
      relationTo: 'media',
      label: 'White paper asset',
      admin: { condition: (data) => Boolean(data?.isWhitePaper) },
    },
    {
      name: 'featuredOnHomepage',
      type: 'checkbox',
      label: 'Featured on homepage',
      defaultValue: false,
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      admin: { description: 'One-paragraph summary shown on listing and social share' },
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'body',
      type: 'richText',
      editor: lexicalEditor({}),
      required: true,
    },
    {
      name: 'relatedSolutions',
      type: 'relationship',
      relationTo: 'solutions',
      hasMany: true,
      admin: { description: 'Link to related product solutions' },
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      admin: { position: 'sidebar' },
      fields: [
        { name: 'title',       type: 'text',    label: 'Meta title' },
        { name: 'description', type: 'textarea', label: 'Meta description', admin: { rows: 3 } },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc }) => {
        if (process.env.NEXT_PUBLIC_SITE_URL && process.env.REVALIDATION_SECRET) {
          await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate?secret=${process.env.REVALIDATION_SECRET}&tag=innovation`,
            { method: 'POST' }
          ).catch(console.error)
        }
        return doc
      },
    ],
  },
}
