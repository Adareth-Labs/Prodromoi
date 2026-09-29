import { buildConfig } from 'payload'
import type { CollectionConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import nodemailer from 'nodemailer'
import { en } from '@payloadcms/translations/languages/en'

import { Solutions } from './src/collections/Solutions'
import { Articles } from './src/collections/Articles'
import { News } from './src/collections/News'
import { Leadership } from './src/collections/Leadership'
import { Facilities } from './src/collections/Facilities'
import { Media } from './src/collections/Media'
import { BoardMembers } from './src/collections/BoardMembers'
import { SiteMetrics } from './src/globals/SiteMetrics'

type MediaUrlParams = { filename: string; prefix?: string }

const CMS_NAME = 'PrecisionCore CMS'
const PAYLOAD_DB_SCHEMA = 'payload'
const MEDIA_PREFIX = 'cms-media'
const DEFAULT_SERVER_URL = 'http://localhost:3000'
const DEFAULT_FROM_ADDRESS = 'cms@precisioncore.com'
const DEFAULT_SMTP_HOST = 'mail.smtp2go.com'
const DEFAULT_SMTP_PORT = 587
const SMTP_SECURE_PORT = 465

const DATABASE_URL = process.env.DATABASE_URL!
const PAYLOAD_SECRET = process.env.PAYLOAD_SECRET!
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL
const R2_CMS_BUCKET = process.env.R2_CMS_BUCKET!
const R2_ENDPOINT = process.env.R2_ENDPOINT!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const SMTP_USER = process.env.SMTP_USER!
const SMTP_PASS = process.env.SMTP_PASS!

const SMTP_PORT = Number(process.env.SMTP_PORT ?? DEFAULT_SMTP_PORT)
const IS_SMTP_SECURE = SMTP_PORT === SMTP_SECURE_PORT

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: { group: 'Admin', useAsTitle: 'email' },
  fields: [
    { name: 'name', type: 'text' },
    { name: 'department', type: 'text' },
  ],
}

const buildMediaUrl = ({ filename, prefix }: MediaUrlParams) =>
  `${R2_PUBLIC_URL}/${prefix}/${filename}`


const database = postgresAdapter({
  pool: { connectionString: DATABASE_URL },
  schemaName: PAYLOAD_DB_SCHEMA,
})

const mediaStorage = s3Storage({
  collections: {
    media: { prefix: MEDIA_PREFIX, generateFileURL: buildMediaUrl },
  },
  bucket: R2_CMS_BUCKET,
  config: {
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  },
})

const email = nodemailerAdapter({
  defaultFromAddress: process.env.SMTP_FROM ?? DEFAULT_FROM_ADDRESS,
  defaultFromName: CMS_NAME,
  transport: nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? DEFAULT_SMTP_HOST,
    port: SMTP_PORT,
    secure: IS_SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  }),
})

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: `— ${CMS_NAME}`,
      icons: [{ rel: 'icon', type: 'image/x-icon', url: '/favicon.ico' }],
    },
  },
  collections: [
    Solutions,
    Articles,
    News,
    Leadership,
    Facilities,
    BoardMembers,
    Media,
    Users,
  ],
  globals: [SiteMetrics],
  editor: lexicalEditor({}),
  db: database,
  plugins: [mediaStorage],
  email,
  i18n: { supportedLanguages: { en } },
  typescript: { outputFile: 'src/payload-types.ts' },
  graphQL: { disable: true },
  secret: PAYLOAD_SECRET,
  serverURL: process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SERVER_URL,
})