import { Router } from 'express'
import { authenticate } from '@/middleware/auth'
import { requirePermission } from '@/middleware/rbac'
import { asyncHandler } from '@/utils/asyncHandler'
import { documentService } from '@/services/document/DocumentService'
import { downloadLimiter } from '@/middleware/rateLimit'
import { env } from '@/config/env'
import type { AuthenticatedRequest } from '@/types'
import type { Response } from 'express'

const router = Router()

// Static certificate documents — available to all authenticated partners
const CERT_KEYS: Record<string, string> = {
  'iatf-16949': 'certs/global/iatf-16949-2024.pdf',
  'iso-14001':  'certs/global/iso-14001-2024.pdf',
  'iso-45001':  'certs/global/iso-45001-2022.pdf',
}

// Shared by every route below — they only differ in which S3 key to sign.
// (Previously this logic was copy-pasted three times; the varying part is
// now just the key.)
async function respondWithDownload(req: AuthenticatedRequest, res: Response, key: string): Promise<void> {
  const downloadUrl = await documentService.getDownloadUrl({ key })
  await documentService.auditDownload({
    key, actorId: req.auth.sub, actorEmail: req.auth.email,
    actorTier: req.auth.tier, supplierId: req.auth.supplierId, ipAddress: req.ip ?? '',
  })
  // Report the URL's *actual* configured lifetime instead of a hardcoded
  // number, so this can never drift from what getDownloadUrl really signed.
  res.json({ success: true, data: { downloadUrl, key, expiresIn: env.R2_PRESIGN_EXPIRY } })
}

router.get('/certs/:certId', authenticate, requirePermission('document:certs'), downloadLimiter, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const key = CERT_KEYS[req.params.certId]
  if (!key) { res.status(404).json({ success: false, error: 'Certificate not found' }); return }
  await respondWithDownload(req, res, key)
}))

// CAD documents — QUALIFIED+ only
router.get('/cad/:key(*)', authenticate, requirePermission('document:cad'), downloadLimiter, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await respondWithDownload(req, res, `cad/${req.params.key}`)
}))

// Technology roadmap — STRATEGIC only
router.get('/roadmap/:key(*)', authenticate, requirePermission('document:roadmap'), downloadLimiter, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await respondWithDownload(req, res, `roadmap/${req.params.key}`)
}))

export default router
