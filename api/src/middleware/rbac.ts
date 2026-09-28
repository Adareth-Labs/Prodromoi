import type { Response, NextFunction } from 'express'
import type { PortalTier } from '@/types'
import type { AuthenticatedRequest } from '@/types'
import { TIER_PERMISSIONS } from '@/types'
import { auditService } from '@/services/audit/AuditService'

const TIER_RANK: Record<PortalTier, number> = { BASIC: 1, QUALIFIED: 2, STRATEGIC: 3 }

interface DenyAccessInput {
  req:          AuthenticatedRequest
  res:          Response
  resourceType: string
  resourceId:   string
  message:      string
  metadata?:    Record<string, unknown>
}

// Shared by `requireTier` and `requirePermission` below — both need to log
// the denial for audit purposes and return the same 403 shape; they only
// differ in what triggered the denial.
function denyAccess({ req, res, resourceType, resourceId, message, metadata }: DenyAccessInput): void {
  auditService.log({
    action:       'ACCESS_DENIED',
    actorId:      req.auth.sub,
    actorEmail:   req.auth.email,
    actorTier:    req.auth.tier,
    ipAddress:    req.ip,
    userAgent:    req.headers['user-agent'],
    resourceType,
    resourceId,
    metadata,
  })

  res.status(403).json({ success: false, error: message })
}

// Require a minimum tier level
export const requireTier = (minTier: PortalTier) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (TIER_RANK[req.auth.tier] >= TIER_RANK[minTier]) { next(); return }

    denyAccess({
      req, res,
      resourceType: 'Route',
      resourceId:   req.path,
      message:      `This resource requires ${minTier} access. Your current tier is ${req.auth.tier}.`,
      metadata:     { requiredTier: minTier, userTier: req.auth.tier },
    })
  }

// Require a specific permission from the permission matrix
export const requirePermission = (permission: string) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const allowed = TIER_PERMISSIONS[permission] ?? []
    if (allowed.includes(req.auth.tier)) { next(); return }

    denyAccess({
      req, res,
      resourceType: 'Permission',
      resourceId:   permission,
      message:      `Permission '${permission}' is not available for tier ${req.auth.tier}.`,
    })
  }

// Ensure the request actor belongs to the supplier they are accessing
export const requireSameSupplier = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const paramSupplierId = req.params.supplierId
  if (!paramSupplierId || paramSupplierId === req.auth.supplierId) { next(); return }
  res.status(403).json({ success: false, error: 'Access denied to this supplier.' })
}
