import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { asyncHandler } from '@/utils/asyncHandler'
import { db } from '@/config/database'
import { documentService } from '@/services/document/DocumentService'
import { emailService } from '@/services/email/EmailService'
import { auditService } from '@/services/audit/AuditService'
import type { AuthenticatedRequest } from '@/types'
import type { Response } from 'express'

const router = Router()

const createSchema = z.object({
  platformId:  z.string().min(1),
  rfqId:       z.string().uuid().optional(),
  requiredBy:  z.string().datetime().optional(),
})

const uploadSchema = z.object({
  documentType: z.string().min(1),
  fileName:     z.string().min(1),
  contentType:  z.string().min(1),
  sizeBytes:    z.number().positive(),
  isRequired:   z.boolean().default(true),
})


// GET /ppap/documents — flattened document list for the portal UI
router.get('/documents', authenticate, requirePermission('ppap:read'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const documents = await db.pPAPDocument.findMany({
    where: { ppap: { supplierId: req.auth.supplierId } },
    include: { ppap: true },
    orderBy: { uploadedAt: 'desc' },
  })
  res.json({ success: true, data: documents })
}))

// POST /ppap/upload-url — portal-friendly upload endpoint that creates the
// PPAP submission on demand when the supplier doesn't already have one.
router.post('/upload-url', authenticate, requirePermission('ppap:upload'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const body = uploadSchema.extend({
    ppapId: z.string().uuid().optional(),
    ppapLevel: z.number().int().min(1).max(5).default(3),
    platformId: z.string().min(1).default('Partner Portal'),
  }).parse(req.body)

  let ppap = body.ppapId
    ? await db.pPAPSubmission.findFirst({ where: { id: body.ppapId, supplierId: req.auth.supplierId } })
    : await db.pPAPSubmission.findFirst({ where: { supplierId: req.auth.supplierId }, orderBy: { createdAt: 'desc' } })

  if (!ppap) {
    ppap = await db.pPAPSubmission.create({ data: { supplierId: req.auth.supplierId, platformId: body.platformId } })
  }

  const key = documentService.buildKey({
    resourceType: 'ppap', supplierId: req.auth.supplierId, resourceId: ppap.id, fileName: body.fileName,
  })
  const uploadUrl = await documentService.getUploadUrl({ key, contentType: body.contentType })
  const doc = await db.pPAPDocument.create({
    data: { ppapId: ppap.id, documentType: body.documentType, s3Key: key, fileName: body.fileName, sizeBytes: body.sizeBytes, ppapLevel: body.ppapLevel, isRequired: body.isRequired, uploadedBy: req.auth.sub },
  })

  await auditService.log({
    action: 'CREATE', actorId: req.auth.sub, actorEmail: req.auth.email, actorTier: req.auth.tier,
    resourceType: 'PPAPDocument', resourceId: doc.id, supplierId: req.auth.supplierId, ppapId: ppap.id,
  })

  res.json({ success: true, data: { uploadUrl, key, documentId: doc.id, ppapId: ppap.id } })
}))

router.get('/', authenticate, requirePermission('ppap:read'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ppaps = await db.pPAPSubmission.findMany({
    where:   { supplierId: req.auth.supplierId },
    include: { documents: true },
    orderBy: { createdAt: 'desc' },
  })
  res.json({ success: true, data: ppaps })
}))

router.post('/', authenticate, requirePermission('ppap:upload'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const body = createSchema.parse(req.body)
  const ppap = await db.pPAPSubmission.create({
    data: { supplierId: req.auth.supplierId, ...body, requiredBy: body.requiredBy ? new Date(body.requiredBy) : undefined },
  })
  res.status(201).json({ success: true, data: ppap })
}))

router.get('/:id', authenticate, requirePermission('ppap:read'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const ppap = await db.pPAPSubmission.findUnique({
    where:   { id: req.params.id },
    include: { documents: true },
  })
  if (!ppap || ppap.supplierId !== req.auth.supplierId) {
    res.status(404).json({ success: false, error: 'PPAP submission not found' }); return
  }
  res.json({ success: true, data: ppap })
}))

router.post('/:id/documents/upload-url', authenticate, requirePermission('ppap:upload'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // Ownership check first — never attach a document to a PPAP submission
  // the caller doesn't own.
  const ppap = await db.pPAPSubmission.findUnique({ where: { id: req.params.id }, include: { supplier: true } })
  if (!ppap || ppap.supplierId !== req.auth.supplierId) {
    res.status(404).json({ success: false, error: 'PPAP submission not found' })
    return
  }

  const body = uploadSchema.parse(req.body)
  const key  = documentService.buildKey({
    resourceType: 'ppap', supplierId: req.auth.supplierId, resourceId: req.params.id, fileName: body.fileName,
  })
  const uploadUrl = await documentService.getUploadUrl({ key, contentType: body.contentType })

  const doc = await db.pPAPDocument.create({
    data: { ppapId: req.params.id, documentType: body.documentType, s3Key: key, fileName: body.fileName, sizeBytes: body.sizeBytes, isRequired: body.isRequired, uploadedBy: req.auth.sub },
  })

  await emailService.sendPPAPUploadNotification({
    supplierId:    req.auth.supplierId,
    supplierName:  ppap.supplier.companyName,
    platformId:    ppap.platformId,
    documentType:  body.documentType,
    toEmail:       req.auth.email,
    reviewerEmail: 'ppap-review@precisioncore.com',
  })

  await auditService.log({
    action: 'CREATE', actorId: req.auth.sub, actorEmail: req.auth.email,
    actorTier: req.auth.tier, resourceType: 'PPAPDocument',
    resourceId: doc.id, supplierId: req.auth.supplierId, ppapId: req.params.id,
  })

  res.json({ success: true, data: { uploadUrl, key, documentId: doc.id } })
}))

export default router