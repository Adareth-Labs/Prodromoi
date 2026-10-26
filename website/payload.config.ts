import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import nodemailer from 'nodemailer'
import { en } from '@payloadcms/translations/languages/en'

import { Solutions }     from './src/collections/Solutions'
import { Articles }      from './src/collections/Articles'
import { News }          from './src/collections/News'
import { Leadership }    from './src/collections/Leadership'
import { Facilities }    from './src/collections/Facilities'
import { Media }         from './src/collections/Media'
import { BoardMembers }  from './src/collections/BoardMembers'
import { SiteMetrics }   from './src/globals/SiteMetrics'

export default buildConfig({
  // ── Admin panel ─────────────────────────────────────────────────────────────
  admin: {
    user:         'users',
    meta: {
      titleSuffix: '— PrecisionCore CMS',
      icons:       [{ rel: 'icon', type: 'image/x-icon', url: '/favicon.ico' }],
    },
  },

  // ── Collections ─────────────────────────────────────────────────────────────
  collections: [
    Solutions,
    Articles,
    News,
    Leadership,
    Facilities,
    BoardMembers,
    Media,
    // Built-in users collection for admin access
    {
      slug: 'users',
      auth: true,
      admin: { group: 'Admin', useAsTitle: 'email' },
      fields: [
        { name: 'name',       type: 'text' },
        { name: 'department', type: 'text' },
      ],
    },
  ],

  // ── Globals ─────────────────────────────────────────────────────────────────
  globals: [
    SiteMetrics,
  ],

  // ── Editor ──────────────────────────────────────────────────────────────────
  editor: lexicalEditor({}),

  // ── Database — Supabase PostgreSQL ──────────────────────────────────────────
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL! },
  }),

  // ── File storage — Supabase Storage via its S3-compatible endpoint ─────────
  plugins: [
    s3Storage({
      collections: {
        media: {
          prefix: 'cms-media',
          generateFileURL: ({ filename, prefix }) =>
            `${process.env.SUPABASE_STORAGE_PUBLIC_URL}/${process.env.SUPABASE_STORAGE_CMS_BUCKET ?? 'site-media'}/${prefix}/${filename}`,
        },
      },
      bucket: process.env.SUPABASE_STORAGE_CMS_BUCKET ?? 'site-media',
      config: {
        region: process.env.SUPABASE_STORAGE_S3_REGION!,
        endpoint: process.env.SUPABASE_STORAGE_S3_ENDPOINT!,
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.SUPABASE_STORAGE_S3_ACCESS_KEY_ID!,
          secretAccessKey: process.env.SUPABASE_STORAGE_S3_SECRET_ACCESS_KEY!,
        },
      },
    }),
  ],

  /*
   * LEGACY CLOUDFLARE R2 PAYLOAD STORAGE CONFIG — intentionally commented out.
   * It is not active; the S3-compatible adapter above connects to Supabase Storage.
   *
   * s3Storage({
   *   collections: {
   *     media: {
   *       prefix: 'cms-media',
   *       generateFileURL: ({ filename, prefix }) => `${process.env.R2_PUBLIC_URL}/${prefix}/${filename}`,
   *     },
   *   },
   *   bucket: process.env.R2_CMS_BUCKET!,
   *   config: {
   *     region: 'auto',
   *     endpoint: process.env.R2_ENDPOINT!,
   *     credentials: {
   *       accessKeyId: process.env.R2_ACCESS_KEY_ID!,
   *       secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
   *     },
   *   },
   * })
   */

  // ── Email — SMTP2Go ─────────────────────────────────────────────────────────
  email: nodemailerAdapter({
    defaultFromAddress: process.env.SMTP_FROM ?? 'cms@precisioncore.com',
    defaultFromName:    'PrecisionCore CMS',
    transport: nodemailer.createTransport({
      host:   process.env.SMTP_HOST ?? 'mail.smtp2go.com',
      port:   Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    }),
  }),

  // ── i18n ────────────────────────────────────────────────────────────────────
  i18n: { supportedLanguages: { en } },

  // ── TypeScript ──────────────────────────────────────────────────────────────
  typescript: { outputFile: 'src/payload-types.ts' },

  // ── GraphQL (disabled — REST only) ──────────────────────────────────────────
  graphQL: { disable: true },

  secret:   process.env.PAYLOAD_SECRET!,
  serverURL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001',
})

