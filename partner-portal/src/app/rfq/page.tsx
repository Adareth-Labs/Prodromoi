import { requirePortalUser } from '@/lib/auth';
import { apiFetchServer } from '@/lib/api-server';
import { toPortalRFQ } from '@/lib/mappers';
import Link from 'next/link';
import { Badge, KPICard, SectionHeader, RBACGate } from '@/components/ui';
import { colors } from '@/styles/tokens';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'RFQ Submissions' };
const C = colors;

export default async function RFQListPage() {
  const user = await requirePortalUser();
  const response = user.tier >= 2 ? await apiFetchServer<any>('/v1/rfq').catch((err) => {
    console.error('[RFQListPage] API request failed', err);
    return { data: [] };
  }) : { data: [] };
  const rfqs = (response.data ?? []).map(toPortalRFQ);

  const counts = {
    pending: rfqs.filter(r => r.status === 'PENDING').length,
    review: rfqs.filter(r => r.status === 'UNDER_REVIEW').length,
    approved: rfqs.filter(r => r.status === 'APPROVED').length,
  };

  return (
    <div style={{ padding: 'clamp(14px, 3vw, 28px)', maxWidth: 1100, margin: '0 auto' }}>
      <RBACGate user={user} minTier={2}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <SectionHeader eyebrow="RFQ Management" title="Submissions" />
          <Link href="/rfq/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: C.textDark, color: '#fff', textDecoration: 'none', fontSize: 13, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#fff' }}>add</span> New RFQ
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <KPICard label="Total Submissions" value={rfqs.length} ok={true} icon="description" />
          <KPICard label="Pending" value={counts.pending} ok={null} icon="pending" />
          <KPICard label="Under Review" value={counts.review} ok={null} icon="rate_review" />
          <KPICard label="Approved" value={counts.approved} ok={true} icon="check_circle" />
        </div>
        <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}` }}>
          <div style={{ padding: '13px 18px', borderBottom: `1px solid ${C.borderLight}` }}>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>All Submissions</div>
          </div>
          {rfqs.length === 0 && (
            <div style={{ padding: '52px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: C.textFaint, marginBottom: 16 }}>No RFQ submissions yet.</div>
              <Link href="/rfq/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: C.textDark, color: '#fff', textDecoration: 'none', fontSize: 13, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span> Submit First RFQ
              </Link>
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            {rfqs.length > 0 && (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                <thead>
                  <tr style={{ background: C.surfaceLow }}>
                    {['Reference', 'Part Name', 'Part No.', 'Volume', 'Status', 'Submitted', 'Docs', ''].map(h => (
                      <th key={h} style={{ padding: '9px 14px', fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, textAlign: 'left', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: `1px solid ${C.borderLight}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rfqs.map((r, i) => (
                    <tr key={r.id} style={{ borderBottom: i < rfqs.length - 1 ? `1px solid ${C.borderLight}` : 'none' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 3, height: 24, background: r.status === 'APPROVED' ? C.green : r.status === 'UNDER_REVIEW' ? C.amber : C.borderLight, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, whiteSpace: 'nowrap' }}>{r.referenceId}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500, color: C.textDark, maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.partName}</div>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.textMuted, whiteSpace: 'nowrap' }}>{r.partNumber}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: C.textMuted, whiteSpace: 'nowrap' }}>{r.annualVolume.toLocaleString()}/yr</td>
                      <td style={{ padding: '12px 14px' }}><Badge s={r.status} /></td>
                      <td style={{ padding: '12px 14px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, whiteSpace: 'nowrap' }}>{new Date(r.submittedAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 14px', fontSize: 12, color: C.textFaint }}>{r.documents.length}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textFaint }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </RBACGate>
    </div>
  );
}
