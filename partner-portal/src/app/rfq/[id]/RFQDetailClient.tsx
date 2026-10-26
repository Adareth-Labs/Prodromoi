'use client';

import Link from 'next/link';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';

type RFQDetail = {
  id: string; trackingId: string; partNumber: string; partName: string; partFamily: string;
  status: string; annualVolume: number | null; targetPrice: number | null; material: string | null;
  toleranceClass: string | null; drawingRef: string | null; requiredBy: string | null; notes: string | null;
  createdAt: string; submittedAt: string | null;
  documents: { id: string; fileName: string; contentType: string; sizeBytes: number; uploadedAt: string }[];
};

export default function RFQDetailClient({ rfq }: { rfq: RFQDetail }) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const download = async (documentId: string) => {
    setDownloadingId(documentId); setError('');
    try {
      const response = await apiFetch<{ data?: { downloadUrl?: string } }>(`/v1/rfq/${encodeURIComponent(rfq.id)}/documents/${encodeURIComponent(documentId)}/download`);
      if (!response.data?.downloadUrl) throw new Error('The API did not return a download URL.');
      window.location.assign(response.data.downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download the document.');
    } finally { setDownloadingId(null); }
  };
  const date = (value: string | null) => value ? new Date(value).toLocaleDateString() : '—';
  const field = (label: string, value: string | number | null | undefined) => (
    <div key={label} style={{ padding: 14, border: '1px solid #e5e7eb' }}>
      <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#111827', overflowWrap: 'anywhere' }}>{value ?? '—'}</div>
    </div>
  );
  return <main style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 20px', color: '#111827' }}>
    <Link href="/rfq" style={{ display: 'inline-block', marginBottom: 18, color: '#4b5563' }}>← All RFQs</Link>
    <header style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 18, marginBottom: 22 }}>
      <div style={{ fontSize: 11, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Request for quotation</div>
      <h1 style={{ fontSize: 28, fontWeight: 650, margin: '8px 0' }}>{rfq.trackingId}</h1>
      <p style={{ color: '#4b5563' }}>{rfq.partName || rfq.partFamily || rfq.partNumber} · Status: <strong>{rfq.status.replace(/_/g, ' ')}</strong></p>
    </header>
    {error && <div role="alert" style={{ padding: 12, marginBottom: 16, border: '1px solid #b91c1c', color: '#b91c1c', background: '#fef2f2' }}>{error}</div>}
    <section aria-labelledby="rfq-details-title">
      <h2 id="rfq-details-title" style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Specifications</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
        {field('Part number', rfq.partNumber)}{field('Annual volume', rfq.annualVolume?.toLocaleString() ?? null)}
        {field('Target price', rfq.targetPrice == null ? null : rfq.targetPrice.toLocaleString(undefined, { style: 'currency', currency: 'EUR' }))}
        {field('Material', rfq.material)}{field('Tolerance class', rfq.toleranceClass)}{field('Drawing reference', rfq.drawingRef)}
        {field('Required by', date(rfq.requiredBy))}{field('Created', date(rfq.createdAt))}{field('Submitted', date(rfq.submittedAt))}
      </div>
      {rfq.notes && <div style={{ marginTop: 12, padding: 14, border: '1px solid #e5e7eb' }}><h3 style={{ fontWeight: 600, marginBottom: 6 }}>Notes</h3><p style={{ whiteSpace: 'pre-wrap' }}>{rfq.notes}</p></div>}
    </section>
    <section aria-labelledby="rfq-documents-title" style={{ marginTop: 28 }}>
      <h2 id="rfq-documents-title" style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Documents ({rfq.documents.length})</h2>
      {rfq.documents.length === 0 ? <p style={{ color: '#6b7280' }}>No documents are attached to this RFQ.</p> : <div style={{ border: '1px solid #e5e7eb' }}>
        {rfq.documents.map((doc) => <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 14, borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ minWidth: 0 }}><div style={{ overflowWrap: 'anywhere', fontWeight: 500 }}>{doc.fileName}</div><div style={{ fontSize: 12, color: '#6b7280' }}>{doc.contentType} · {(doc.sizeBytes / 1024 / 1024).toFixed(2)} MB · Uploaded {date(doc.uploadedAt)}</div></div>
          <button type="button" disabled={downloadingId === doc.id} onClick={() => void download(doc.id)} style={{ border: '1px solid #9ca3af', padding: '7px 10px', whiteSpace: 'nowrap', cursor: downloadingId === doc.id ? 'wait' : 'pointer' }}>{downloadingId === doc.id ? 'Preparing…' : 'Download'}</button>
        </div>)}
      </div>}
    </section>
  </main>;
}
