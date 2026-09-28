import type { Request, Response, NextFunction } from 'express'
import { register, httpRequestsTotal, httpRequestDurationMs } from '@/config/metrics'
import { logger } from '@/config/logger'

/**
 * Instrument every request with Prometheus counters + histogram.
 * Mount BEFORE route handlers: app.use(metricsMiddleware)
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now()

  res.on('finish', () => {
    // Normalise dynamic path segments to prevent label cardinality explosion
    const route = (req.route?.path ?? req.path)
      .replace(/\/[0-9a-f-]{8,}/gi, '/:id')  // UUIDs
      .replace(/\/\d+/g, '/:id')             // numeric IDs

    const labels = { method: req.method, route, status_code: String(res.statusCode) }
    httpRequestsTotal.inc(labels)
    httpRequestDurationMs.observe(labels, Date.now() - start)
  })

  next()
}

/**
 * Prometheus scrape endpoint.
 * Mount BEFORE auth middleware so Prometheus can reach it without a JWT:
 *   app.get('/metrics', metricsEndpoint)
 *
 * Block this path at Cloudflare / your reverse proxy so it is never
 * reachable from the public internet — only from inside your VPC/network.
 */
export async function metricsEndpoint(_req: Request, res: Response): Promise<void> {
  try {
    res.set('Content-Type', register.contentType)
    res.send(await register.metrics())
  } catch (err) {
    logger.error('Failed to serialize Prometheus metrics', { error: String(err) })
    res.status(500).end()
  }
}
