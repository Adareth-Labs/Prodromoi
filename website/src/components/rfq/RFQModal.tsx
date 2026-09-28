'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'

type Step = 1 | 2 | 3 | 'confirmed'

interface Props {
  open:      boolean
  productSlug?: string
  onClose:   () => void
}

const STEP_LABELS: Record<number, string> = {
  1: 'Technical Specifications',
  2: 'Documentation Upload',
  3: 'Final Review',
}

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://portal.precisioncore.com'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001'

export function RFQModal({ open, productSlug, onClose }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [trackingId, setTrackingId] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  // Lock body scroll and manage focus when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      // Move focus into dialog on open
      setTimeout(() => dialogRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
      setStep(1)
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Escape key closes modal
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit() {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/v1/public/rfq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Source': 'public-site' },
        body: JSON.stringify({ productSlug, step: 3 }),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok || !json?.data?.trackingId) {
        throw new Error(json?.error ?? 'RFQ submission failed')
      }
      setTrackingId(json.data.trackingId)
      setStep('confirmed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 overflow-y-auto flex items-start justify-center p-16"
      role="presentation"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rfq-title"
        tabIndex={-1}
        className="bg-white dark:bg-surface w-full max-w-2xl p-10 outline-none"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <span className="section-label">Partner Portal</span>
            <h2 id="rfq-title" className="text-2xl font-medium">RFQ Submission</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close RFQ modal"
            className="text-ink-secondary hover:text-ink-primary flex items-center"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Stepper */}
        {step !== 'confirmed' && (
          <div className="flex items-center mb-8" aria-label="RFQ submission progress">
            {([1, 2, 3] as const).map((n, i) => (
              <div key={n} className="flex items-center flex-1 last:flex-none">
                <div
                  className={[
                    'w-8 h-8 flex items-center justify-center font-mono text-xs font-medium flex-shrink-0',
                    step === n
                      ? 'bg-action text-white'
                      : (step as number) > n
                        ? 'bg-success-bg text-success border border-success'
                        : 'bg-surface-mid text-ink-secondary',
                  ].join(' ')}
                  aria-current={step === n ? 'step' : undefined}
                >
                  {(step as number) > n
                    ? <span className="material-symbols-outlined text-sm" aria-hidden="true">check</span>
                    : n}
                </div>
                {i < 2 && <div className="flex-1 h-px bg-stroke mx-2" aria-hidden="true" />}
              </div>
            ))}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <div>
            <h3 className="text-base font-medium mb-4">{STEP_LABELS[1]}</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="rfq-sku" className="text-sm text-ink-secondary block mb-1">SKU / Part Number</label>
                <input id="rfq-sku" type="text" placeholder="e.g. TX-9055-GRP" defaultValue={productSlug ?? ''} className="w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="rfq-volume" className="text-sm text-ink-secondary block mb-1">Annualized Volume (units)</label>
                  <input id="rfq-volume" type="number" placeholder="150000" className="w-full" />
                </div>
                <div>
                  <label htmlFor="rfq-sop" className="text-sm text-ink-secondary block mb-1">SOP Target Date</label>
                  <input id="rfq-sop" type="date" className="w-full" />
                </div>
              </div>
            </div>
            <div className="flex justify-between border-t border-stroke pt-5">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <div className="flex gap-3">
                <Button variant="secondary">Save Draft</Button>
                <Button onClick={() => setStep(2)}>Next: Documentation →</Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div>
            <h3 className="text-base font-medium mb-4">{STEP_LABELS[2]}</h3>
            <div
              className="border-2 border-dashed border-stroke p-10 text-center mb-4 bg-surface-low"
              role="button"
              tabIndex={0}
              aria-label="Upload documents"
            >
              <span className="material-symbols-outlined text-4xl text-ink-secondary block mb-2" aria-hidden="true">upload_file</span>
              <div className="text-sm font-medium mb-1">Drag & drop or click to browse</div>
              <div className="text-xs text-ink-secondary">PDF, DXF, STEP, IGES — Max 50MB per file</div>
            </div>
            <div className="flex justify-between border-t border-stroke pt-5">
              <Button variant="secondary" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={() => setStep(3)}>Final Review →</Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div>
            <h3 className="text-base font-medium mb-4">{STEP_LABELS[3]}</h3>
            <div className="bg-surface-low p-4 mb-4">
              <span className="section-label mb-3">Submission Summary</span>
              <div className="spec-row"><span className="spec-label">Part</span><span className="spec-value">{productSlug ?? '—'}</span></div>
              <div className="spec-row"><span className="spec-label">Documents</span><span className="spec-value">1 uploaded</span></div>
            </div>
            <div className="flex justify-between border-t border-stroke pt-5">
              <Button variant="secondary" onClick={() => setStep(2)}>← Back</Button>
              <Button loading={loading} onClick={handleSubmit}>Submit RFQ</Button>
            </div>
          </div>
        )}

        {/* Confirmation */}
        {step === 'confirmed' && (
          <div className="text-center py-4">
            <span className="material-symbols-outlined text-5xl text-success block mb-4" aria-hidden="true">check_circle</span>
            <h2 className="text-2xl font-medium mb-2">Submission Received</h2>
            <div className="section-label mb-2">RFQ Tracking ID</div>
            <div className="text-3xl font-medium tracking-tight mb-6">{trackingId || 'RFQ'}</div>
            <p className="text-sm text-ink-secondary mb-6">
              Our procurement team will respond within <strong>5 business days</strong>.
              Track status via the Partner Portal.
            </p>
            <div className="flex gap-3 justify-center">
              <a
                href={`${PORTAL_URL}/rfq`}
                className="bg-action text-white border border-action font-mono text-xs uppercase tracking-widest font-medium px-5 py-2.5 hover:opacity-85 transition-opacity"
              >
                View in Portal
              </a>
              <Button variant="secondary" onClick={onClose}>Close</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}