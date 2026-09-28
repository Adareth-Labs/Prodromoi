import { db } from '@/config/database'
import { logger } from '@/config/logger'
import type { AuditAction, PortalTier } from '@/types'

interface AuditEntry {
  action:       AuditAction
  actorId:      string
  actorEmail:   string
  actorTier?:   PortalTier
  ipAddress?:   string
  userAgent?:   string
  resourceType: string
  resourceId?:  string
  supplierId?:  string
  rfqId?:       string
  ppapId?:      string
  carId?:       string
  beforeState?: unknown
  afterState?:  unknown
  metadata?:    unknown
}

class AuditService {
  async log(entry: AuditEntry): Promise<void> {
    try {
      await db.auditLog.create({
        data: {
          action:       entry.action,
          actorId:      entry.actorId,
          actorEmail:   entry.actorEmail,
          actorTier:    entry.actorTier,
          ipAddress:    entry.ipAddress,
          userAgent:    entry.userAgent?.slice(0, 512),
          resourceType: entry.resourceType,
          resourceId:   entry.resourceId,
          supplierId:   entry.supplierId,
          rfqId:        entry.rfqId,
          ppapId:       entry.ppapId,
          carId:        entry.carId,
          beforeState:  entry.beforeState as never,
          afterState:   entry.afterState as never,
          metadata:     entry.metadata as never,
        },
      })
    } catch (err) {
      // Audit failure must NEVER break the primary operation
      logger.error('Audit log write failed', { error: String(err), entry })
    }
  }

  async getForResource({ resourceType, resourceId, limit = 50 }: {
    resourceType: string
    resourceId:   string
    limit?:       number
  }) {
    return db.auditLog.findMany({
      where:   { resourceType, resourceId },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    })
  }

  async getForSupplier({ supplierId, limit = 100 }: { supplierId: string; limit?: number }) {
    return db.auditLog.findMany({
      where:   { supplierId },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    })
  }
}

export const auditService = new AuditService()