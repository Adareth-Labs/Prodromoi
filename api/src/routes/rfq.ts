import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { rfqLimiter } from '@/middleware/rateLimit'
import { asyncHandler } from '@/utils/asyncHandler'
import { rfqService } from '@/services/rfq/RFQService'
import { documentService } from '@/services/document/DocumentService'
import { db } from '@/config/database'
import { env } from '@/config/env'
import type { AuthenticatedRequest } from '@/types'
import type { Response } from 'express'

const router = Router()

const createSchema = z.object({
  productSlug:    z.string().optional(),
  partFamily:     z.string().min(1).optional(),
  partNumber:     z.string().min(1).optional(),
  partName:       z.string().min(1).optional(),
  sku:            z.string().optional(),
  targetPrice:    z.number().nonnegative().optional(),
  material:       z.string().optional(),
  toleranceClass: z.string().optional(),
  drawingRef:     z.string().optional(),
  requiredBy:     z.string().datetime().optional(),
  notes:          z.string().max(5000).optional(),
  annualVolume:   z.number().positive().optional(),
  minLotSize:     z.number().positive().optional(),
  peakWeekly:     z.number().positive().optional(),
  sopTargetDate:  z.string().datetime().optional(),
  protoDate:      z.string().datetime().optional(),
})

const transitionSchema = z.object({
  event:  z.enum(['SUBMIT','START_REVIEW','REQUEST_CLARIFICATION','APPROVE','REJECT','MARK_IN_PRODUCTION','CANCEL']),
  reason: z.string().optional(),
})

const uploadSchema = z.object({
  fileName:    z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes:   z.number().positive(),
})

// GET /rfq — list RFQs for authenticated supplier
router.get('/', authenticate, requirePermission('rfq:read'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.query
  const rfqs = await rfqService.listForSupplier(
    req.auth.supplierId,
    status as Parameters<typeof rfqService.listForSupplier>[1]
  )
  res.json({ success: true, data: rfqs })
}))

// POST /rfq — create new RFQ
router.post('/', authenticate, requirePermission('rfq:create'), rfqLimiter, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const body = createSchema.parse(req.body)
  const partFamily = body.partFamily ?? body.partName ?? body.partNumber ?? body.sku
  if (!partFamily) {
    res.status(400).json({ success: false, error: 'partName, partNumber, sku, or partFamily is required' })
    return
  }
  const rfq = await rfqService.create({
    ...body,
    partFamily,
    supplierId: req.auth.supplierId,
    createdBy: req.auth.sub,
  })
  res.status(201).json({ success: true, data: rfq })
}))

// GET /rfq/:id — get single RFQ
router.get('/:id', authenticate, requirePermission('rfq:read'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const rfq = await rfqService.findById(req.params.id)
  if (!rfq || rfq.supplierId !== req.auth.supplierId) {
    res.status(404).json({ success: false, error: 'RFQ not found' })
    return
  }
  res.json({ success: true, data: rfq })
}))

// POST /rfq/:id/transition — state machine transition
router.post('/:id/transition', authenticate, requirePermission('rfq:transition'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { event, reason } = transitionSchema.parse(req.body)
  const rfq = await rfqService.transition({
    rfqId:      req.params.id,
    event,
    actorId:    req.auth.sub,
    actorEmail: req.auth.email,
    supplierId: req.auth.supplierId,
    reason,
  })
  res.json({ success: true, data: rfq })
}))

// POST /rfq/:id/documents/upload-url — get pre-signed S3 upload URL
router.post('/:id/documents/upload-url', authenticate, requirePermission('rfq:create'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Ownership check first — never attach a document to an RFQ the caller
  // doesn't own, even if they supply a valid RFQ id belonging to someone else.
  const rfq = await db.rFQ.findUnique({ where: { id: req.params.id } })
  if (!rfq || rfq.supplierId !== req.auth.supplierId) {
    res.status(404).json({ success: false, error: 'RFQ not found' })
    return
  }

  const { fileName, contentType, sizeBytes } = uploadSchema.parse(req.body)
  const key = documentService.buildKey({
    resourceType: 'rfq', supplierId: req.auth.supplierId, resourceId: req.params.id, fileName,
  })
  const uploadUrl = await documentService.getUploadUrl({ key, contentType })

  // Record the document in the database
  await db.rFQDocument.create({
    data: { rfqId: req.params.id, s3Key: key, fileName, contentType, sizeBytes, uploadedBy: req.auth.sub },
  })

  res.json({ success: true, data: { uploadUrl, key } })
}))

// GET /rfq/:id/documents/:docId/download — get pre-signed download URL
router.get('/:id/documents/:docId/download', authenticate, requirePermission('rfq:read'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const doc = await db.rFQDocument.findUnique({
    where:   { id: req.params.docId },
    include: { rfq: true },
  })

  // Check that the document belongs to the RFQ named in the URL, and that
  // RFQ belongs to the caller's supplier. Either mismatch is reported as a
  // plain 404 so a caller can't distinguish "wrong id" from "someone else's".
  if (!doc || doc.rfqId !== req.params.id || doc.rfq.supplierId !== req.auth.supplierId) {
    res.status(404).json({ success: false, error: 'Document not found' })
    return
  }

  const downloadUrl = await documentService.getDownloadUrl({ key: doc.s3Key })
  await documentService.auditDownload({
    key: doc.s3Key, actorId: req.auth.sub, actorEmail: req.auth.email,
    actorTier: req.auth.tier, supplierId: req.auth.supplierId, ipAddress: req.ip ?? '',
  })

  // Report the URL's actual configured lifetime instead of a hardcoded
  // number, so this can never drift from what getDownloadUrl really signed.
  res.json({ success: true, data: { downloadUrl, expiresIn: env.R2_PRESIGN_EXPIRY } })
}))

export default router
