import Link from 'next/link';
import { requirePortalUser } from '@/lib/auth';
import { apiFetchServer } from '@/lib/api-server';
import { toPortalCAR, toPortalRFQ, toPortalScorecardPeriod } from '@/lib/mappers';
import { Badge, KPICard, SectionHeader } from '@/components/ui';
import { colors } from '@/styles/tokens';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };
const C = colors;

const RECENT_RFQS = 5;
const RECENT_CARS = 3;

export default async function DashboardPage() {
  const user = await requirePortalUser();
  const [rfqResponse, carResponse, scoreResponse] = await Promise.all([
    apiFetchServer<any>('/v1/rfq').catch((err) => { console.error('[DashboardPage] RFQ API failed', err); return { data: [] }; }),
    apiFetchServer<any>('/v1/quality').catch((err) => { console.error('[DashboardPage] CAR API failed', err); return { data: [] }; }),
    apiFetchServer<any>('/v1/suppliers/me/scorecard/periods').catch((err) => { console.error('[DashboardPage] scorecard API failed', err); return { data: [] }; }),
  ]);

  const latestScore = scoreResponse.data?.[0] ? toPortalScorecardPeriod(scoreResponse.data[0]) : undefined;
  const rfqs = (rfqResponse.data ?? []).slice(0, RECENT_RFQS).map(toPortalRFQ);
  const cars = (carResponse.data ?? []).slice(0, RECENT_CARS).map(toPortalCAR);

  return (
    <div style={{ padding: 'clamp(14px,3vw,28px)', maxWidth: 1300, margin: '0 auto' }}>
      <SectionHeader eyebrow={`Welcome back, ${user.name.split(' ')[0]}`} title="Partner Dashboard" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
        <KPICard label="Quality (PPM)"  value={latestScore?.qualityPPM ?? '—'} trend="↓ 12%" ok={true}  sub="vs Target 100"  icon="verified"       />
        <KPICard label="Delivery OTD"   value={latestScore ? `${latestScore.deliveryOTD}` : '—'} unit="%" trend="↑ 0.5%" ok={true} sub="vs Target 98%" icon="local_shipping" />
        <KPICard label="Active RFQs"    value={rfqs.length} ok={true}  sub="across all statuses" icon="description"   />
        <KPICard label="Open CARs"      value={cars.filter(c=>c.status!=='CLOSED').length} ok={cars.filter(c=>c.status!=='CLOSED').length===0} sub="requiring action" icon="report_problem" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* RFQ list */}
          <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}` }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: C.textDark, fontFamily: "'Hanken Grotesk',sans-serif" }}>Recent RFQs</h3>
              <Link href="/rfq" style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: C.textFaint, textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>VIEW ALL →</Link>
            </div>
            {rfqs.length === 0
              ? <div style={{ padding: '32px 20px', textAlign: 'center', color: C.textFaint, fontSize: 13 }}>No RFQ submissions yet.</div>
              : rfqs.map((r, i) => (
                <div key={r.id} style={{ padding: '13px 20px', borderBottom: i < rfqs.length-1 ? `1px solid ${C.borderLight}` : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: C.textFaint }}>{r.referenceId}</span>
                      <Badge s={r.status} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.partName}</div>
                    <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>{r.annualVolume.toLocaleString()} units/yr</div>
                  </div>
                </div>
              ))
            }
            {user.tier >= 2 && (
              <div style={{ padding: '12px 20px', borderTop: rfqs.length > 0 ? `1px solid ${C.borderLight}` : 'none' }}>
                <Link href="/rfq/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: C.textDark, textDecoration: 'none', fontFamily: "'Hanken Grotesk',sans-serif" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span> New RFQ Submission
                </Link>
              </div>
            )}
          </div>

          {/* CARs */}
          {cars.length > 0 && (
            <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}` }}>
              <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: C.textDark, fontFamily: "'Hanken Grotesk',sans-serif" }}>Open CARs</h3>
                <Link href="/car" style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: C.textFaint, textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>VIEW ALL →</Link>
              </div>
              {cars.filter(c => c.status !== 'CLOSED').map((car, i, arr) => (
                <div key={car.id} style={{ padding: '13px 20px', borderBottom: i < arr.length-1 ? `1px solid ${C.borderLight}` : 'none', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 3, alignSelf: 'stretch', background: C.amber, flexShrink: 0, minHeight: 14 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: C.textFaint }}>{car.referenceId}</span>
                      <Badge s={car.severity} />
                    </div>
                    <div style={{ fontSize: 12, color: C.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{car.deviation}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: C.textDark, padding: 22 }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: `${C.blue}77`, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Scorecard Rating</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
              <div style={{ fontSize: 72, fontFamily: "'Hanken Grotesk',sans-serif", fontWeight: 900, color: C.blue, lineHeight: 1 }}>{latestScore?.overallGrade ?? '—'}</div>
              <div>
                <div style={{ fontSize: 12, color: C.blue, marginBottom: 8 }}>{user.company}</div>
                {user.tier === 3 && <Badge s="Strategic" />}
              </div>
            </div>
          </div>
          <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}`, padding: 18 }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>Account Details</div>
            {([['Vendor ID',user.vendorId],['Tier',{1:'TIER 01 — Basic',2:'TIER 02 — Qualified',3:'TIER 03 — Strategic'}[user.tier]],['Contact',user.name],['Email',user.email]] as [string,string][]).map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${C.borderLight}`, gap: 10 }}>
                <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: C.textFaint, flexShrink: 0 }}>{k}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: C.textDark, textAlign: 'right', wordBreak: 'break-word' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}