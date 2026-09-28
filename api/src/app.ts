import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import morgan from 'morgan'
import { env } from '@/config/env'
import { logger } from '@/config/logger'
import { globalLimiter } from '@/middleware/rateLimit'
import { errorHandler, notFoundHandler } from '@/middleware/error'
import { metricsMiddleware, metricsEndpoint } from '@/middleware/metrics'
import healthRouter    from '@/routes/health'
import rfqRouter       from '@/routes/rfq'
import ppapRouter      from '@/routes/ppap'
import qualityRouter   from '@/routes/quality'
import suppliersRouter from '@/routes/suppliers'
import documentsRouter from '@/routes/documents'
import publicRouter    from '@/routes/public'

export function createApp() {
  const app = express()

  // ── Security headers ─────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'none'"],
        objectSrc:  ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }))

  // ── Prometheus scrape endpoint — must be BEFORE auth ─────────────────────
  // Block at Cloudflare/proxy so only internal Prometheus can reach this.
  app.get('/metrics', metricsEndpoint)

  // ── CORS ──────────────────────────────────────────────────────────────────
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  app.use(cors({
    origin:         allowedOrigins,
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Source'],
    credentials:    true,
  }))

  // ── Compression, parsing, logging ─────────────────────────────────────────
  app.use(compression())
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }))

  // ── Request instrumentation (Prometheus) ──────────────────────────────────
  app.use(metricsMiddleware)

  // ── Rate limiting ─────────────────────────────────────────────────────────
  app.use(globalLimiter)

  // Trust proxy for correct IP behind load balancer / Cloudflare
  app.set('trust proxy', 1)

  // ── Routes ────────────────────────────────────────────────────────────────
  app.use('/',             healthRouter)
  app.use('/v1/public',   publicRouter)
  app.use('/v1/rfq',       rfqRouter)
  app.use('/v1/ppap',      ppapRouter)
  app.use('/v1/quality',   qualityRouter)
  app.use('/v1/suppliers', suppliersRouter)
  app.use('/v1/documents', documentsRouter)

  // ── Error handling ────────────────────────────────────────────────────────
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
