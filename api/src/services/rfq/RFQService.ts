import { db } from '@/config/database'
import { emailService } from '@/services/email/EmailService'
import { auditService } from '@/services/audit/AuditService'
import { RFQ_TRANSITIONS, TRANSITION_TO_STATUS } from '@/types'
import type { RFQTransitionEvent } from '@/types'
import type { RFQStatus } from '@/types'
import type { Prisma } from '@prisma/client'
import { randomBytes } from 'crypto'
import { notFound, HttpError } from '@/utils/httpError'

function generateTrackingId(): string {
  const year  = new Date().getFullYear()
  const token = randomBytes(3).toString('hex').toUpperCase()
  return `RFQ-${year}-${token}`
}

export interface TransitionRFQInput {
  rfqId:      string
  event:      RFQTransitionEvent
  actorId:    string
  actorEmail: string
  supplierId: string
  reason?:    string
}

export interface CreateRFQInput {
  supplierId:     string
  productSlug?:   string
  partFamily:     string
  sku?:           string
  annualVolume?:  number
  minLotSize?:    number
  peakWeekly?:    number
  sopTargetDate?: string
  protoDate?:     string
  createdBy:      string
}

class RFQService {
  async create(input: CreateRFQInput) {
    const rfq = await db.rFQ.create({
      data: {
        trackingId:     generateTrackingId(),
        supplierId:     input.supplierId,
        productSlug:    input.productSlug,
        partFamily:     input.partFamily,
        sku:            input.sku,
        annualVolume:   input.annualVolume,
        minLotSize:     input.minLotSize,
        peakWeekly:     input.peakWeekly,
        sopTargetDate:  input.sopTargetDate  ? new Date(input.sopTargetDate)  : undefined,
        protoTargetDate:input.protoDate       ? new Date(input.protoDate)       : undefined,
        status:         'DRAFT',
        createdBy:      input.createdBy,
      },
    })

    await auditService.log({
      action:       'CREATE',
      actorId:      input.createdBy,
      actorEmail:   '',
      resourceType: 'RFQ',
      resourceId:   rfq.id,
      supplierId:   input.supplierId,
      rfqId:        rfq.id,
      afterState:   { status: 'DRAFT', trackingId: rfq.trackingId },
    })

    return rfq
  }

  async transition({ rfqId, event, actorId, actorEmail, supplierId, reason }: TransitionRFQInput) {
    const rfq = await db.rFQ.findUnique({ where: { id: rfqId } })

    // Return the same "not found" response whether the RFQ doesn't exist
    // or belongs to a different supplier — never confirm cross-tenant
    // existence to the caller.
    if (!rfq || rfq.supplierId !== supplierId) {
      throw notFound('RFQ')
    }

    const allowed = RFQ_TRANSITIONS[rfq.status as RFQStatus]

    if (!allowed.includes(event)) {
      throw new HttpError(
        409,
        `Cannot apply '${event}' to RFQ in status '${rfq.status}'. ` +
        `Allowed events: ${allowed.join(', ') || 'none'}.`
      )
    }

    const newStatus = TRANSITION_TO_STATUS[event]

    // Interactive transaction: the conditional update and the transition-
    // history write must succeed or fail together. A thrown error inside
    // this callback rolls back everything in it — including the status
    // change — so a crash between the two can't leave the RFQ's status
    // changed with no corresponding history record.
    const updated = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // Conditional update: only writes if the status still matches what
      // we just validated against. If a concurrent request already
      // transitioned this RFQ, updateMany affects 0 rows and we abort
      // instead of silently overwriting the other request's change.
      const { count } = await tx.rFQ.updateMany({
        where: { id: rfqId, status: rfq.status },
        data:  {
          status:       newStatus,
          reviewNotes:  reason,
          reviewedBy:   ['APPROVE','REJECT','REQUEST_CLARIFICATION'].includes(event) ? actorId : undefined,
          reviewedAt:   ['APPROVE','REJECT','REQUEST_CLARIFICATION'].includes(event) ? new Date() : undefined,
          submittedAt:  event === 'SUBMIT' ? new Date() : undefined,
        },
      })

      if (count === 0) {
        throw new HttpError(409, 'RFQ status changed concurrently — please retry.')
      }

      await tx.rFQTransition.create({
        data: {
          rfqId,
          fromStatus: rfq.status,
          toStatus:   newStatus,
          actorId,
          actorEmail,
          reason,
        },
      })

      return tx.rFQ.findUniqueOrThrow({ where: { id: rfqId } })
    })

    await auditService.log({
      action:       'TRANSITION',
      actorId,
      actorEmail,
      resourceType: 'RFQ',
      resourceId:   rfqId,
      rfqId,
      supplierId:   rfq.supplierId,
      beforeState:  { status: rfq.status },
      afterState:   { status: newStatus },
      metadata:     { event, reason },
    })

    // Fetch supplier contact for notification
    const supplier = await db.supplier.findUnique({
      where:   { id: rfq.supplierId },
      include: { users: { take: 1 } },
    })

    if (supplier?.users[0]) {
      await emailService.sendRFQStatusUpdate({
        trackingId:   rfq.trackingId,
        partFamily:   rfq.partFamily,
        supplierName: supplier.companyName,
        toEmail:      supplier.users[0].email,
        status:       newStatus,
        reviewNotes:  reason,
      })
    }

    return updated
  }

  async findById(id: string) {
    return db.rFQ.findUnique({
      where:   { id },
      include: { documents: true, transitions: { orderBy: { createdAt: 'asc' } } },
    })
  }

  async findByTrackingId(trackingId: string) {
    return db.rFQ.findUnique({
      where:   { trackingId },
      include: { documents: true, transitions: { orderBy: { createdAt: 'asc' } } },
    })
  }

  async listForSupplier(supplierId: string, status?: RFQStatus) {
    return db.rFQ.findMany({
      where:   { supplierId, ...(status ? { status } : {}) },
      include: { documents: { select: { id: true, fileName: true, uploadedAt: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }
}

export const rfqService = new RFQService()