import { Router } from 'express'
import { z } from 'zod'
import { randomBytes, randomUUID } from 'crypto'
import { asyncHandler } from '@/utils/asyncHandler'
import { publicRfqSubmissionLimiter, publicRfqUploadLimiter } from '@/middleware/rateLimit'
import { db } from '@/config/database'
import { documentService } from '@/services/document/DocumentService'

const router = Router()
const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_FILES = 5
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.dxf', '.step', '.stp', '.iges', '.igs'])
const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf', 'application/dxf', 'image/vnd.dxf',
  'application/step', 'model/step', 'application/iges', 'model/iges',
  'application/octet-stream',
])

const uploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE),
}).superRefine((file, ctx) => {
  const extension = file.fileName.toLowerCase().match(/\.[^.]+$/)?.[0] ?? ''
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fileName'], message: 'Only PDF, DXF, STEP and IGES files are allowed.' })
  }
  if (!ALLOWED_CONTENT_TYPES.has(file.contentType.toLowerCase())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['contentType'], message: 'Unsupported document type.' })
  }
})

const attachmentSchema = z.object({
  key: z.string().min(1).max(1024),
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE),
})

const publicRfqSchema = z.object({
  productSlug: z.string().max(200).optional(),
  sku: z.string().max(200).optional(),
  annualVolume: z.number().int().positive().optional(),
  sopDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date').optional(),
  contactEmail: z.string().email().max(320),
  step: z.number().int().min(1).max(3),
  documents: z.array(attachmentSchema).max(MAX_FILES).optional().default([]),
})

function generateTrackingId(): string {
  return `LEAD-${randomBytes(8).toString('hex').toUpperCase()}`
}

// POST /v1/public/rfq/upload-url — rate-limited upload URL for anonymous RFQ documents.
// Uploaded files stay in the private partner-private bucket and are not publicly readable.
router.post('/rfq/upload-url', publicRfqUploadLimiter, asyncHandler(async (req, res) => {
  const file = uploadSchema.parse(req.body)
  const key = documentService.buildKey({
    resourceType: 'public-rfq',
    supplierId: 'anonymous',
    resourceId: randomUUID(),
    fileName: file.fileName,
  })
  const uploadUrl = await documentService.getUploadUrl({ key, contentType: file.contentType, sizeBytes: file.sizeBytes })
  res.status(200).json({ success: true, data: { uploadUrl, key, expiresIn: 300 } })
}))

// POST /v1/public/rfq — public website RFQ lead intake. Documents are only attached
// once their private Storage objects have been verified by the server.
router.post('/rfq', publicRfqSubmissionLimiter, asyncHandler(async (req, res) => {
  const body = publicRfqSchema.safeParse(req.body)
  if (!body.success) {
    res.status(400).json({ success: false, error: 'Invalid payload', details: body.error.flatten() })
    return
  }
  const data = body.data
  const validAttachments: typeof data.documents = []
  for (const attachment of data.documents) {
    if (!attachment.key.startsWith('public-rfq/anonymous/')) {
      res.status(400).json({ success: false, error: 'Invalid document upload reference.' })
      return
    }
    try {
      const metadata = await documentService.getObjectMetadata(attachment.key)
      if (metadata.sizeBytes !== attachment.sizeBytes || metadata.sizeBytes > MAX_FILE_SIZE ||
          !metadata.contentType || metadata.contentType.toLowerCase() !== attachment.contentType.toLowerCase()) {
        res.status(400).json({ success: false, error: 'A document upload could not be verified. Please upload it again.' })
        return
      }
    } catch {
      res.status(400).json({ success: false, error: 'A document upload could not be verified. Please upload it again.' })
      return
    }
    validAttachments.push(attachment)
  }

  const trackingId = generateTrackingId()
  await db.publicRFQLead.create({
    data: {
      trackingId,
      productSlug: data.productSlug,
      sku: data.sku,
      annualVolume: data.annualVolume,
      sopDate: data.sopDate ? new Date(data.sopDate) : undefined,
      contactEmail: data.contactEmail,
      step: data.step,
      documents: validAttachments.length ? {
        create: validAttachments.map((doc) => ({
          storageKey: doc.key,
          fileName: doc.fileName,
          contentType: doc.contentType,
          sizeBytes: doc.sizeBytes,
        })),
      } : undefined,
    },
  })

  res.status(201).json({ success: true, data: { trackingId } })
}))

export default router
