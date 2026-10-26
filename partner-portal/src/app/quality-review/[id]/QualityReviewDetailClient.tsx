'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { colors } from '@/styles/tokens';

const C = colors;

export interface ReviewDetailCAR {
  id: string;
  carId: string;
  supplierId: string;
  status: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  deviationDescription: string;
  partId?: string | null;
  batchNumber?: string | null;
  lotNumber?: string | null;
  affectedQty?: number | null;
  detectedBy?: string | null;
  why1?: string | null;
  rootCause?: string | null;
  rootCauseMethod?: string | null;
  correctiveAction?: string | null;
  preventiveAction?: string | null;
  actionDueDate?: string | null;
  reviewerNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  supplier: { id: string; vendorId: string; companyName: string; contactEmail: string };
  documents: { id: string; fileName: string; sizeBytes: number; uploadedAt: string }[];
}

export default function QualityReviewDetailClient({ car }: { car: ReviewDetailCAR }) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState<'APPROVE' | 'REQUEST_CHANGES' | 'DOWNLOAD' | null>(null);
  const [error, setError] = useState('');
  const awaitingReview = car.status === 'VERIFICATION_PENDING';

  const decide = async (decision: 'APPROVE' | 'REQUEST_CHANGES') => {
    const normalizedNotes = notes.trim();
    if (normalizedNotes.length < 10) {
      setError('Enter at least 10 characters explaining the decision before submitting.');
      return;
    }
    setError('');
    setBusy(decision);
    try {
      await apiFetch(`/v1/quality/reviewer/cars/${encodeURIComponent(car.id)}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, notes: normalizedNotes }),
      });
      router.push(`/quality-review?decision=${decision.toLowerCase()}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The reviewer decision could not be saved.');
    } finally {
      setBusy(null);
    }
  };

  const download = async (documentId: string) => {
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    setError('');
    setBusy('DOWNLOAD');
    try {
      const result = await apiFetch<{ data: { downloadUrl: string } }>(`/v1/quality/reviewer/cars/${encodeURIComponent(car.id)}/documents/${encodeURIComponent(documentId)}/download`);
      if (tab) tab.location.href = result.data.downloadUrl;
      else throw new Error('Your browser blocked the document tab. Allow pop-ups and try again.');
    } catch (cause) {
      tab?.close();
      setError(cause instanceof Error ? cause.message : 'Could not prepare the download.');
    } finally {
      setBusy(null);
    }
  };

  const field = (label: string, value?: string | number | null) => (
    <div style={{ padding: 14, border: `1px solid ${C.borderLight}`, background: C.surfaceCard }}>
      <div style={{ color: C.textFaint, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.11em', marginBottom: 7 }}>{label}</div>
      <div style={{ color: value ? C.textDark : C.textFaint, fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{value === null || value === undefined || value === '' ? 'Not provided' : String(value)}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Link href="/quality-review" style={{ display: 'inline-block', color: C.textMuted, textDecoration: 'none', fontSize: 12, marginBottom: 18 }}>← Back to verification queue</Link>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <div style={{ color: C.textFaint, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{car.carId} · {car.severity}</div>
          <h1 style={{ fontSize: 28, margin: 0, letterSpacing: '-0.03em' }}>Corrective action review</h1>
          <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 0 }}>{car.supplier.companyName} · {car.supplier.vendorId}</p>
        </div>
        <span style={{ border: `1px solid ${awaitingReview ? C.amber : C.borderLight}`, padding: '6px 9px', color: awaitingReview ? C.amber : C.textMuted, fontSize: 10 }}>{car.status.replaceAll('_', ' ')}</span>
      </div>

      {error && <div role="alert" style={{ padding: 12, marginBottom: 16, color: C.red, background: C.redBg, border: `1px solid ${C.red}`, fontSize: 12 }}>{error}</div>}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%, 280px),1fr))', gap: 12, marginBottom: 20 }} aria-label="CAR and supplier details">
        {field('Non-conforming part', car.partId)}
        {field('Affected quantity', car.affectedQty)}
        {field('Batch / lot number', [car.batchNumber, car.lotNumber].filter(Boolean).join(' / '))}
        {field('Detected by', car.detectedBy)}
        <div style={{ gridColumn: '1 / -1' }}>{field('Deviation description', car.deviationDescription)}</div>
        <div style={{ gridColumn: '1 / -1' }}>{field('Initial observation / Why 1', car.why1)}</div>
        <div style={{ gridColumn: '1 / -1' }}>{field('Root cause', car.rootCause)}</div>
        <div style={{ gridColumn: '1 / -1' }}>{field('Corrective action plan', car.correctiveAction)}</div>
        <div style={{ gridColumn: '1 / -1' }}>{field('Preventive action plan', car.preventiveAction)}</div>
        {car.reviewerNotes && <div style={{ gridColumn: '1 / -1' }}>{field('Previous reviewer feedback', car.reviewerNotes)}</div>}
        {car.actionDueDate && field('Action due date', new Date(car.actionDueDate).toLocaleDateString())}
      </section>

      <section style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}`, marginBottom: 20 }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.borderLight}`, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textFaint }}>Supporting documents</div>
        {car.documents.length === 0 && <p style={{ padding: 16, color: C.textMuted, fontSize: 12 }}>No documents are attached to this CAR.</p>}
        {car.documents.map((doc, index) => <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 14, borderBottom: index === car.documents.length - 1 ? 'none' : `1px solid ${C.borderLight}` }}>
          <div><div style={{ fontSize: 12, fontWeight: 600 }}>{doc.fileName}</div><div style={{ color: C.textFaint, fontSize: 10, marginTop: 4 }}>{Math.max(1, Math.round(doc.sizeBytes / 1024))} KB · Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</div></div>
          <button type="button" disabled={busy !== null} onClick={() => void download(doc.id)} style={{ border: `1px solid ${C.borderMid}`, background: 'transparent', padding: '7px 10px', cursor: busy ? 'wait' : 'pointer', fontSize: 11, color: C.textDark }}>Download</button>
        </div>)}
      </section>

      {awaitingReview ? <section style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}`, padding: 18 }}>
        <h2 style={{ fontSize: 17, marginTop: 0 }}>Reviewer decision</h2>
        <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6 }}>Notes are required for approval and for requests to revise the action plan. If changes are requested, the CAR returns to the supplier for further action and verification.</p>
        <label htmlFor="review-notes" style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 7 }}>Decision notes (minimum 10 characters)</label>
        <textarea id="review-notes" value={notes} onChange={event => setNotes(event.target.value)} maxLength={5000} rows={5} placeholder="Record the evidence reviewed, findings, and the reason for your decision…" style={{ display: 'block', width: '100%', padding: 12, border: `1px solid ${C.borderMid}`, background: C.surface, color: C.textDark, resize: 'vertical', boxSizing: 'border-box', font: '13px Inter, sans-serif' }} />
        <div style={{ color: C.textFaint, textAlign: 'right', fontSize: 10, marginTop: 4 }}>{notes.trim().length}/5000</div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 16 }}>
          <button type="button" disabled={busy !== null} onClick={() => void decide('REQUEST_CHANGES')} style={{ border: `1px solid ${C.amber}`, background: C.amberBg, color: '#92400e', padding: '10px 14px', cursor: busy ? 'wait' : 'pointer', fontSize: 12 }}>{busy === 'REQUEST_CHANGES' ? 'Saving…' : 'Request changes'}</button>
          <button type="button" disabled={busy !== null} onClick={() => void decide('APPROVE')} style={{ border: `1px solid ${C.green}`, background: C.green, color: '#fff', padding: '10px 14px', cursor: busy ? 'wait' : 'pointer', fontSize: 12 }}>{busy === 'APPROVE' ? 'Approving…' : 'Approve and close CAR'}</button>
        </div>
      </section> : <section role="status" style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}`, padding: 18 }}>
        <h2 style={{ fontSize: 17, marginTop: 0 }}>This CAR is not awaiting review</h2>
        <p style={{ color: C.textMuted, fontSize: 12 }}>Its current status is {car.status.replaceAll('_', ' ')}. Decisions are only available while a CAR is in VERIFICATION_PENDING.</p>
        {car.reviewerNotes && field('Latest reviewer notes', car.reviewerNotes)}
      </section>}
    </div>
  );
}
