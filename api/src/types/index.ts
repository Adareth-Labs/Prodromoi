// Enums defined locally — mirrors prisma/schema.prisma
// Once `prisma generate` has run, these can be imported from '@prisma/client'

export type PortalTier = 'BASIC' | 'QUALIFIED' | 'STRATEGIC'
export type InternalReviewerRole = 'QUALITY_REVIEWER' | 'QUALITY_ADMIN'
export type AuthActorType = 'SUPPLIER' | 'INTERNAL'

export type RFQStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CLARIFICATION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'IN_PRODUCTION'
  | 'CANCELLED'

export type PPAPStatus = 'PENDING' | 'PARTIAL' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
export type CARSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL'
export type CARStatus =
  | 'OPEN'
  | 'ROOT_CAUSE_IDENTIFIED'
  | 'ACTION_PLAN_SUBMITTED'
  | 'VERIFICATION_PENDING'
  | 'CLOSED'
  | 'ESCALATED'


export type CARTransitionEvent =
  | 'IDENTIFY_ROOT_CAUSE'
  | 'SUBMIT_ACTION_PLAN'
  | 'REQUEST_VERIFICATION'
  | 'CLOSE'
  | 'ESCALATE'

export type CARReviewerDecision = 'APPROVE' | 'REQUEST_CHANGES'
export const CAR_REVIEWER_DECISION_TO_STATUS: Record<CARReviewerDecision, CARStatus> = {
  APPROVE: 'CLOSED',
  REQUEST_CHANGES: 'ACTION_PLAN_SUBMITTED',
}

export const CAR_TRANSITIONS: Record<CARStatus, CARTransitionEvent[]> = {
  OPEN: ['IDENTIFY_ROOT_CAUSE', 'ESCALATE'],
  ROOT_CAUSE_IDENTIFIED: ['SUBMIT_ACTION_PLAN', 'ESCALATE'],
  ACTION_PLAN_SUBMITTED: ['REQUEST_VERIFICATION', 'ESCALATE'],
  VERIFICATION_PENDING: ['CLOSE', 'SUBMIT_ACTION_PLAN', 'ESCALATE'],
  ESCALATED: ['IDENTIFY_ROOT_CAUSE', 'SUBMIT_ACTION_PLAN', 'REQUEST_VERIFICATION'],
  CLOSED: [],
}

export const CAR_EVENT_TO_STATUS: Record<CARTransitionEvent, CARStatus> = {
  IDENTIFY_ROOT_CAUSE: 'ROOT_CAUSE_IDENTIFIED',
  SUBMIT_ACTION_PLAN: 'ACTION_PLAN_SUBMITTED',
  REQUEST_VERIFICATION: 'VERIFICATION_PENDING',
  CLOSE: 'CLOSED',
  ESCALATE: 'ESCALATED',
}

// Supplier users can document corrective action and request verification, but
// cannot independently close their own CAR. Closure needs an internal reviewer flow.
export const SUPPLIER_CAR_TRANSITION_EVENTS: CARTransitionEvent[] = [
  'IDENTIFY_ROOT_CAUSE', 'SUBMIT_ACTION_PLAN', 'REQUEST_VERIFICATION', 'ESCALATE',
]

export type AuditAction =
  | 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  | 'TRANSITION' | 'DOWNLOAD' | 'LOGIN' | 'LOGOUT' | 'ACCESS_DENIED'

// ── FIX 2: Extend Express Request via declaration merging ─────────────────────
// This is the idiomatic fix for custom properties on req —
// all route handlers use the base Request type; TypeScript knows auth is always present.

import 'express'
declare module 'express-serve-static-core' {
  interface Request {
    auth: {
      sub:          string
      email:        string
      name:         string
      tier:         PortalTier
      supplierId:   string
      vendorId:     string
      actorType:    AuthActorType
      internalRole?: InternalReviewerRole
    }
  }
}

export type AuthenticatedRequest = import('express').Request

export interface ApiResponse<T = unknown> {
  success: boolean
  data?:   T
  error?:  string
  meta?:   { total?: number; page?: number; limit?: number }
}

export type RFQTransitionEvent =
  | 'SUBMIT'
  | 'START_REVIEW'
  | 'REQUEST_CLARIFICATION'
  | 'APPROVE'
  | 'REJECT'
  | 'MARK_IN_PRODUCTION'
  | 'CANCEL'

// The partner portal represents supplier users, not internal reviewers. Only
// supplier-owned actions may be submitted through its public-facing API route.
export const SUPPLIER_RFQ_TRANSITION_EVENTS: RFQTransitionEvent[] = ['SUBMIT', 'CANCEL']

export const RFQ_TRANSITIONS: Record<RFQStatus, RFQTransitionEvent[]> = {
  DRAFT:                  ['SUBMIT', 'CANCEL'],
  SUBMITTED:              ['START_REVIEW', 'CANCEL'],
  UNDER_REVIEW:           ['REQUEST_CLARIFICATION', 'APPROVE', 'REJECT'],
  CLARIFICATION_REQUIRED: ['SUBMIT', 'CANCEL'],
  APPROVED:               ['MARK_IN_PRODUCTION'],
  REJECTED:               [],
  IN_PRODUCTION:          [],
  CANCELLED:              [],
}

export const TRANSITION_TO_STATUS: Record<RFQTransitionEvent, RFQStatus> = {
  SUBMIT:                 'SUBMITTED',
  START_REVIEW:           'UNDER_REVIEW',
  REQUEST_CLARIFICATION:  'CLARIFICATION_REQUIRED',
  APPROVE:                'APPROVED',
  REJECT:                 'REJECTED',
  MARK_IN_PRODUCTION:     'IN_PRODUCTION',
  CANCEL:                 'CANCELLED',
}

export const TIER_PERMISSIONS: Record<string, PortalTier[]> = {
  'rfq:read':           ['BASIC', 'QUALIFIED', 'STRATEGIC'],
  'rfq:create':         ['QUALIFIED', 'STRATEGIC'],
  'rfq:transition':     ['QUALIFIED', 'STRATEGIC'],
  'ppap:read':          ['QUALIFIED', 'STRATEGIC'],
  'ppap:upload':        ['QUALIFIED', 'STRATEGIC'],
  'ppap:approve':       ['QUALIFIED', 'STRATEGIC'],
  'car:read':           ['QUALIFIED', 'STRATEGIC'],
  'car:create':         ['QUALIFIED', 'STRATEGIC'],
  'car:transition':     ['QUALIFIED', 'STRATEGIC'],
  'document:certs':     ['BASIC', 'QUALIFIED', 'STRATEGIC'],
  'document:cad':       ['QUALIFIED', 'STRATEGIC'],
  'document:roadmap':   ['STRATEGIC'],
  'scorecard:read':     ['QUALIFIED', 'STRATEGIC'],
  'capacity:read':      ['STRATEGIC'],
}
