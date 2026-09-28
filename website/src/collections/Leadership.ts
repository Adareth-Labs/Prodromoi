import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Leadership: CollectionConfig = {
  slug: 'leadership',
  labels: { singular: 'Leader', plural: 'Leadership' },
  admin: {
    group: 'Company',
    useAsTitle: 'name',
    defaultColumns: ['name', 'jobTitle', 'department', 'order'],
  },
  access: { read: () => true },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'jobTitle',
      type: 'text',
      required: true,
      label: 'Job title',
    },
    {
      name: 'department',
      type: 'select',
      options: [
        { label: 'Executive',    value: 'executive' },
        { label: 'Engineering',  value: 'engineering' },
        { label: 'Operations',   value: 'operations' },
        { label: 'Commercial',   value: 'commercial' },
        { label: 'Finance',      value: 'finance' },
        { label: 'HR & People',  value: 'hr' },
      ],
    },
    {
      name: 'bio',
      type: 'richText',
      editor: lexicalEditor({}),
    },
    {
      name: 'portrait',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'linkedin',
      type: 'text',
      label: 'LinkedIn URL',
    },
    {
      name: 'order',
      type: 'number',
      label: 'Display order',
      defaultValue: 99,
      admin: {
        position: 'sidebar',
        description: 'Lower numbers appear first',
      },
    },
  ],
}
