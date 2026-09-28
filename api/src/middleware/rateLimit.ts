import rateLimit from 'express-rate-limit'
import { env } from '@/config/env'

const ONE_HOUR_MS = 60 * 60 * 1000

const DOWNLOAD_RATE_LIMIT_MAX = 50   // per hour, per client — prevents bulk scraping
const RFQ_RATE_LIMIT_MAX      = 20   // per hour, per client

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max:      env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: 'Too many requests. Please try again later.' },
})

// Stricter limiter for document downloads (prevent bulk scraping)
export const downloadLimiter = rateLimit({
  windowMs: ONE_HOUR_MS,
  max:      DOWNLOAD_RATE_LIMIT_MAX,
  message: { success: false, error: 'Download limit reached. Please contact support.' },
})

// Stricter limiter for RFQ submissions
export const rfqLimiter = rateLimit({
  windowMs: ONE_HOUR_MS,
  max:      RFQ_RATE_LIMIT_MAX,
  message: { success: false, error: 'RFQ submission limit reached.' },
})

// Public website RFQ intake — intentionally unauthenticated, protected by CORS + strict per-IP limiting.
export const publicRfqLimiter = rateLimit({
  windowMs: ONE_HOUR_MS,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'RFQ submission limit reached.' },
})
