'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Badge, SectionHeader, FieldLabel, TextInput, SelectInput, TextArea, PrimaryButton, SecondaryButton, Spinner } from '@/components/ui';
import { colors } from '@/styles/tokens';
import type { PortalUser } from '@/types';
const C = colors;
const STEPS = ['Non-Conformance ID', 'Root Cause Analysis', 'Action Plan'];

export default function CARDetailClient({ user, car: initialCar }: { user: PortalUser; car: any }) {
  const { mob } = useBreakpoint();
  const router = useRouter();
  const [car, setCar] = useState(initialCar);
  const [step, setStep] = useState(car.currentStep ?? 1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ why1: car.why1??'', rc: car.rootCause??'', d6: car.correctiveActions??'', d7: car.preventiveActions??'' });
  const set = (k: string) => (e: any) => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/car/${car.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ why1: form.why1, rootCause: form.rc, correctiveActions: form.d6, preventiveActions: form.d7, currentStep: step, status: step === 3 ? 'PENDING_REVIEW' : 'IN_PROGRESS' }) });
      if (step === 3) router.push('/car');
      else setStep((s: number) => s + 1);
    } finally { setSaving(false); }
  };
  const pad = mob ? 14 : 26;
  return (
    <div style={{ padding: pad, maxWidth: 860, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => router.push('/car')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 13, fontFamily: "'Inter', sans-serif", marginBottom: 16 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span> All CARs
        </button>
        <SectionHeader eyebrow={car.referenceId} title={STEPS[step - 1]} mob={mob} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        <Badge s={car.status.replace('_',' ')} /><Badge s={car.severity} />
      </div>
      <div style={{ display: 'flex', marginBottom: 22 }}>
        {STEPS.map((s, i) => { const n=i+1, dn=step>n, ac=step===n;
          return <div key={n} style={{ flex:1, paddingRight: i<STEPS.length-1?10:0 }}>
            <div style={{ height: 3, background: dn?C.green:ac?C.textDark:C.borderLight, marginBottom: 5 }} />
            <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: ac?C.textDark:dn?C.green:C.textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>D{n+1} — {s.split(' ')[0]}</div>
          </div>;
        })}
      </div>
      <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}`, padding: mob?14:22, marginBottom: 18 }}>
        {step === 1 && <div style={{ display: 'grid', gridTemplateColumns: mob?'1fr':'1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1/-1' }}><FieldLabel>Non-Conforming Part</FieldLabel><TextInput value={car.nonConformingPart} readOnly /></div>
          <div style={{ gridColumn: '1/-1' }}><FieldLabel>Deviation (D2)</FieldLabel><TextArea value={car.deviation} onChange={() => {}} rows={3} /></div>
          <div><FieldLabel>Affected Qty</FieldLabel><TextInput value={String(car.affectedQty)} readOnly /></div>
          <div><FieldLabel>Detected By</FieldLabel><TextInput value={car.detectedBy} readOnly /></div>
        </div>}
        {step === 2 && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: 12, background: C.surfaceLow, border: `1px solid ${C.borderLight}` }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, textTransform: 'uppercase' as const }}>D5 — Root Cause Analysis</div>
          </div>
          <div><FieldLabel required>Why 1 — Initial Observation</FieldLabel><TextArea value={form.why1} onChange={set('why1')} placeholder="What immediately caused the nonconformance?" rows={3} /></div>
          <div><FieldLabel required>Verified Root Cause (D5)</FieldLabel><TextArea value={form.rc} onChange={set('rc')} placeholder="The verified root cause is..." rows={4} /></div>
        </div>}
        {step === 3 && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><FieldLabel required>D6 — Permanent Corrective Actions</FieldLabel><TextArea value={form.d6} onChange={set('d6')} placeholder="Actions implemented, responsible parties, target dates..." rows={4} /></div>
          <div><FieldLabel>D7 — Preventive Actions</FieldLabel><TextArea value={form.d7} onChange={set('d7')} placeholder="How will this be prevented across similar processes?" rows={3} /></div>
        </div>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <SecondaryButton onClick={() => setStep((s: number) => Math.max(1, s-1))} disabled={step===1} icon="arrow_back">Prev</SecondaryButton>
        <PrimaryButton onClick={save} disabled={saving} icon={saving?undefined:'arrow_forward'}>
          {saving ? <><Spinner size={13} /> Saving...</> : step < 3 ? `Continue: ${STEPS[step]}` : 'Submit CAR'}
        </PrimaryButton>
      </div>
    </div>
  );
}
