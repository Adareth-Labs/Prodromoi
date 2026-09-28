import { Router } from 'express'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { asyncHandler } from '@/utils/asyncHandler'
import { publicRfqLimiter } from '@/middleware/rateLimit'
import { db } from '@/config/database'

const router = Router()

const publicRfqSchema = z.object({
  productSlug: z.string().max(200).optional(),
  sku: z.string().max(200).optional(),
  annualVolume: z.number().int().positive().optional(),
  sopDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid date').optional(),
  contactEmail: z.string().email().optional(),
  step: z.number().int().min(1).max(3),
})

function generateTrackingId(): string {
  return `LEAD-${randomBytes(5).toString('hex').toUpperCase()}`
}

// POST /v1/public/rfq — public website RFQ lead intake.
router.post('/rfq', publicRfqLimiter, asyncHandler(async (req, res) => {
  const body = publicRfqSchema.safeParse(req.body)
  if (!body.success) {
    res.status(400).json({ success: false, error: 'Invalid payload', details: body.error.flatten() })
    return
  }
  const data = body.data
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
    },
  })

  res.status(201).json({ success: true, data: { trackingId } })
}))

export default router
