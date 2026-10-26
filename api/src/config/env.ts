import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3002),
  API_BASE_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // ── Supabase Auth ──────────────────────────────────────────────────────────
  SUPABASE_URL: z.string().url(),

  // ── Supabase Storage (S3-compatible protocol; credentials are server-only) ─
  SUPABASE_STORAGE_S3_ENDPOINT: z.string().url(),
  SUPABASE_STORAGE_S3_REGION: z.string().min(1),
  SUPABASE_STORAGE_S3_ACCESS_KEY_ID: z.string().min(1),
  SUPABASE_STORAGE_S3_SECRET_ACCESS_KEY: z.string().min(1),
  SUPABASE_STORAGE_DOCUMENTS_BUCKET: z.string().default('partner-private'),
  STORAGE_SIGNED_URL_EXPIRY: z.coerce.number().int().min(60).max(86400).default(3600),
  // Trust proxy hops only when the API is actually deployed behind a known reverse proxy.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  // Public partner portal URL used in notification emails. Set explicitly in production.
  PORTAL_URL: z.string().url().optional(),

  // LEGACY CLOUDFLARE R2 VARIABLES — intentionally retained as comments only.
  // R2_ENDPOINT: z.string().url(),
  // R2_ACCESS_KEY_ID: z.string().min(1),
  // R2_SECRET_ACCESS_KEY: z.string().min(1),
  // R2_DOCUMENTS_BUCKET: z.string().min(1),
  // R2_PRESIGN_EXPIRY: z.coerce.number().default(3600),

  // ── SMTP2Go (transactional email) ──────────────────────────────────────────
  SMTP_HOST: z.string().default('mail.smtp2go.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  SMTP_FROM: z.string().email().optional(),
  SMTP_FROM_NAME: z.string().default('PrecisionCore Automotive'),

  // ── CORS & Rate limiting ───────────────────────────────────────────────────
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  // Production metrics endpoint is disabled unless a strong scrape token is configured.
  METRICS_BEARER_TOKEN: z.string().min(32).optional(),

  // ── Logging ────────────────────────────────────────────────────────────────
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_DIR: z.string().default('./logs'),
})

const parseEnv = () => {
  const result = schema.safeParse(process.env)

  if (!result.success) {
    console.error('❌ Invalid environment variables:')

    result.error.issues.forEach(issue => {
      console.error(`   ${issue.path.join('.')}: ${issue.message}`)
    })

    process.exit(1)
  }

  const parsedEnv = result.data
  const isProduction = parsedEnv.NODE_ENV === 'production'

  const hasSMTPConfiguration =
    Boolean(parsedEnv.SMTP_USER) &&
    Boolean(parsedEnv.SMTP_PASS) &&
    Boolean(parsedEnv.SMTP_FROM)

  if (isProduction && !hasSMTPConfiguration) {
    console.error('❌ SMTP configuration is required in production')
    process.exit(1)
  }

  if (isProduction && !parsedEnv.PORTAL_URL) {
    console.error('❌ PORTAL_URL is required in production so email links do not point at the API host')
    process.exit(1)
  }

  return parsedEnv
}

export const env = parseEnv()
export type Env = typeof env