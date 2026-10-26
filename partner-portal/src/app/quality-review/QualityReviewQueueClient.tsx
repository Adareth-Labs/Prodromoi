'use client';

import Link from 'next/link';
import { colors } from '@/styles/tokens';

const C = colors;

export interface ReviewQueueCAR {
  id: string;
  carId: string;
  status: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  partId?: string | null;
  deviationDescription: string;
  affectedQty?: number | null;
  correctiveAction?: string | null;
  preventiveAction?: string | null;
  createdAt: string;
  updatedAt: string;
  supplier: { id: string; vendorId: string; companyName: string; contactEmail: string };
  documents: { id: string; fileName: string; sizeBytes: number; uploadedAt: string }[];
}

export default function QualityReviewQueueClient({ initialCars, loadError }: { initialCars: ReviewQueueCAR[]; loadError: string }) {
  const sorted = [...initialCars].sort((a, b) => {
    const rank = { CRITICAL: 0, MAJOR: 1, MINOR: 2 };
    return rank[a.severity] - rank[b.severity] || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: C.textFaint, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 7 }}>Corrective action management</div>
        <h1 style={{ margin: 0, fontSize: 30, letterSpacing: '-0.03em' }}>Verification queue</h1>
        <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.6, maxWidth: 760 }}>Review supplier root-cause analysis, corrective actions and supporting documents. Record a decision with notes for every review. Only authorized internal reviewers can approve closure.</p>
      </div>

      {loadError && <div role="alert" style={{ padding: 14, marginBottom: 16, border: `1px solid ${C.red}`, background: C.redBg, color: C.red }}>{loadError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 22 }}>
        <div style={{ padding: 18, background: C.surfaceCard, border: `1px solid ${C.borderLight}` }}>
          <div style={{ color: C.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Awaiting verification</div>
          <div style={{ marginTop: 7, fontSize: 28, fontWeight: 700 }}>{sorted.length}</div>
        </div>
        <div style={{ padding: 18, background: C.surfaceCard, border: `1px solid ${C.borderLight}` }}>
          <div style={{ color: C.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Critical severity</div>
          <div style={{ marginTop: 7, fontSize: 28, fontWeight: 700, color: sorted.some(car => car.severity === 'CRITICAL') ? C.red : C.textDark }}>{sorted.filter(car => car.severity === 'CRITICAL').length}</div>
        </div>
      </div>

      <section aria-label="CARs awaiting verification" style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}` }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.borderLight}`, color: C.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace" }}>Pending decisions</div>
        {sorted.length === 0 && !loadError && <div style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>The verification queue is clear</div>
          <p style={{ color: C.textMuted, fontSize: 13 }}>No corrective action reports are currently awaiting internal review.</p>
        </div>}
        {sorted.map((car, index) => (
          <div key={car.id} style={{ padding: '18px', borderBottom: index === sorted.length - 1 ? 'none' : `1px solid ${C.borderLight}`, display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: 4, alignSelf: 'stretch', minHeight: 40, background: car.severity === 'CRITICAL' ? C.red : car.severity === 'MAJOR' ? C.amber : C.blueDeep }} />
            <div style={{ flex: 1, minWidth: 230 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                <strong style={{ fontSize: 13 }}>{car.carId}</strong>
                <span style={{ fontSize: 9, border: `1px solid ${car.severity === 'CRITICAL' ? C.red : C.borderLight}`, color: car.severity === 'CRITICAL' ? C.red : C.textMuted, padding: '3px 6px' }}>{car.severity}</span>
                <span style={{ fontSize: 10, color: C.textFaint }}>Submitted {new Date(car.updatedAt).toLocaleDateString()}</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{car.supplier.companyName} <span style={{ color: C.textFaint, fontWeight: 400, fontSize: 11 }}>({car.supplier.vendorId})</span></div>
              <div style={{ color: C.textMuted, fontSize: 12, marginTop: 5 }}>{car.partId || 'Part not specified'} · {car.affectedQty ?? '—'} affected units</div>
              <p style={{ color: C.textMuted, fontSize: 12, lineHeight: 1.6, margin: '7px 0 0' }}>{car.deviationDescription}</p>
              <div style={{ color: C.textFaint, fontSize: 11, marginTop: 8 }}>{car.documents.length} supporting document{car.documents.length === 1 ? '' : 's'}</div>
            </div>
            <Link href={`/quality-review/${encodeURIComponent(car.id)}`} style={{ alignSelf: 'center', padding: '9px 13px', border: `1px solid ${C.borderMid}`, color: C.textDark, fontSize: 12, textDecoration: 'none', whiteSpace: 'nowrap' }}>Review CAR <span aria-hidden="true">→</span></Link>
          </div>
        ))}
      </section>
    </div>
  );
}
