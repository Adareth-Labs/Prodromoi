import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Media', plural: 'Media' },
  access: { read: () => true },
  admin: { group: 'Content' },
  upload: {
    // Files are stored in Supabase Storage using its S3-compatible protocol, via
    // the @payloadcms/storage-s3 plugin configured in payload.config.ts.
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card',      width: 768, height: 512, position: 'centre' },
      { name: 'hero',      width: 1920, height: 1080, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    // This collection writes to the public site-media bucket. Keep it image-only;
    // confidential or public-disclosure PDFs must use a separately reviewed workflow.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt text',
      admin: { description: 'Used by screen readers and search engines' },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
    },
  ],
}
