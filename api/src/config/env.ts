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
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),

  // ── Cloudflare R2 ──────────────────────────────────────────────────────────
  R2_ENDPOINT: z.string().url(),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_DOCUMENTS_BUCKET: z.string().min(1),
  R2_PRESIGN_EXPIRY: z.coerce.number().default(3600),

  // ── SMTP2Go (transactional email) ──────────────────────────────────────────
  SMTP_HOST: z.string().default('mail.smtp2go.com'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASS: z.string().min(1).optional(),
  SMTP_FROM: z.string().email().optional(),
  SMTP_FROM_NAME: z.string().default('PrecisionCore Automotive'),

  // ── CORS & Rate limiting ───────────────────────────────────────────────────
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

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

  return parsedEnv
}

export const env = parseEnv()
export type Env = typeof env