import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { asyncHandler } from '@/utils/asyncHandler'
import { db } from '@/config/database'
import { env } from '@/config/env'
import { documentService } from '@/services/document/DocumentService'
import { emailService } from '@/services/email/EmailService'
import { auditService } from '@/services/audit/AuditService'
import type { AuthenticatedRequest } from '@/types'
import type { Response } from 'express'
import { notFound } from '@/utils/httpError'
import { downloadLimiter } from '@/middleware/rateLimit'

const router = Router()

const createSchema = z.object({
  platformId:  z.string().min(1),
  rfqId:       z.string().uuid().optional(),
  requiredBy:  z.string().datetime().optional(),
})

const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024
const PPAP_EXTENSIONS = new Set(['.pdf', '.xlsx', '.xls', '.csv', '.png', '.jpg', '.jpeg', '.webp'])
const PPAP_CONTENT_TYPES = new Set([
  'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel', 'text/csv', 'application/csv', 'image/png', 'image/jpeg',
  'image/webp', 'application/octet-stream',
])
const baseUploadSchema = z.object({
  documentType: z.string().trim().min(1).max(120),
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(120),
  sizeBytes: z.number().int().positive().max(MAX_DOCUMENT_BYTES, 'File exceeds the 25 MB storage limit'),
  isRequired: z.boolean().default(true),
})
const validatePPAPFile = (file: { fileName: string; contentType: string }, ctx: z.RefinementCtx) => {
  const extension = file.fileName.toLowerCase().match(/\.[^.]+$/)?.[0] ?? ''
  if (!PPAP_EXTENSIONS.has(extension)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fileName'], message: 'Unsupported PPAP document extension.' })
  }
  if (!PPAP_CONTENT_TYPES.has(file.contentType.toLowerCase())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contentType'], message: 'Unsupported PPAP document type.' })
  }
}
const uploadSchema = baseUploadSchema.superRefine(validatePPAPFile)
const completeUploadBaseSchema = baseUploadSchema.extend({
  ppapId: z.string().uuid(),
  key: z.string().min(1).max(1024),
  ppapLevel: z.number().int().min(1).max(5).default(3),
})
const completeUploadSchema = completeUploadBaseSchema.superRefine(validatePPAPFile)
const nestedCompleteUploadSchema = completeUploadBaseSchema.omit({ ppapId: true }).superRefine(validatePPAPFile)

async function finalizePPAPUpload(input: {
  ppapId: string
  key: string
  fileName: string
  contentType: string
  sizeBytes: number
  documentType: string
  ppapLevel?: number
  isRequired: boolean
  req: AuthenticatedRequest
}) {
  const { req } = input
  const ppap = await db.pPAPSubmission.findFirst({
    where: { id: input.ppapId, supplierId: req.auth.supplierId },
    include: { supplier: true },
  })
  if (!ppap) throw notFound('PPAP submission')

  const expectedPrefix = `ppap/${req.auth.supplierId}/${ppap.id}/`
  if (!input.key.startsWith(expectedPrefix)) throw new Error('Invalid document upload reference')

  let metadata: { sizeBytes: number; contentType?: string }
  try {
    metadata = await documentService.getObjectMetadata(input.key)
  } catch {
    throw new Error('Uploaded document could not be verified')
  }
  if (metadata.sizeBytes !== input.sizeBytes || metadata.sizeBytes > MAX_DOCUMENT_BYTES ||
      !metadata.contentType || metadata.contentType.toLowerCase() !== input.contentType.toLowerCase()) {
    throw new Error('Uploaded document metadata does not match')
  }

  const existing = await db.pPAPDocument.findFirst({ where: { ppapId: ppap.id, s3Key: input.key } })
  if (existing) return { document: existing, ppap, alreadyCompleted: true }

  const document = await db.pPAPDocument.create({
    data: {
      ppapId: ppap.id, documentType: input.documentType, s3Key: input.key,
      fileName: input.fileName, sizeBytes: input.sizeBytes, ppapLevel: input.ppapLevel,
      isRequired: input.isRequired, uploadedBy: req.auth.sub,
    },
  })

  await emailService.sendPPAPUploadNotification({
    supplierId: req.auth.supplierId,
    supplierName: ppap.supplier.companyName,
    platformId: ppap.platformId,
    documentType: input.documentType,
    toEmail: req.auth.email,
    reviewerEmail: 'ppap-review@precisioncore.com',
  })
  await auditService.log({
    action: 'CREATE', actorId: req.auth.sub, actorEmail: req.auth.email,
    actorTier: req.auth.tier, resourceType: 'PPAPDocument',
    resourceId: document.id, supplierId: req.auth.supplierId, ppapId: ppap.id,
    ipAddress: req.ip, userAgent: req.headers['user-agent'],
    metadata: { storageProvider: 'supabase', storageKey: input.key, verified: true },
  })
  return { document, ppap, alreadyCompleted: false }
}


// GET /ppap/documents — flattened document list for the portal UI
router.get('/documents', authenticate, requirePermission('ppap:read'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const documents = await db.pPAPDocument.findMany({
    where: { ppap: { supplierId: req.auth.supplierId } },
    include: { ppap: true },
    orderBy: { uploadedAt: 'desc' },
  })
  res.json({ success: true, data: documents })
}))

// POST /ppap/upload-url — request an upload URL; no document row or email is created until completion.
router.post('/upload-url', authenticate, requirePermission('ppap:upload'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const body = baseUploadSchema.extend({
    ppapId: z.string().uuid().optional(),
    ppapLevel: z.number().int().min(1).max(5).default(3),
    platformId: z.string().trim().min(1).max(120).default('Partner Portal'),
  }).superRefine(validatePPAPFile).parse(req.body)

  let ppap = body.ppapId
    ? await db.pPAPSubmission.findFirst({ where: { id: body.ppapId, supplierId: req.auth.supplierId } })
    : await db.pPAPSubmission.findFirst({ where: { supplierId: req.auth.supplierId }, orderBy: { createdAt: 'desc' } })
  if (body.ppapId && !ppap) {
    res.status(404).json({ success: false, error: 'PPAP submission not found' })
    return
  }
  if (!ppap) {
    ppap = await db.pPAPSubmission.create({ data: { supplierId: req.auth.supplierId, platformId: body.platformId } })
  }

  const key = documentService.buildKey({
    resourceType: 'ppap', supplierId: req.auth.supplierId, resourceId: ppap.id, fileName: body.fileName,
  })
  const uploadUrl = await documentService.getUploadUrl({ key, contentType: body.contentType, sizeBytes: body.sizeBytes })
  res.json({
    success: true,
    data: {
      uploadUrl, key, ppapId: ppap.id, documentType: body.documentType,
      fileName: body.fileName, contentType: body.contentType, sizeBytes: body.sizeBytes,
      ppapLevel: body.ppapLevel, isRequired: body.isRequired, expiresIn: 300,
    },
  })
}))

// POST /ppap/upload-complete — verify the stored object before creating a document record or sending emails.
router.post('/upload-complete', authenticate, requirePermission('ppap:upload'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const body = completeUploadSchema.parse(req.body)
  try {
    const result = await finalizePPAPUpload({ ...body, req })
    res.status(result.alreadyCompleted ? 200 : 201).json({ success: true, data: result.document })
  } catch (error) {
    if (error instanceof Error && error.message === 'PPAP submission not found') {
      res.status(404).json({ success: false, error: 'PPAP submission not found' }); return
    }
    if (error instanceof Error && /upload reference|could not be verified|metadata does not match/i.test(error.message)) {
      res.status(400).json({ success: false, error: error.message }); return
    }
    throw error
  }
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

  // RFQ links must be scoped to this supplier to prevent cross-tenant associations.
  if (body.rfqId) {
    const rfq = await db.rFQ.findFirst({
      where: { id: body.rfqId, supplierId: req.auth.supplierId },
      select: { id: true },
    })
    if (!rfq) {
      res.status(400).json({ success: false, error: 'rfqId does not belong to this supplier' })
      return
    }
  }

  const ppap = await db.pPAPSubmission.create({
    data: { supplierId: req.auth.supplierId, ...body, requiredBy: body.requiredBy ? new Date(body.requiredBy) : undefined },
  })
  res.status(201).json({ success: true, data: ppap })
}))


// GET /ppap/:id/documents/:docId/download — return a short-lived URL only after parent ownership checks.
router.get('/:id/documents/:docId/download', authenticate, requirePermission('ppap:read'), downloadLimiter, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const document = await db.pPAPDocument.findUnique({
    where: { id: req.params.docId },
    include: { ppap: true },
  })
  if (!document || document.ppapId !== req.params.id || document.ppap.supplierId !== req.auth.supplierId) {
    res.status(404).json({ success: false, error: 'Document not found' })
    return
  }
  const downloadUrl = await documentService.getDownloadUrl({ key: document.s3Key })
  await documentService.auditDownload({
    key: document.s3Key,
    actorId: req.auth.sub,
    actorEmail: req.auth.email,
    actorTier: req.auth.tier,
    supplierId: req.auth.supplierId,
    ipAddress: req.ip ?? '',
  })
  res.json({ success: true, data: { downloadUrl, expiresIn: env.STORAGE_SIGNED_URL_EXPIRY } })
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
  const ppap = await db.pPAPSubmission.findFirst({ where: { id: req.params.id, supplierId: req.auth.supplierId } })
  if (!ppap) { res.status(404).json({ success: false, error: 'PPAP submission not found' }); return }

  const body = baseUploadSchema.extend({ ppapLevel: z.number().int().min(1).max(5).default(3) }).superRefine(validatePPAPFile).parse(req.body)
  const key = documentService.buildKey({ resourceType: 'ppap', supplierId: req.auth.supplierId, resourceId: ppap.id, fileName: body.fileName })
  const uploadUrl = await documentService.getUploadUrl({ key, contentType: body.contentType, sizeBytes: body.sizeBytes })
  res.json({ success: true, data: { uploadUrl, key, ppapId: ppap.id, ...body, expiresIn: 300 } })
}))

router.post('/:id/documents/complete', authenticate, requirePermission('ppap:upload'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const body = nestedCompleteUploadSchema.parse(req.body)
  try {
    const result = await finalizePPAPUpload({ ...body, ppapId: req.params.id, req })
    res.status(result.alreadyCompleted ? 200 : 201).json({ success: true, data: result.document })
  } catch (error) {
    if (error instanceof Error && error.message === 'PPAP submission not found') {
      res.status(404).json({ success: false, error: 'PPAP submission not found' }); return
    }
    if (error instanceof Error && /upload reference|could not be verified|metadata does not match/i.test(error.message)) {
      res.status(400).json({ success: false, error: error.message }); return
    }
    throw error
  }
}))

export default router