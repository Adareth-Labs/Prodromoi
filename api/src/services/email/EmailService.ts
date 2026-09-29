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

interface EmailMessage {
  to: string
  subject: string
  html: string
}

interface CtaButtonData {
  href: string
  label: string
}

const PORTAL_URL = env.API_BASE_URL.replace('api.', 'portal.')
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
  <a href="${href}"
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
      <h1 style="font-size:20px;font-weight:500;margin-bottom:8px">${subject}</h1>
      <p style="color:#444748;font-size:15px;margin-bottom:24px">
        Your RFQ <strong>${trackingId}</strong> for <strong>${partFamily}</strong>
        has been updated to: <strong>${status.replace(/_/g, ' ')}</strong>.
      </p>
      ${
        reviewNotes
          ? `<div style="background:#f3f4f5;padding:16px;border-left:3px solid #1a1c1e;margin-bottom:24px;font-size:14px;color:#444748">${reviewNotes}</div>`
          : ''
      }
      ${renderCtaButton({
        href: `${portalUrl ?? PORTAL_URL}/rfq/${trackingId}`,
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
          <strong>${supplierName}</strong> has uploaded a <strong>${documentType}</strong>
          for platform <strong>${platformId}</strong>.
        </p>
        ${renderCtaButton({
          href: `${PORTAL_URL}/ppap?supplier=${supplierId}`,
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
      <h1 style="font-size:20px;font-weight:500;margin-bottom:8px">CAR Assigned: ${carId}</h1>
      <div style="background:${severityStyle.background};border-left:3px solid ${severityStyle.colour};padding:12px 16px;margin-bottom:20px;font-size:13px">
        Severity: <strong>${severity}</strong>
      </div>
      <p style="color:#444748;font-size:15px;margin-bottom:8px">Hello ${assignedName},</p>
      <p style="color:#444748;font-size:15px;margin-bottom:24px">
        A corrective action report has been assigned to you: <em>${description}</em>
      </p>
      ${renderCtaButton({
        href: `${PORTAL_URL}/quality/car/${carId}`,
        label: 'Open CAR Report',
      })}
    `)

    await this.send({
      to: toEmail,
      subject: `CAR Assigned: ${carId} [${severity}]`,
      html,
    })
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