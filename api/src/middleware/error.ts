import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { logger } from '@/config/logger'
import { HttpError } from '@/utils/httpError'

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ success: false, error: err.message })
    return
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error:   'Validation failed',
      issues:  err.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
    })
    return
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ success: false, error: 'A record with this identifier already exists.' })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Record not found.' })
      return
    }
  }

  const message = err instanceof Error ? err.message : 'Internal server error'
  logger.error('Unhandled error', { error: message, path: req.path, method: req.method })
  res.status(500).json({ success: false, error: message })
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} not found` })
}
