import type { Response, NextFunction } from 'express'
import type { AuditAction } from '@/types'
import type { AuthenticatedRequest } from '@/types'
import { auditService } from '@/services/audit/AuditService'
import { logger } from '@/config/logger'

const METHOD_TO_ACTION: Partial<Record<string, AuditAction>> = {
  POST:   'CREATE',
  PUT:    'UPDATE',
  PATCH:  'UPDATE',
  DELETE: 'DELETE',
}

// Attach audit logging to mutating routes automatically
export function auditMiddleware(resourceType: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res)
    res.json = (body: unknown) => {
      // Only log successful mutations
      const action = METHOD_TO_ACTION[req.method]
      if (res.statusCode < 400 && action) {
        const data = body as Record<string, unknown>
        auditService.log({
          action,
          actorId:      req.auth?.sub ?? 'anonymous',
          actorEmail:   req.auth?.email ?? '',
          actorTier:    req.auth?.tier,
          ipAddress:    req.ip,
          userAgent:    req.headers['user-agent'],
          resourceType,
          resourceId:   (data?.data as Record<string,unknown>)?.id as string | undefined,
          supplierId:   req.auth?.supplierId,
          metadata:     { method: req.method, path: req.path, statusCode: res.statusCode },
          // auditService.log() already catches and logs its own failures
          // internally so it never rejects — this .catch is a deliberate
          // belt-and-braces guard, not a silent swallow, in case that
          // contract ever changes.
        }).catch((err: unknown) => {
          logger.error('Unexpected audit middleware failure', { error: String(err), path: req.path })
        })
      }
      return originalJson(body)
    }
    next()
  }
}