'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Badge, SectionHeader, FieldLabel, TextInput, TextArea, PrimaryButton, SecondaryButton, Spinner } from '@/components/ui'
import { colors } from '@/styles/tokens'
import { apiFetch } from '@/lib/api'
import type { PortalUser } from '@/types'

const C = colors
const STEPS = ['Non-Conformance ID', 'Root Cause Analysis', 'Action Plan']

type CARWorkflowStatus = 'OPEN' | 'ROOT_CAUSE_IDENTIFIED' | 'ACTION_PLAN_SUBMITTED' | 'VERIFICATION_PENDING' | 'CLOSED' | 'ESCALATED'

type CARView = {
  id: string
  referenceId: string
  nonConformingPart: string
  deviation: string
  affectedQty: number
  detectedBy: string
  why1?: string
  rootCause?: string
  correctiveActions?: string
  preventiveActions?: string
  closureNotes?: string
  reviewerNotes?: string
  severity: string
  status: string
  workflowStatus?: CARWorkflowStatus
  currentStep: number
  openedAt: string
  closedAt?: string
}

export default function CARDetailClient({ user: _user, car: initialCar }: { user: PortalUser; car: CARView }) {
  const { mob } = useBreakpoint()
  const router = useRouter()
  const [car, setCar] = useState(initialCar)
  const [step, setStep] = useState(Math.min(3, Math.max(1, initialCar.currentStep ?? 1)))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    why1: initialCar.why1 ?? '',
    rc: initialCar.rootCause ?? '',
    d6: initialCar.correctiveActions ?? '',
    d7: initialCar.preventiveActions ?? '',
  })
  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLTextAreaElement>) =>
    setForm((previous) => ({ ...previous, [key]: event.target.value }))

  const applyServerCAR = (raw: any) => {
    const statusMap: Record<string, string> = {
      OPEN: 'OPEN', ROOT_CAUSE_IDENTIFIED: 'IN_PROGRESS', ACTION_PLAN_SUBMITTED: 'IN_PROGRESS',
      VERIFICATION_PENDING: 'PENDING_REVIEW', CLOSED: 'CLOSED', ESCALATED: 'IN_PROGRESS',
    }
    setCar((previous) => ({
      ...previous,
      workflowStatus: raw.status,
      status: statusMap[raw.status] ?? previous.status,
      currentStep: raw.currentStep ?? previous.currentStep,
      why1: raw.why1 ?? previous.why1,
      rootCause: raw.rootCause ?? previous.rootCause,
      correctiveActions: raw.correctiveAction ?? previous.correctiveActions,
      preventiveActions: raw.preventiveAction ?? previous.preventiveActions,
      closureNotes: raw.closureNotes ?? previous.closureNotes,
      reviewerNotes: raw.reviewerNotes ?? previous.reviewerNotes,
      closedAt: raw.closedAt ?? previous.closedAt,
    }))
  }

  const save = async () => {
    setError('')
    if (step === 1) {
      // Step 1 is a read-only record review; the first state transition belongs
      // to the root-cause submission in step 2.
      setStep(2)
      return
    }
    if (step === 2 && (form.why1.trim().length < 10 || form.rc.trim().length < 10)) {
      setError('Enter the initial observation and verified root cause (at least 10 characters each).')
      return
    }
    if (step === 3 && form.d6.trim().length < 10) {
      setError('Describe the corrective action in at least 10 characters before requesting verification.')
      return
    }

    setSaving(true)
    try {
      if (step === 2) {
        const response = await apiFetch<{ data?: any }>(`/v1/quality/${encodeURIComponent(car.id)}/transition`, {
          method: 'POST',
          body: JSON.stringify({
            event: 'IDENTIFY_ROOT_CAUSE', why1: form.why1.trim(), rootCause: form.rc.trim(), currentStep: 3,
          }),
        })
        if (!response.data) throw new Error('API did not return the updated CAR.')
        applyServerCAR(response.data)
        setStep(3)
        return
      }

      // The plan submission and verification request are two separate state
      // transitions. If the second call fails, the first status is retained and
      // a retry only requests verification rather than resubmitting the plan.
      let workflowStatus = car.workflowStatus
      if (workflowStatus === 'ROOT_CAUSE_IDENTIFIED' || workflowStatus === 'ESCALATED') {
        const plan = await apiFetch<{ data?: any }>(`/v1/quality/${encodeURIComponent(car.id)}/transition`, {
          method: 'POST',
          body: JSON.stringify({
            event: 'SUBMIT_ACTION_PLAN', correctiveAction: form.d6.trim(),
            preventiveAction: form.d7.trim() || undefined, currentStep: 3,
          }),
        })
        if (!plan.data) throw new Error('API did not return the saved action plan.')
        applyServerCAR(plan.data)
        workflowStatus = plan.data.status
      }
      if (workflowStatus !== 'ACTION_PLAN_SUBMITTED') {
        throw new Error('This CAR is not ready for verification submission. Reload the page and check its current status.')
      }
      const verification = await apiFetch<{ data?: any }>(`/v1/quality/${encodeURIComponent(car.id)}/transition`, {
        method: 'POST', body: JSON.stringify({ event: 'REQUEST_VERIFICATION', correctiveAction: form.d6.trim(), preventiveAction: form.d7.trim() || undefined, currentStep: 3 }),
      })
      if (!verification.data) throw new Error('API did not confirm the verification request.')
      applyServerCAR(verification.data)
      router.push('/car')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the CAR. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const pad = mob ? 14 : 26
  const awaitingReviewer = car.workflowStatus === 'VERIFICATION_PENDING' || car.workflowStatus === 'CLOSED'
  return (
    <div style={{ padding: pad, maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => router.push('/car')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 13, fontFamily: "'Inter', sans-serif", marginBottom: 16 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span> All CARs
        </button>
        <SectionHeader eyebrow={car.referenceId} title={awaitingReviewer ? 'Reviewer Status' : STEPS[step - 1]} mob={mob} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        <Badge s={car.status.replace('_', ' ')} /><Badge s={car.severity} />
      </div>
      {error && <div role="alert" style={{ padding: 12, marginBottom: 16, border: '1px solid #b91c1c', color: '#b91c1c', background: '#fef2f2' }}>{error}</div>}
      {car.reviewerNotes && car.workflowStatus === 'ACTION_PLAN_SUBMITTED' && (
        <div role="status" style={{ padding: 14, marginBottom: 16, border: '1px solid #d97706', background: '#fffbeb', color: '#78350f' }}>
          <strong style={{ display: 'block', marginBottom: 5 }}>Reviewer requested changes</strong>
          <span style={{ fontSize: 13, lineHeight: 1.6 }}>{car.reviewerNotes}</span>
        </div>
      )}

      {awaitingReviewer ? (
        <div role="status" style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}`, padding: mob ? 16 : 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{car.workflowStatus === 'CLOSED' ? 'CAR closed' : 'Verification requested'}</h2>
          <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.6 }}>
            {car.workflowStatus === 'CLOSED'
              ? 'This corrective action report has been closed by an authorized reviewer.'
              : 'Your corrective-action plan has been submitted. An internal quality reviewer must verify the submission before the CAR can be closed.'}
          </p>
          {car.workflowStatus === 'CLOSED' && car.closureNotes && (
            <div style={{ marginTop: 14, padding: 12, border: `1px solid ${C.borderLight}`, background: C.surfaceLow }}>
              <strong style={{ display: 'block', fontSize: 11, marginBottom: 5 }}>Reviewer closure notes</strong>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{car.closureNotes}</p>
            </div>
          )}
          <div style={{ marginTop: 18 }}><SecondaryButton onClick={() => router.push('/car')} icon="arrow_back">Back to CARs</SecondaryButton></div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', marginBottom: 22 }}>
            {STEPS.map((label, index) => {
              const number = index + 1
              const done = step > number
              const active = step === number
              return <div key={label} style={{ flex: 1, paddingRight: index < STEPS.length - 1 ? 10 : 0 }}>
                <div style={{ height: 3, background: done ? C.green : active ? C.textDark : C.borderLight, marginBottom: 5 }} />
                <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: active ? C.textDark : done ? C.green : C.textFaint, textTransform: 'uppercase', letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</div>
              </div>
            })}
          </div>
          <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}`, padding: mob ? 14 : 22, marginBottom: 18 }}>
            {step === 1 && <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1/-1' }}><FieldLabel>Non-Conforming Part</FieldLabel><TextInput value={car.nonConformingPart} readOnly /></div>
              <div style={{ gridColumn: '1/-1' }}><FieldLabel>Deviation (D2)</FieldLabel><TextArea value={car.deviation} rows={3} readOnly /></div>
              <div><FieldLabel>Affected Qty</FieldLabel><TextInput value={String(car.affectedQty)} readOnly /></div>
              <div><FieldLabel>Detected By</FieldLabel><TextInput value={car.detectedBy} readOnly /></div>
            </div>}
            {step === 2 && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 12, background: C.surfaceLow, border: `1px solid ${C.borderLight}` }}><div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, textTransform: 'uppercase' }}>D4/D5 — Root Cause Analysis</div></div>
              <div><FieldLabel required>Why 1 — Initial Observation</FieldLabel><TextArea value={form.why1} onChange={set('why1')} placeholder="What immediately caused the nonconformance?" rows={3} /></div>
              <div><FieldLabel required>Verified Root Cause</FieldLabel><TextArea value={form.rc} onChange={set('rc')} placeholder="Describe the verified root cause..." rows={4} /></div>
            </div>}
            {step === 3 && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div><FieldLabel required>D6 — Permanent Corrective Actions</FieldLabel><TextArea value={form.d6} onChange={set('d6')} placeholder="Actions implemented, responsible parties, target dates..." rows={4} /></div>
              <div><FieldLabel>D7 — Preventive Actions</FieldLabel><TextArea value={form.d7} onChange={set('d7')} placeholder="How will this be prevented across similar processes?" rows={3} /></div>
            </div>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <SecondaryButton onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1 || saving} icon="arrow_back">Prev</SecondaryButton>
            <PrimaryButton onClick={() => void save()} disabled={saving} icon={saving ? undefined : 'arrow_forward'}>
              {saving ? <><Spinner size={13} /> Saving...</> : step === 1 ? 'Continue to Root Cause' : step === 2 ? 'Save Root Cause' : 'Submit Plan for Verification'}
            </PrimaryButton>
          </div>
        </>
      )}
    </div>
  )
}
