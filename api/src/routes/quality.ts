import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '@/middleware/auth'
import { requireInternalQualityReviewer, requirePermission } from '@/middleware/rbac'
import { asyncHandler } from '@/utils/asyncHandler'
import { db } from '@/config/database'
import { emailService } from '@/services/email/EmailService'
import { auditService } from '@/services/audit/AuditService'
import { documentService } from '@/services/document/DocumentService'
import { CAR_EVENT_TO_STATUS, CAR_REVIEWER_DECISION_TO_STATUS, CAR_TRANSITIONS, SUPPLIER_CAR_TRANSITION_EVENTS, type AuthenticatedRequest, type CARReviewerDecision, type CARTransitionEvent } from '@/types'
import type { Response } from 'express'
import { randomBytes } from 'crypto'
import { downloadLimiter } from '@/middleware/rateLimit'

const router = Router()

const createSchema = z.object({
  severity:             z.enum(['MINOR', 'MAJOR', 'CRITICAL']),
  deviationDescription: z.string().min(10).optional(),
  deviation:            z.string().min(10).optional(),
  partId:               z.string().optional(),
  nonConformingPart:    z.string().optional(),
  affectedQty:         z.number().int().positive().optional(),
  detectedBy:           z.string().optional(),
  batchNumber:          z.string().optional(),
  rfqId:                z.string().uuid().optional(),
  lotNumber:            z.string().optional(),
  assignedTo:           z.string().uuid().optional(),
})

const transitionSchema = z.object({
  event:            z.enum(['IDENTIFY_ROOT_CAUSE', 'SUBMIT_ACTION_PLAN', 'REQUEST_VERIFICATION', 'CLOSE', 'ESCALATE']),
  rootCause:        z.string().trim().max(5000).optional(),
  correctiveAction: z.string().trim().max(5000).optional(),
  preventiveAction: z.string().trim().max(5000).optional(),
  actionDueDate:    z.string().datetime().optional(),
  why1:             z.string().trim().max(5000).optional(),
  closureNotes:    z.string().trim().max(5000).optional(),
  currentStep:      z.number().int().min(1).max(3).optional(),
}).superRefine((body, ctx) => {
  if (body.event === 'IDENTIFY_ROOT_CAUSE') {
    if (!body.why1 || body.why1.length < 10) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['why1'], message: 'Describe the initial observation in at least 10 characters.' })
    if (!body.rootCause || body.rootCause.length < 10) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['rootCause'], message: 'Enter the verified root cause in at least 10 characters.' })
  }
  if ((body.event === 'SUBMIT_ACTION_PLAN' || body.event === 'REQUEST_VERIFICATION') && (!body.correctiveAction || body.correctiveAction.length < 10)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['correctiveAction'], message: 'Describe the corrective action in at least 10 characters.' })
  }
})


function generateCARId(): string {
  const year = new Date().getFullYear()
  const token = randomBytes(8).toString('hex').toUpperCase()

  return `CAR-${year}-${token}`
}

const reviewerDecisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REQUEST_CHANGES']),
  notes: z.string().trim().min(10, 'Provide at least 10 characters of reviewer notes.').max(5000),
})

// ── Internal quality reviewer workflow ──────────────────────────────────────
// Internal access comes only from the server-managed InternalReviewer table.
// These routes are registered before the generic /:id route below.
router.get('/reviewer/me', authenticate, requireInternalQualityReviewer, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: {
    sub: req.auth.sub,
    email: req.auth.email,
    name: req.auth.name,
    role: req.auth.internalRole,
  } })
}))

router.get('/reviewer/queue', authenticate, requireInternalQualityReviewer, asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const cars = await db.cARReport.findMany({
    where: { status: 'VERIFICATION_PENDING' },
    include: {
      supplier: { select: { id: true, vendorId: true, companyName: true, contactEmail: true } },
      documents: { select: { id: true, fileName: true, sizeBytes: true, uploadedAt: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
  })
  const severityRank: Record<string, number> = { CRITICAL: 0, MAJOR: 1, MINOR: 2 }
  cars.sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || a.createdAt.getTime() - b.createdAt.getTime())
  res.json({ success: true, data: cars })
}))

router.get('/reviewer/cars/:id', authenticate, requireInternalQualityReviewer, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const car = await db.cARReport.findUnique({
    where: { id: req.params.id },
    include: {
      supplier: { select: { id: true, vendorId: true, companyName: true, contactEmail: true } },
      documents: { select: { id: true, fileName: true, sizeBytes: true, uploadedAt: true } },
    },
  })
  if (!car) { res.status(404).json({ success: false, error: 'CAR not found' }); return }
  res.json({ success: true, data: car })
}))

router.get('/reviewer/cars/:id/documents/:documentId/download', authenticate, requireInternalQualityReviewer, downloadLimiter, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const document = await db.cARDocument.findFirst({
    where: { id: req.params.documentId, carId: req.params.id },
    include: { car: { select: { id: true, carId: true, supplierId: true } } },
  })
  if (!document) { res.status(404).json({ success: false, error: 'CAR document not found' }); return }
  const downloadUrl = await documentService.getDownloadUrl({ key: document.s3Key })
  await documentService.auditDownload({
    key: document.s3Key,
    actorId: req.auth.sub,
    actorEmail: req.auth.email,
    actorTier: req.auth.tier,
    supplierId: document.car.supplierId,
    ipAddress: req.ip ?? '',
  })
  res.json({ success: true, data: { downloadUrl, fileName: document.fileName } })
}))

router.post('/reviewer/cars/:id/decision', authenticate, requireInternalQualityReviewer, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const body = reviewerDecisionSchema.parse(req.body)
  const before = await db.cARReport.findUnique({ where: { id: req.params.id } })
  if (!before) { res.status(404).json({ success: false, error: 'CAR not found' }); return }
  if (before.status !== 'VERIFICATION_PENDING') {
    res.status(409).json({ success: false, error: 'Only CARs awaiting verification can receive a reviewer decision.' })
    return
  }

  const now = new Date()
  const approving = body.decision === 'APPROVE'
  if (approving && (
    !before.why1 || before.why1.trim().length < 10 ||
    !before.rootCause || before.rootCause.trim().length < 10 ||
    !before.correctiveAction || before.correctiveAction.trim().length < 10
  )) {
    res.status(409).json({ success: false, error: 'This CAR is missing required root-cause or corrective-action evidence and cannot be approved yet.' })
    return
  }
  const nextStatus = CAR_REVIEWER_DECISION_TO_STATUS[body.decision as CARReviewerDecision]
  const changed = await db.cARReport.updateMany({
    where: { id: before.id, status: 'VERIFICATION_PENDING' },
    data: {
      status: nextStatus,
      reviewerNotes: body.notes,
      reviewedBy: req.auth.sub,
      reviewedAt: now,
      verifiedBy: approving ? req.auth.sub : null,
      verifiedAt: approving ? now : null,
      closedBy: approving ? req.auth.sub : null,
      closedAt: approving ? now : null,
      closureNotes: approving ? body.notes : null,
      currentStep: 3,
    },
  })
  if (changed.count !== 1) {
    res.status(409).json({ success: false, error: 'CAR status changed concurrently; reload the review queue.' })
    return
  }

  const car = await db.cARReport.findUnique({
    where: { id: before.id },
    include: { supplier: { select: { id: true, vendorId: true, companyName: true, contactEmail: true } } },
  })
  if (!car) { res.status(404).json({ success: false, error: 'CAR not found after update' }); return }

  await auditService.log({
    action: 'TRANSITION',
    actorId: req.auth.sub,
    actorEmail: req.auth.email,
    actorTier: req.auth.tier,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    resourceType: 'CAR_REVIEW',
    resourceId: car.id,
    supplierId: car.supplierId,
    carId: car.id,
    beforeState: { status: before.status },
    afterState: { status: car.status },
    metadata: { decision: body.decision, reviewerNotes: body.notes, reviewerRole: req.auth.internalRole },
  })

  if (car.supplier.contactEmail) {
    await emailService.sendCARReviewDecision({
      carId: car.carId,
      carDatabaseId: car.id,
      supplierName: car.supplier.companyName,
      toEmail: car.supplier.contactEmail,
      decision: body.decision,
      notes: body.notes,
    })
  }

  res.json({ success: true, data: car })
}))

router.get(
  '/',
  authenticate,
  requirePermission('car:read'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const cars = await db.cARReport.findMany({
      where: { supplierId: req.auth.supplierId },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, data: cars })
  }),
)

router.post(
  '/',
  authenticate,
  requirePermission('car:create'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = createSchema.parse(req.body)
    const deviationDescription = body.deviationDescription ?? body.deviation
    const partId = body.partId ?? body.nonConformingPart

    if (!deviationDescription || !partId || !body.affectedQty) {
      res.status(400).json({
        success: false,
        error: 'deviation, nonConformingPart, and affectedQty are required',
      })
      return
    }

    // A referenced RFQ must belong to the caller's own supplier — otherwise
    // this CAR would silently link two different suppliers' records together.
    if (body.rfqId) {
      const rfq = await db.rFQ.findUnique({
        where: { id: body.rfqId },
      })

      if (!rfq || rfq.supplierId !== req.auth.supplierId) {
        res.status(400).json({
          success: false,
          error: 'rfqId does not belong to this supplier',
        })
        return
      }
    }

    // An assignee must be a user within the caller's own supplier organization —
    // otherwise this would both misassign the CAR and email an unrelated
    // supplier's user with another supplier's quality data.
    let assignee: Awaited<ReturnType<typeof db.supplierUser.findUnique>> = null

    if (body.assignedTo) {
      assignee = await db.supplierUser.findUnique({
        where: { supabaseId: body.assignedTo },
      })

      if (!assignee || assignee.supplierId !== req.auth.supplierId) {
        res.status(400).json({
          success: false,
          error: 'assignedTo does not belong to this supplier',
        })
        return
      }
    }

    const car = await db.cARReport.create({
      data: {
        carId: generateCARId(),
        supplierId: req.auth.supplierId,
        severity: body.severity,
        deviationDescription,
        partId,
        affectedQty: body.affectedQty,
        detectedBy: body.detectedBy,
        batchNumber: body.batchNumber,
        rfqId: body.rfqId,
        lotNumber: body.lotNumber,
        assignedTo: body.assignedTo,
        createdBy: req.auth.sub,
      },
    })

    if (assignee) {
      await emailService.sendCARAssignment({
        carId: car.carId,
        severity: body.severity,
        toEmail: assignee.email,
        assignedName: assignee.name,
        description: deviationDescription,
      })
    }

    await auditService.log({
      action: 'CREATE',
      actorId: req.auth.sub,
      actorEmail: req.auth.email,
      actorTier: req.auth.tier,
      resourceType: 'CAR',
      resourceId: car.id,
      supplierId: req.auth.supplierId,
      carId: car.id,
      afterState: {
        status: 'OPEN',
        severity: body.severity,
      },
    })

    res.status(201).json({
      success: true,
      data: car,
    })
  }),
)

// GET /quality/capacity — latest line snapshots plus seven-day history
router.get(
  '/capacity',
  authenticate,
  requirePermission('capacity:read'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const snapshots = await db.capacitySnapshot.findMany({
      where: { supplierId: req.auth.supplierId },
      orderBy: { snapshotAt: 'desc' },
      distinct: ['lineId'],
      take: 20,
    })

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const history = await db.capacitySnapshot.findMany({
      where: {
        supplierId: req.auth.supplierId,
        snapshotAt: { gte: sevenDaysAgo },
      },
      orderBy: { snapshotAt: 'asc' },
      select: {
        snapshotAt: true,
        oee: true,
        utilization: true,
        lineId: true,
      },
    })

    const overallOEE = snapshots.length
      ? snapshots.reduce((sum, snapshot) => sum + Number(snapshot.oee), 0) / snapshots.length
      : null

    res.json({
      success: true,
      data: {
        vendorId: req.auth.vendorId,
        snapshotAt: new Date().toISOString(),
        overallOEE: overallOEE === null ? null : Math.round(overallOEE * 10) / 10,
        // Production/output figures are not fabricated: populate these only when
        // a verified production-data integration is configured.
        partsShippedMTD: null,
        monthlyTarget: null,
        lines: snapshots.map(snapshot => ({
          lineId: snapshot.lineId,
          lineName: snapshot.lineName,
          oee: Number(snapshot.oee),
          utilization: Number(snapshot.utilization),
          status: snapshot.status,
        })),
        weeklyHistory: history.map(snapshot => ({
          day: new Date(snapshot.snapshotAt)
            .toLocaleDateString('en-US', { weekday: 'short' })
            .toUpperCase(),
          oee: Number(snapshot.oee),
          utilization: Number(snapshot.utilization),
        })),
      },
    })
  }),
)

router.get(
  '/:id',
  authenticate,
  requirePermission('car:read'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const car = await db.cARReport.findUnique({
      where: { id: req.params.id },
      include: { documents: true },
    })

    if (!car || car.supplierId !== req.auth.supplierId) {
      res.status(404).json({
        success: false,
        error: 'CAR not found',
      })
      return
    }

    res.json({
      success: true,
      data: car,
    })
  }),
)

router.post(
  '/:id/transition',
  authenticate,
  requirePermission('car:transition'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const body = transitionSchema.parse(req.body)
    if (!SUPPLIER_CAR_TRANSITION_EVENTS.includes(body.event as CARTransitionEvent)) {
      res.status(403).json({ success: false, error: 'CAR closure is reserved for an internal quality reviewer.' })
      return
    }

    const before = await db.cARReport.findUnique({
      where: { id: req.params.id },
    })

    if (!before || before.supplierId !== req.auth.supplierId) {
      res.status(404).json({
        success: false,
        error: 'CAR not found',
      })
      return
    }

    const allowedEvents = CAR_TRANSITIONS[before.status]
    if (!allowedEvents.includes(body.event as CARTransitionEvent)) {
      res.status(409).json({
        success: false,
        error: `Transition ${body.event} is not allowed from ${before.status}`,
      })
      return
    }

    const newStatus = CAR_EVENT_TO_STATUS[body.event as CARTransitionEvent]

    // Compare-and-swap on status prevents concurrent requests from both
    // transitioning the same CAR from the same previous state.
    const changed = await db.cARReport.updateMany({
      where: { id: req.params.id, supplierId: req.auth.supplierId, status: before.status },
      data: {
        status: newStatus,
        rootCause: body.rootCause,
        correctiveAction: body.correctiveAction,
        preventiveAction: body.preventiveAction,
        actionDueDate: body.actionDueDate
          ? new Date(body.actionDueDate)
          : undefined,
        why1: body.why1,
        closureNotes: body.closureNotes,
        currentStep: body.currentStep,
        // verifiedBy/verifiedAt are reserved for an internal quality reviewer.
        // Supplier requests for verification must not be recorded as verification.
        closedBy:
          body.event === 'CLOSE'
            ? req.auth.sub
            : undefined,
        closedAt:
          body.event === 'CLOSE'
            ? new Date()
            : undefined,
      },
    })

    if (changed.count !== 1) {
      res.status(409).json({ success: false, error: 'CAR status changed concurrently; reload and retry.' })
      return
    }
    const car = await db.cARReport.findUnique({ where: { id: req.params.id } })
    if (!car) {
      res.status(404).json({ success: false, error: 'CAR not found' })
      return
    }

    await auditService.log({
      action: 'TRANSITION',
      actorId: req.auth.sub,
      actorEmail: req.auth.email,
      actorTier: req.auth.tier,
      resourceType: 'CAR',
      resourceId: car.id,
      supplierId: req.auth.supplierId,
      carId: car.id,
      beforeState: { status: before.status },
      afterState: { status: newStatus },
      metadata: { event: body.event },
    })

    res.json({
      success: true,
      data: car,
    })
  }),
)

export default router