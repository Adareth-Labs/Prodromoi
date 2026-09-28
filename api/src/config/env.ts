import { z } from 'zod'

const schema = z.object({
  NODE_ENV:     z.enum(['development', 'test', 'production']).default('development'),
  PORT:         z.coerce.number().default(3001),
  API_BASE_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL:    z.string().default('redis://localhost:6379'),

  // ── Supabase Auth ──────────────────────────────────────────────────────────
  SUPABASE_URL:              z.string().url(),
  SUPABASE_ANON_KEY:         z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // ── Cloudflare R2 ─────────────────────────────────────────
  R2_ENDPOINT:           z.string().url(),  // https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  R2_ACCESS_KEY_ID:     z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_DOCUMENTS_BUCKET:   z.string().min(1),
  R2_PRESIGN_EXPIRY:     z.coerce.number().default(3600),

  // ── SMTP2Go (transactional email) ──────────────────────────────────────────
  // Free tier: 1,000 emails/month — smtp2go.com
  // Dashboard → Senders → SMTP Users → your credentials
  SMTP_HOST:      z.string().default('mail.smtp2go.com'),
  SMTP_PORT:      z.coerce.number().default(587),
  SMTP_USER:      z.string().min(1),
  SMTP_PASS:      z.string().min(1),
  SMTP_FROM:      z.string().email(),
  SMTP_FROM_NAME: z.string().default('PrecisionCore Automotive'),


  // ── CORS & Rate limiting ───────────────────────────────────────────────────
  ALLOWED_ORIGINS:      z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX:       z.coerce.number().default(100),

  // ── Logging ────────────────────────────────────────────────────────────────
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_DIR:   z.string().default('./logs'),
})

function parseEnv() {
  const result = schema.safeParse(process.env)
  if (!result.success) {
    console.error('❌  Invalid environment variables:')
    result.error.issues.forEach(i => console.error(`   ${i.path.join('.')}: ${i.message}`))
    process.exit(1)
  }
  return result.data
}

export const env = parseEnv()
export type Env = typeof env
