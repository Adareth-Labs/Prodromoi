'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Badge, SectionHeader } from '@/components/ui';
import { colors } from '@/styles/tokens';
import type { PortalUser } from '@/types';
const C = colors;

export default function CARClient({ user: _user, initialCARs }: { user: PortalUser; initialCARs: any[] }) {
  const { mob, tab } = useBreakpoint();
  const [cars] = useState(initialCARs);
  const pad = mob ? 14 : tab ? 20 : 26;
  const open = cars.filter(c => c.status !== 'CLOSED').length;

  return (
    <div style={{ padding: pad, maxWidth: 1200, margin: '0 auto' }}>
      <SectionHeader eyebrow="Corrective Action Requests" title="CAR Workflow" mob={mob} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 22 }}>
        {[['Total CARs', cars.length, true], ['Open', open, open === 0], ['Closed', cars.length - open, true]].map(([l, v, ok]) => (
          <div key={l as string} style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}`, padding: 16 }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>{l as string}</div>
            <div style={{ fontSize: 24, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, color: C.textDark }}>{v as number}</div>
          </div>
        ))}
      </div>
      <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}` }}>
        <div style={{ padding: '13px 18px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>All CARs</div>
          <Link href="/car/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: `1px solid ${C.borderLight}`, color: C.textDark, fontSize: 12, textDecoration: 'none' }}><span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>New CAR</Link>
        </div>
        {cars.length === 0 && <div style={{ padding: '52px 20px', textAlign: 'center', color: C.textFaint, fontSize: 13 }}>No corrective action requests yet.</div>}
        {cars.map((car, i) => (
          <div key={car.id} style={{ padding: '14px 18px', borderBottom: i < cars.length - 1 ? `1px solid ${C.borderLight}` : 'none', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 3, alignSelf: 'stretch', background: car.status==='IN_PROGRESS'?C.amber:car.status==='CLOSED'?C.green:C.blue, flexShrink: 0, minHeight: 14 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' as const }}>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint }}>{car.referenceId}</span>
                <Badge s={car.severity} /><Badge s={car.status.replace('_',' ')} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.textDark, marginBottom: 3 }}>{car.nonConformingPart}</div>
              <div style={{ fontSize: 12, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{car.deviation}</div>
              <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, marginTop: 4 }}>
                Opened: {new Date(car.openedAt).toLocaleDateString()} · {car.affectedQty.toLocaleString()} units · Step {car.currentStep}/3
              </div>
            </div>
            <Link href={`/car/${encodeURIComponent(car.id)}`} style={{ color: C.textDark, border: `1px solid ${C.borderLight}`, padding: '7px 10px', fontSize: 11, textDecoration: 'none', whiteSpace: 'nowrap' }}>Open</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
