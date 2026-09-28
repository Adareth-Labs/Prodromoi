import type { CollectionConfig } from 'payload'

// Board-member records are managed directly in Payload CMS.
export const BoardMembers: CollectionConfig = {
  slug: 'board-members',
  labels: { singular: 'Board member', plural: 'Board members' },
  admin: {
    group: 'Company',
    useAsTitle: 'name',
    defaultColumns: ['name', 'title', 'type', 'order'],
  },
  access: { read: () => true },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'committee',
      type: 'text',
      admin: { description: 'e.g. "Audit Committee (Chair)" — optional' },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Executive',     value: 'executive' },
        { label: 'Independent',   value: 'independent' },
        { label: 'Non-executive', value: 'non-executive' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      label: 'Display order',
      defaultValue: 99,
      admin: { position: 'sidebar', description: 'Lower numbers appear first' },
    },
  ],
}
