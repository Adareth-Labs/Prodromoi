'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'

type Step = 1 | 2 | 3 | 'confirmed'
type UploadedDocument = { key: string; fileName: string; contentType: string; sizeBytes: number }

interface Props {
  open: boolean
  productSlug?: string
  onClose: () => void
}

const STEP_LABELS: Record<number, string> = {
  1: 'Technical Specifications',
  2: 'Documentation Upload',
  3: 'Final Review',
}
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://portal.precisioncore.com'
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3002'
const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_FILES = 5
const ALLOWED_EXTENSIONS = /\.(pdf|dxf|step|stp|iges|igs)$/i

export function RFQModal({ open, productSlug, onClose }: Props) {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [trackingId, setTrackingId] = useState('')
  const [sku, setSku] = useState(productSlug ?? '')
  const [annualVolume, setAnnualVolume] = useState('')
  const [sopDate, setSopDate] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => dialogRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
      setStep(1)
      setLoading(false)
      setUploading(false)
      setFiles([])
      setUploadedDocuments([])
      setErrorMessage('')
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  function validateFiles(selected: File[]): string | null {
    if (selected.length > MAX_FILES) return `Choose no more than ${MAX_FILES} files.`
    for (const file of selected) {
      if (!ALLOWED_EXTENSIONS.test(file.name)) return `${file.name}: only PDF, DXF, STEP and IGES files are accepted.`
      if (file.size <= 0 || file.size > MAX_FILE_SIZE) return `${file.name}: each file must be between 1 byte and 25 MB.`
    }
    return null
  }

  function handleFilesChanged(selected: FileList | null) {
    const nextFiles = Array.from(selected ?? [])
    const validationError = validateFiles(nextFiles)
    setErrorMessage(validationError ?? '')
    // Clear the previous selection even when the new selection is invalid;
    // never allow a stale file list to be submitted accidentally.
    setFiles(validationError ? [] : nextFiles)
    setUploadedDocuments([])
  }

  async function uploadDocuments(): Promise<UploadedDocument[]> {
    const results: UploadedDocument[] = []
    for (const file of files) {
      const contentType = file.type || 'application/octet-stream'
      const signedResponse = await fetch(`${API_BASE_URL}/v1/public/rfq/upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Source': 'public-site' },
        body: JSON.stringify({ fileName: file.name, contentType, sizeBytes: file.size }),
      })
      const signed = await signedResponse.json().catch(() => ({}))
      if (!signedResponse.ok || !signed?.data?.uploadUrl || !signed?.data?.key) {
        throw new Error(signed?.error ?? `Could not prepare ${file.name} for upload.`)
      }
      const putResponse = await fetch(signed.data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      })
      if (!putResponse.ok) throw new Error(`Upload failed for ${file.name}. Please retry.`)
      results.push({ key: signed.data.key, fileName: file.name, contentType, sizeBytes: file.size })
    }
    return results
  }

  async function handleDocumentsContinue() {
    setErrorMessage('')
    setUploading(true)
    try {
      const uploaded = files.length ? await uploadDocuments() : []
      setUploadedDocuments(uploaded)
      setStep(3)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Document upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    setErrorMessage('')
    if (!contactEmail.trim()) {
      setErrorMessage('Enter a contact email address before submitting the RFQ.')
      setStep(1)
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/v1/public/rfq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Source': 'public-site' },
        body: JSON.stringify({
          productSlug,
          sku: sku.trim() || undefined,
          annualVolume: annualVolume ? Number(annualVolume) : undefined,
          sopDate: sopDate ? new Date(`${sopDate}T00:00:00.000Z`).toISOString() : undefined,
          contactEmail: contactEmail.trim(),
          step: 3,
          documents: uploadedDocuments,
        }),
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok || !json?.data?.trackingId) throw new Error(json?.error ?? 'RFQ submission failed')
      setTrackingId(json.data.trackingId)
      setStep('confirmed')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'RFQ submission failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleNextFromSpecifications() {
    setErrorMessage('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      setErrorMessage('Enter a valid contact email address to continue.')
      return
    }
    if (annualVolume && (!Number.isInteger(Number(annualVolume)) || Number(annualVolume) <= 0)) {
      setErrorMessage('Annualized volume must be a positive whole number.')
      return
    }
    setStep(2)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto flex items-start justify-center p-6 md:p-16" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="rfq-title" tabIndex={-1} className="bg-white dark:bg-surface w-full max-w-2xl p-6 md:p-10 outline-none">
        <div className="flex justify-between items-start mb-8">
          <div><span className="section-label">Partner Portal</span><h2 id="rfq-title" className="text-2xl font-medium">RFQ Submission</h2></div>
          <button type="button" onClick={onClose} aria-label="Close RFQ modal" className="text-ink-secondary hover:text-ink-primary flex items-center"><span className="material-symbols-outlined text-xl" aria-hidden="true">close</span></button>
        </div>

        {step !== 'confirmed' && <div className="flex items-center mb-8" aria-label="RFQ submission progress">{([1, 2, 3] as const).map((n, i) => <div key={n} className="flex items-center flex-1 last:flex-none"><div className={['w-8 h-8 flex items-center justify-center font-mono text-xs font-medium flex-shrink-0', step === n ? 'bg-action text-white' : (step as number) > n ? 'bg-success-bg text-success border border-success' : 'bg-surface-mid text-ink-secondary'].join(' ')} aria-current={step === n ? 'step' : undefined}>{(step as number) > n ? <span className="material-symbols-outlined text-sm" aria-hidden="true">check</span> : n}</div>{i < 2 && <div className="flex-1 h-px bg-stroke mx-2" aria-hidden="true" />}</div>)}</div>}

        {errorMessage && <div role="alert" className="mb-5 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{errorMessage}</div>}

        {step === 1 && <div>
          <h3 className="text-base font-medium mb-4">{STEP_LABELS[1]}</h3>
          <div className="space-y-4 mb-6">
            <div><label htmlFor="rfq-sku" className="text-sm text-ink-secondary block mb-1">SKU / Part Number</label><input id="rfq-sku" type="text" maxLength={200} placeholder="e.g. TX-9055-GRP" value={sku} onChange={(e) => setSku(e.target.value)} className="w-full" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label htmlFor="rfq-volume" className="text-sm text-ink-secondary block mb-1">Annualized Volume (units)</label><input id="rfq-volume" type="number" min={1} step={1} placeholder="150000" value={annualVolume} onChange={(e) => setAnnualVolume(e.target.value)} className="w-full" /></div>
              <div><label htmlFor="rfq-sop" className="text-sm text-ink-secondary block mb-1">SOP Target Date</label><input id="rfq-sop" type="date" value={sopDate} onChange={(e) => setSopDate(e.target.value)} className="w-full" /></div>
            </div>
            <div><label htmlFor="rfq-contact-email" className="text-sm text-ink-secondary block mb-1">Contact Email <span aria-hidden="true">*</span></label><input id="rfq-contact-email" type="email" required autoComplete="email" maxLength={320} placeholder="name@company.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full" /></div>
          </div>
          <div className="flex justify-between border-t border-stroke pt-5"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={handleNextFromSpecifications}>Next: Documentation →</Button></div>
        </div>}

        {step === 2 && <div>
          <h3 className="text-base font-medium mb-4">{STEP_LABELS[2]}</h3>
          <label htmlFor="rfq-documents" className="block border-2 border-dashed border-stroke p-6 md:p-10 text-center mb-4 bg-surface-low cursor-pointer">
            <span className="material-symbols-outlined text-4xl text-ink-secondary block mb-2" aria-hidden="true">upload_file</span>
            <span className="text-sm font-medium mb-1 block">Choose documents to upload</span>
            <span className="text-xs text-ink-secondary block">PDF, DXF, STEP, IGES — maximum 5 files, 25 MB each</span>
            <input id="rfq-documents" type="file" multiple accept=".pdf,.dxf,.step,.stp,.iges,.igs" className="mt-4 block w-full text-sm" onChange={(e) => handleFilesChanged(e.target.files)} />
          </label>
          {files.length > 0 && <ul className="text-sm mb-4 space-y-1">{files.map((file) => <li key={`${file.name}-${file.size}`}>{file.name} <span className="text-ink-secondary">({(file.size / 1024 / 1024).toFixed(2)} MB)</span></li>)}</ul>}
          <div className="flex justify-between border-t border-stroke pt-5"><Button variant="secondary" onClick={() => setStep(1)} disabled={uploading}>← Back</Button><Button loading={uploading} onClick={handleDocumentsContinue}>{files.length ? 'Upload & continue →' : 'Continue without documents →'}</Button></div>
        </div>}

        {step === 3 && <div>
          <h3 className="text-base font-medium mb-4">{STEP_LABELS[3]}</h3>
          <div className="bg-surface-low p-4 mb-4"><span className="section-label mb-3">Submission Summary</span><div className="spec-row"><span className="spec-label">Part</span><span className="spec-value">{sku || productSlug || '—'}</span></div><div className="spec-row"><span className="spec-label">Annual volume</span><span className="spec-value">{annualVolume || '—'}</span></div><div className="spec-row"><span className="spec-label">Contact</span><span className="spec-value">{contactEmail}</span></div><div className="spec-row"><span className="spec-label">Documents</span><span className="spec-value">{uploadedDocuments.length} uploaded</span></div>{uploadedDocuments.map((doc) => <div key={doc.key} className="text-xs text-ink-secondary mt-1">{doc.fileName}</div>)}</div>
          <div className="flex justify-between border-t border-stroke pt-5"><Button variant="secondary" onClick={() => setStep(2)}>← Back</Button><Button loading={loading} onClick={handleSubmit}>Submit RFQ</Button></div>
        </div>}

        {step === 'confirmed' && <div className="text-center py-4"><span className="material-symbols-outlined text-5xl text-success block mb-4" aria-hidden="true">check_circle</span><h2 className="text-2xl font-medium mb-2">Submission Received</h2><div className="section-label mb-2">RFQ Tracking ID</div><div className="text-3xl font-medium tracking-tight mb-6">{trackingId || 'RFQ'}</div><p className="text-sm text-ink-secondary mb-6">Your request and {uploadedDocuments.length} attachment(s) were submitted. Keep this reference for your records.</p><div className="flex flex-col sm:flex-row gap-3 justify-center"><Button variant="secondary" onClick={onClose}>Close</Button><a href={PORTAL_URL} className="inline-flex items-center justify-center px-4 py-2 border border-ink-primary text-sm">Access Partner Portal →</a></div></div>}
      </div>
    </div>
  )
}
