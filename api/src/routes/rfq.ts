import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { rfqLimiter, downloadLimiter } from '@/middleware/rateLimit'
import { asyncHandler } from '@/utils/asyncHandler'
import { rfqService } from '@/services/rfq/RFQService'
import { auditService } from '@/services/audit/AuditService'
import { documentService } from '@/services/document/DocumentService'
import { db } from '@/config/database'
import { env } from '@/config/env'
import { SUPPLIER_RFQ_TRANSITION_EVENTS } from '@/types'
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
  annualVolume:   z.number().int().positive().optional(),
  minLotSize:     z.number().int().positive().optional(),
  peakWeekly:     z.number().int().positive().optional(),
  sopTargetDate:  z.string().datetime().optional(),
  protoDate:      z.string().datetime().optional(),
})

const transitionSchema = z.object({
  event:  z.enum(['SUBMIT','START_REVIEW','REQUEST_CLARIFICATION','APPROVE','REJECT','MARK_IN_PRODUCTION','CANCEL']),
  reason: z.string().max(5000).optional(),
})

const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024
const RFQ_EXTENSIONS = new Set(['.pdf', '.dxf', '.step', '.stp', '.iges', '.igs'])
const RFQ_CONTENT_TYPES = new Set([
  'application/pdf', 'application/dxf', 'image/vnd.dxf',
  'application/step', 'model/step', 'application/iges', 'model/iges',
  'application/octet-stream',
])
const fileMetadataSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(120),
  sizeBytes: z.number().int().positive().max(MAX_DOCUMENT_BYTES, 'File exceeds the 25 MB storage limit'),
})
const validateRFQFile = (file: { fileName: string; contentType: string }, ctx: z.RefinementCtx) => {
  const extension = file.fileName.toLowerCase().match(/\.[^.]+$/)?.[0] ?? ''
  if (!RFQ_EXTENSIONS.has(extension)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fileName'], message: 'Only PDF, DXF, STEP and IGES files are allowed.' })
  }
  if (!RFQ_CONTENT_TYPES.has(file.contentType.toLowerCase())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contentType'], message: 'Unsupported document type.' })
  }
}
const uploadSchema = fileMetadataSchema.superRefine(validateRFQFile)
const completeUploadSchema = fileMetadataSchema.extend({ key: z.string().min(1).max(1024) }).superRefine(validateRFQFile)

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

// PATCH /rfq/:id — update a supplier-owned draft before it is submitted.
router.patch('/:id', authenticate, requirePermission('rfq:create'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const body = createSchema.parse(req.body)
  const rfq = await db.rFQ.findFirst({ where: { id: req.params.id, supplierId: req.auth.supplierId } })
  if (!rfq) {
    res.status(404).json({ success: false, error: 'RFQ not found' })
    return
  }
  if (rfq.status !== 'DRAFT') {
    res.status(409).json({ success: false, error: 'Only draft RFQs can be edited.' })
    return
  }
  const partFamily = body.partFamily ?? body.partName ?? body.partNumber ?? body.sku
  if (!partFamily) {
    res.status(400).json({ success: false, error: 'partName, partNumber, sku, or partFamily is required' })
    return
  }
  const updated = await db.rFQ.updateMany({
    where: { id: rfq.id, supplierId: req.auth.supplierId, status: 'DRAFT' },
    data: {
      productSlug: body.productSlug ?? null,
      partFamily,
      partNumber: body.partNumber ?? null,
      partName: body.partName ?? partFamily,
      sku: body.sku ?? body.partNumber ?? null,
      targetPrice: body.targetPrice ?? null,
      material: body.material ?? null,
      toleranceClass: body.toleranceClass ?? null,
      drawingRef: body.drawingRef ?? null,
      requiredBy: body.requiredBy ? new Date(body.requiredBy) : null,
      notes: body.notes ?? null,
      annualVolume: body.annualVolume ?? null,
      minLotSize: body.minLotSize ?? null,
      peakWeekly: body.peakWeekly ?? null,
      sopTargetDate: body.sopTargetDate ? new Date(body.sopTargetDate) : null,
      protoTargetDate: body.protoDate ? new Date(body.protoDate) : null,
    },
  })
  if (updated.count !== 1) {
    res.status(409).json({ success: false, error: 'RFQ draft changed concurrently; reload and retry.' })
    return
  }
  await auditService.log({
    action: 'UPDATE', actorId: req.auth.sub, actorEmail: req.auth.email, actorTier: req.auth.tier,
    resourceType: 'RFQ', resourceId: rfq.id, supplierId: req.auth.supplierId, rfqId: rfq.id,
    beforeState: { status: rfq.status, updatedAt: rfq.updatedAt.toISOString() },
    afterState: { status: 'DRAFT', fieldsUpdated: Object.keys(body) },
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
  })
  res.json({ success: true, data: await db.rFQ.findUniqueOrThrow({ where: { id: rfq.id } }) })
}))

// GET /rfq/:id — get single RFQ
router.get('/:id', authenticate, requirePermission('rfq:read'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const identifier = req.params.id
  if (!identifier || identifier.length > 100) {
    res.status(404).json({ success: false, error: 'RFQ not found' })
    return
  }
  // Portal list links use the database ID; notification emails use the public
  // tracking reference. Support both while always scoping the query by supplier.
  const rfq = await db.rFQ.findFirst({
    where: {
      supplierId: req.auth.supplierId,
      OR: [{ id: identifier }, { trackingId: identifier }],
    },
    include: { documents: true, transitions: { orderBy: { createdAt: 'asc' } } },
  })
  if (!rfq) {
    res.status(404).json({ success: false, error: 'RFQ not found' })
    return
  }
  res.json({ success: true, data: rfq })
}))

// POST /rfq/:id/transition — state machine transition
router.post('/:id/transition', authenticate, requirePermission('rfq:transition'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { event, reason } = transitionSchema.parse(req.body)
  if (!SUPPLIER_RFQ_TRANSITION_EVENTS.includes(event)) {
    res.status(403).json({ success: false, error: 'This transition is reserved for internal RFQ reviewers.' })
    return
  }
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

// POST /rfq/:id/documents/upload-url — get pre-signed Supabase Storage upload URL (S3-compatible protocol)
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
  const uploadUrl = await documentService.getUploadUrl({ key, contentType, sizeBytes })

  // Do not create a document row until the browser confirms the PUT and the
  // server verifies the stored object's size and Content-Type.
  res.json({ success: true, data: { uploadUrl, key, fileName, contentType, sizeBytes, expiresIn: 300 } })
}))

// POST /rfq/:id/documents/complete — finalize only after verifying the private object exists.
router.post('/:id/documents/complete', authenticate, requirePermission('rfq:create'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const rfq = await db.rFQ.findFirst({ where: { id: req.params.id, supplierId: req.auth.supplierId } })
  if (!rfq) {
    res.status(404).json({ success: false, error: 'RFQ not found' })
    return
  }

  const body = completeUploadSchema.parse(req.body)
  const expectedPrefix = `rfq/${req.auth.supplierId}/${rfq.id}/`
  if (!body.key.startsWith(expectedPrefix)) {
    res.status(400).json({ success: false, error: 'Invalid document upload reference.' })
    return
  }

  let metadata: { sizeBytes: number; contentType?: string }
  try {
    metadata = await documentService.getObjectMetadata(body.key)
  } catch {
    res.status(400).json({ success: false, error: 'The uploaded document could not be verified.' })
    return
  }
  if (metadata.sizeBytes !== body.sizeBytes || metadata.sizeBytes > MAX_DOCUMENT_BYTES ||
      !metadata.contentType || metadata.contentType.toLowerCase() !== body.contentType.toLowerCase()) {
    res.status(400).json({ success: false, error: 'The uploaded document metadata does not match. Please upload it again.' })
    return
  }

  const existing = await db.rFQDocument.findFirst({ where: { rfqId: rfq.id, s3Key: body.key } })
  if (existing) {
    res.json({ success: true, data: existing })
    return
  }
  const document = await db.rFQDocument.create({
    data: { rfqId: rfq.id, s3Key: body.key, fileName: body.fileName, contentType: body.contentType, sizeBytes: body.sizeBytes, uploadedBy: req.auth.sub },
  })
  res.status(201).json({ success: true, data: document })
}))

// GET /rfq/:id/documents/:docId/download — get pre-signed download URL
router.get('/:id/documents/:docId/download', authenticate, requirePermission('rfq:read'), downloadLimiter, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
  res.json({ success: true, data: { downloadUrl, expiresIn: env.STORAGE_SIGNED_URL_EXPIRY } })
}))

export default router
