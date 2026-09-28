import type { CollectionConfig } from 'payload'

export const Facilities: CollectionConfig = {
  slug: 'facilities',
  labels: { singular: 'Facility', plural: 'Facilities' },
  admin: {
    group: 'Company',
    useAsTitle: 'name',
    defaultColumns: ['name', 'location', 'country', 'status'],
  },
  access: { read: () => true },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Facility name',
    },
    {
      name: 'location',
      type: 'text',
      required: true,
      label: 'City / site name',
    },
    {
      name: 'country',
      type: 'text',
      required: true,
    },
    {
      name: 'countryCode',
      type: 'text',
      label: 'Country code (ISO 3166-1 alpha-2)',
      maxLength: 2,
    },
    {
      name: 'facilityType',
      type: 'select',
      label: 'Facility type',
      admin: { description: 'What kind of site this is — distinct from Status below, which is its build phase' },
      options: [
        { label: 'Manufacturing',      value: 'manufacturing' },
        { label: 'R&D centre',         value: 'rd-centre' },
        { label: 'Sales office',       value: 'sales-office' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'operational',
      options: [
        { label: 'Operational',       value: 'operational' },
        { label: 'Under construction', value: 'construction' },
        { label: 'Planned',           value: 'planned' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'floorAreaM2',
      type: 'number',
      label: 'Floor area (m²)',
    },
    {
      name: 'headcount',
      type: 'number',
      label: 'Headcount',
    },
    {
      name: 'employeeRange',
      type: 'text',
      label: 'Employee range',
      admin: { description: 'Bucketed range as reported historically, e.g. "500-1000" — kept separate from the exact Headcount figure above' },
    },
    {
      name: 'iatfCertified',
      type: 'checkbox',
      label: 'IATF 16949 certified',
      defaultValue: false,
      admin: { description: 'Plain yes/no flag — not inferred from the Certifications list below' },
    },
    {
      name: 'certifications',
      type: 'array',
      label: 'Certifications',
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Certification (e.g. IATF 16949)' },
        { name: 'year', type: 'number', label: 'Year certified' },
      ],
    },
    {
      name: 'capabilities',
      type: 'text',
      hasMany: true,
      label: 'Capabilities (legacy free text)',
      admin: { description: 'Raw capability tags as originally recorded — see Specialties below for the structured equivalent' },
    },
    {
      name: 'specialties',
      type: 'select',
      hasMany: true,
      label: 'Specialties',
      options: [
        { label: 'Battery assembly',       value: 'battery' },
        { label: 'Precision machining',    value: 'machining' },
        { label: 'Thermal testing',        value: 'thermal' },
        { label: 'ADAS validation',        value: 'adas' },
        { label: 'Software integration',   value: 'software' },
        { label: 'Injection moulding',     value: 'moulding' },
      ],
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'coordinates',
      type: 'group',
      label: 'Map coordinates',
      fields: [
        { name: 'lat', type: 'number', label: 'Latitude' },
        { name: 'lng', type: 'number', label: 'Longitude' },
      ],
    },
  ],
}
