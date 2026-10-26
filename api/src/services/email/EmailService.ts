import { transporter, FROM } from '@/config/email'
import { logger } from '@/config/logger'
import { env } from '@/config/env'
import type { RFQStatus } from '@/types'

interface RFQEmailData {
  trackingId: string
  partFamily: string
  supplierName: string
  toEmail: string
  status: RFQStatus
  reviewNotes?: string
  portalUrl?: string
}

interface PPAPEmailData {
  supplierId: string
  supplierName: string
  platformId: string
  documentType: string
  toEmail: string
  reviewerEmail: string
}

interface CAREmailData {
  carId: string
  severity: string
  toEmail: string
  assignedName: string
  description: string
}

interface CARReviewEmailData {
  carId: string
  carDatabaseId: string
  supplierName: string
  toEmail: string
  decision: 'APPROVE' | 'REQUEST_CHANGES'
  notes: string
}

interface EmailMessage {
  to: string
  subject: string
  html: string
}

interface CtaButtonData {
  href: string
  label: string
}

const PORTAL_URL = env.PORTAL_URL ?? (env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://portal.precisioncore.com')
const SMTP_CONFIGURATION_MESSAGE = 'SMTP not configured — email skipped'

const STATUS_SUBJECT: Partial<Record<RFQStatus, string>> = {
  SUBMITTED: 'RFQ Received — Action Required',
  UNDER_REVIEW: 'Your RFQ is Under Review',
  CLARIFICATION_REQUIRED: 'Clarification Requested on Your RFQ',
  APPROVED: 'Your RFQ Has Been Approved',
  REJECTED: 'RFQ Update — Review Required',
  IN_PRODUCTION: 'RFQ Moved to Production',
}

const CAR_SEVERITY_STYLES: Record<
  string,
  {
    colour: string
    background: string
  }
> = {
  CRITICAL: {
    colour: '#b91c1c',
    background: '#fef2f2',
  },
  DEFAULT: {
    colour: '#b45309',
    background: '#fffbeb',
  },
}

const escapeHtml = (value: unknown): string => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const renderEmailShell = (bodyHtml: string): string => `
  <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:40px 24px">
    <div style="font-size:20px;font-weight:500;letter-spacing:-0.02em;margin-bottom:32px">PRECISIONCORE</div>
    ${bodyHtml}
    <p style="color:#747878;font-size:12px;margin-top:32px">
      PrecisionCore Automotive · ISO 9001:2015 &amp; IATF 16949 Certified
    </p>
  </div>
`

const renderCtaButton = ({ href, label }: CtaButtonData): string => `
  <a href="${escapeHtml(href)}"
     style="display:inline-block;background:#1a1c1e;color:#fff;padding:12px 24px;font-family:monospace;font-size:11px;letter-spacing:0.05em;text-transform:uppercase;text-decoration:none">
    ${label}
  </a>
`

class EmailService {
  async sendRFQStatusUpdate({
    trackingId,
    partFamily,
    toEmail,
    status,
    reviewNotes,
    portalUrl,
  }: RFQEmailData): Promise<void> {
    const subject = STATUS_SUBJECT[status] ?? `RFQ Update: ${trackingId}`

    const html = renderEmailShell(`
      <h1 style="font-size:20px;font-weight:500;margin-bottom:8px">${escapeHtml(subject)}</h1>
      <p style="color:#444748;font-size:15px;margin-bottom:24px">
        Your RFQ <strong>${escapeHtml(trackingId)}</strong> for <strong>${escapeHtml(partFamily)}</strong>
        has been updated to: <strong>${escapeHtml(status.replace(/_/g, ' '))}</strong>.
      </p>
      ${
        reviewNotes
          ? `<div style="background:#f3f4f5;padding:16px;border-left:3px solid #1a1c1e;margin-bottom:24px;font-size:14px;color:#444748">${escapeHtml(reviewNotes)}</div>`
          : ''
      }
      ${renderCtaButton({
        href: `${portalUrl ?? PORTAL_URL}/rfq/${encodeURIComponent(trackingId)}`, 
        label: 'View in Portal',
      })}
    `)

    await this.send({
      to: toEmail,
      subject,
      html,
    })
  }

  async sendPPAPUploadNotification({
    supplierId,
    supplierName,
    platformId,
    documentType,
    toEmail,
    reviewerEmail,
  }: PPAPEmailData): Promise<void> {
    const renderDocumentBody = (heading: string): string =>
      renderEmailShell(`
        <h1 style="font-size:20px;font-weight:500;margin-bottom:8px">${heading}</h1>
        <p style="color:#444748;font-size:15px;margin-bottom:24px">
          <strong>${escapeHtml(supplierName)}</strong> has uploaded a <strong>${escapeHtml(documentType)}</strong>
          for platform <strong>${escapeHtml(platformId)}</strong>.
        </p>
        ${renderCtaButton({
          href: `${PORTAL_URL}/ppap?supplier=${encodeURIComponent(supplierId)}`, 
          label: 'Review Document',
        })}
      `)

    await this.send({
      to: reviewerEmail,
      subject: 'PPAP Document Requires Review',
      html: renderDocumentBody('PPAP Document Uploaded'),
    })

    await this.send({
      to: toEmail,
      subject: 'PPAP Document Upload Confirmed',
      html: renderDocumentBody('PPAP Document Received'),
    })
  }

  async sendCARAssignment({
    carId,
    severity,
    toEmail,
    assignedName,
    description,
  }: CAREmailData): Promise<void> {
    const severityStyle =
      CAR_SEVERITY_STYLES[severity] ?? CAR_SEVERITY_STYLES.DEFAULT

    const html = renderEmailShell(`
      <h1 style="font-size:20px;font-weight:500;margin-bottom:8px">CAR Assigned: ${escapeHtml(carId)}</h1>
      <div style="background:${severityStyle.background};border-left:3px solid ${severityStyle.colour};padding:12px 16px;margin-bottom:20px;font-size:13px">
        Severity: <strong>${escapeHtml(severity)}</strong>
      </div>
      <p style="color:#444748;font-size:15px;margin-bottom:8px">Hello ${escapeHtml(assignedName)},</p>
      <p style="color:#444748;font-size:15px;margin-bottom:24px">
        A corrective action report has been assigned to you: <em>${escapeHtml(description)}</em>
      </p>
      ${renderCtaButton({
        href: `${PORTAL_URL}/quality/car/${encodeURIComponent(carId)}`, 
        label: 'Open CAR Report',
      })}
    `)

    await this.send({
      to: toEmail,
      subject: `CAR Assigned: ${carId} [${severity}]`,
      html,
    })
  }

  async sendCARReviewDecision({
    carId,
    carDatabaseId,
    supplierName,
    toEmail,
    decision,
    notes,
  }: CARReviewEmailData): Promise<void> {
    const approved = decision === 'APPROVE'
    const subject = approved
      ? `Corrective Action Approved: ${carId}`
      : `Action Required: Update Corrective Action ${carId}`
    const summary = approved
      ? 'An internal PrecisionCore quality reviewer has verified and closed this corrective action report.'
      : 'An internal PrecisionCore quality reviewer has requested changes. Please review the notes and resubmit your corrective action plan.'
    const html = renderEmailShell(`
      <h1 style="font-size:20px;font-weight:500;margin-bottom:8px">${escapeHtml(subject)}</h1>
      <p style="color:#444748;font-size:14px;margin-bottom:16px">Hello ${escapeHtml(supplierName)},</p>
      <p style="color:#444748;font-size:14px;line-height:1.6;margin-bottom:20px">${escapeHtml(summary)}</p>
      <div style="background:#f3f4f5;padding:16px;border-left:3px solid ${approved ? '#16a34a' : '#d97706'};margin-bottom:24px;font-size:14px;color:#444748;white-space:pre-wrap">
        <strong>Reviewer notes</strong><br/>${escapeHtml(notes)}
      </div>
      ${renderCtaButton({ href: `${PORTAL_URL}/car/${encodeURIComponent(carDatabaseId)}`, label: approved ? 'View Closed CAR' : 'Update CAR' })}
    `)
    await this.send({ to: toEmail, subject, html })
  }

  private async send({ to, subject, html }: EmailMessage): Promise<void> {
    if (!transporter || !FROM.email) {
      logger.warn(SMTP_CONFIGURATION_MESSAGE, {
        to,
        subject,
      })
      return
    }

    try {
      const info = await transporter.sendMail({
        from: `"${FROM.name}" <${FROM.email}>`,
        to,
        subject,
        html,
      })

      logger.info('Email sent', {
        messageId: info.messageId,
        to,
        subject,
      })
    } catch (error: unknown) {
      logger.error('Email send failed', {
        error: String(error),
        to,
        subject,
      })
    }
  }
}

export const emailService = new EmailService()