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

  // Trust only explicitly configured proxy hops before rate-limiters or logs
  // inspect req.ip. Keep 0 unless the deployment topology is known.
  app.set('trust proxy', env.TRUST_PROXY_HOPS)

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
  // Keep the scrape endpoint private. Production deployments must configure a strong
  // token; local development can scrape localhost without one.
  app.get('/metrics', (req, res) => {
    if (env.NODE_ENV === 'production' && !env.METRICS_BEARER_TOKEN) return res.sendStatus(404)
    if (env.METRICS_BEARER_TOKEN && req.get('authorization') !== `Bearer ${env.METRICS_BEARER_TOKEN}`) {
      return res.sendStatus(401)
    }
    return metricsEndpoint(req, res)
  })

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
