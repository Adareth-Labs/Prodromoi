'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { PortalUser } from '@/types'
import { apiFetch } from '@/lib/api'
import { colors } from '@/styles/tokens'
import { SectionHeader, FieldLabel, TextInput, TextArea, SelectInput, PrimaryButton, SecondaryButton, Spinner } from '@/components/ui'

const C = colors

export default function CARNewClient({ user: _user }: { user: PortalUser }) {
  const router = useRouter()
  const [severity, setSeverity] = useState('MAJOR')
  const [part, setPart] = useState('')
  const [deviation, setDeviation] = useState('')
  const [affectedQty, setAffectedQty] = useState('1')
  const [detectedBy, setDetectedBy] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [lotNumber, setLotNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    const qty = Number(affectedQty)
    if (part.trim().length < 1 || deviation.trim().length < 10 || !Number.isSafeInteger(qty) || qty <= 0) {
      setError('Enter the part, a deviation description of at least 10 characters, and a positive whole-number quantity.')
      return
    }
    setSaving(true)
    try {
      const response = await apiFetch<{ success: boolean; data?: { id: string } }>('/v1/quality', {
        method: 'POST',
        body: JSON.stringify({
          severity, nonConformingPart: part.trim(), deviation: deviation.trim(), affectedQty: qty,
          detectedBy: detectedBy.trim() || undefined, batchNumber: batchNumber.trim() || undefined,
          lotNumber: lotNumber.trim() || undefined,
        }),
      })
      if (!response.data?.id) throw new Error('The API did not return the new CAR identifier.')
      router.push(`/car/${encodeURIComponent(response.data.id)}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The CAR could not be created. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 26, color: C.textDark }}>
      <Link href="/car" style={{ display: 'inline-block', marginBottom: 18, color: C.textMuted }}>← All CARs</Link>
      <SectionHeader eyebrow="Quality Management" title="New Corrective Action Report" />
      <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 18 }}>Create a supplier-scoped CAR. Attachments and reviewer closure are managed in the appropriate follow-up workflows.</p>
      {error && <div role="alert" style={{ padding: 12, marginBottom: 16, border: '1px solid #b91c1c', color: '#b91c1c', background: '#fef2f2' }}>{error}</div>}
      <section style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}`, padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div><FieldLabel required>Severity</FieldLabel><SelectInput value={severity} onChange={(e: any) => setSeverity(e.target.value)} options={['MINOR', 'MAJOR', 'CRITICAL']} /></div>
        <div><FieldLabel required>Non-Conforming Part</FieldLabel><TextInput value={part} onChange={(e: any) => setPart(e.target.value)} placeholder="Part number or assembly name" /></div>
        <div><FieldLabel required>Deviation Description</FieldLabel><TextArea value={deviation} onChange={(e: any) => setDeviation(e.target.value)} placeholder="Describe the non-conformance, defect, or deviation (at least 10 characters)." rows={4} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div><FieldLabel required>Affected Quantity</FieldLabel><TextInput type="number" value={affectedQty} onChange={(e: any) => setAffectedQty(e.target.value)} /></div>
          <div><FieldLabel>Detected By</FieldLabel><TextInput value={detectedBy} onChange={(e: any) => setDetectedBy(e.target.value)} placeholder="Name or team" /></div>
          <div><FieldLabel>Batch Number</FieldLabel><TextInput value={batchNumber} onChange={(e: any) => setBatchNumber(e.target.value)} /></div>
          <div><FieldLabel>Lot Number</FieldLabel><TextInput value={lotNumber} onChange={(e: any) => setLotNumber(e.target.value)} /></div>
        </div>
      </section>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
        <SecondaryButton onClick={() => router.push('/car')} icon="arrow_back">Cancel</SecondaryButton>
        <PrimaryButton onClick={() => void submit()} disabled={saving} icon={saving ? undefined : 'arrow_forward'}>{saving ? <><Spinner size={13} /> Creating…</> : 'Create CAR'}</PrimaryButton>
      </div>
    </main>
  )
}
