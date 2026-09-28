import { Router } from 'express'
import { authenticate } from '@/middleware/auth'
import { requireTier } from '@/middleware/rbac'
import { asyncHandler } from '@/utils/asyncHandler'
import { db } from '@/config/database'
import type { AuthenticatedRequest } from '@/types'
import type { Response } from 'express'

const router = Router()

// GET /suppliers/me — authenticated supplier's own profile
router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const supplier = await db.supplier.findUnique({
    where:   { id: req.auth.supplierId },
    include: { scorecard: true },
  })
  if (!supplier) { res.status(404).json({ success: false, error: 'Supplier not found' }); return }
  res.json({ success: true, data: supplier })
}))

// GET /suppliers/me/scorecard
router.get('/me/scorecard', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const scorecard = await db.supplierScorecard.findUnique({ where: { supplierId: req.auth.supplierId } })
  if (!scorecard) { res.status(404).json({ success: false, error: 'Scorecard not found' }); return }
  res.json({ success: true, data: scorecard })
}))

// GET /suppliers/me/audit-log — QUALIFIED+ only
router.get('/me/audit-log', authenticate, requireTier('QUALIFIED'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const logs = await db.auditLog.findMany({
    where:   { supplierId: req.auth.supplierId },
    orderBy: { createdAt: 'desc' },
    take:    100,
  })
  res.json({ success: true, data: logs })
}))

export default router
