'use client'

import { useBreakpoint } from '@/hooks/useBreakpoint'
import { KPICard, SectionHeader } from '@/components/ui'
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { colors } from '@/styles/tokens'
import type { PortalUser } from '@/types'

const C = colors

type CapacityLine = {
  lineId: string
  lineName: string
  oee: number
  utilization: number
  status: string
}

type CapacityHistory = { day: string; oee: number; utilization: number }

export default function CapacityClient({
  lines,
  history: serverHistory,
  overallOEE,
}: {
  user: PortalUser
  lines: CapacityLine[]
  history: CapacityHistory[]
  overallOEE: number | null
}) {
  const { mob, tab } = useBreakpoint()
  const history = serverHistory.map((snapshot) => ({
    d: snapshot.day,
    util: snapshot.utilization,
    oee: snapshot.oee,
  }))
  const hasCapacityData = lines.length > 0
  const activeLines = lines.filter((line) => line.status === 'ACTIVE').length
  const criticalLines = lines.filter((line) => line.status === 'CRITICAL').length
  const averageOEE = overallOEE ?? (hasCapacityData
    ? lines.reduce((sum, line) => sum + line.oee, 0) / lines.length
    : null)
  const pad = mob ? 14 : tab ? 20 : 26

  const CapTip = ({ active, payload, label }: any) => active && payload?.length ? (
    <div style={{ background: C.textDark, padding: '8px 12px' }}>
      <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: C.blue, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: payload[0].value > 85 ? '#fca5a5' : '#fff', fontWeight: 600 }}>
        {payload[0].value}%{payload[0].value > 85 ? ' ⚠ CRITICAL' : ''}
      </div>
    </div>
  ) : null

  return (
    <div style={{ padding: pad, maxWidth: 1200, margin: '0 auto' }}>
      <SectionHeader eyebrow="Manufacturing Intelligence" title="Capacity Dashboard" mob={mob} />
      {!hasCapacityData && (
        <div role="status" style={{ border: `1px solid ${C.borderLight}`, padding: 14, marginBottom: 18, color: C.textFaint, fontSize: 12 }}>
          No verified capacity snapshots are available yet. Production metrics will appear here once a supplier administrator connects a data source.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 22 }}>
        <KPICard label="Current OEE" value={averageOEE == null ? '—' : averageOEE.toFixed(1)} unit={averageOEE == null ? '' : '%'} ok={averageOEE != null} sub={averageOEE == null ? 'No verified data' : 'Latest recorded snapshot'} icon="speed" />
        <KPICard label="Parts Shipped MTD" value="—" ok={false} sub="No verified production data" icon="inventory_2" />
        <KPICard label="Lines Active" value={hasCapacityData ? activeLines : '—'} unit={hasCapacityData ? `/${lines.length}` : ''} ok={hasCapacityData} sub={hasCapacityData ? 'Current recorded status' : 'No configured lines'} icon="precision_manufacturing" />
        <KPICard label="Critical Load" value={hasCapacityData ? criticalLines : '—'} unit={hasCapacityData ? ' line(s)' : ''} ok={hasCapacityData && criticalLines === 0} sub={hasCapacityData ? 'Current recorded status' : 'No verified data'} icon="warning" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mob || tab ? '1fr' : '2fr 1fr', gap: 18 }}>
        <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}` }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.borderLight}` }}>
            <h3 style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textDark }}>Capacity Utilization History</h3>
            <p style={{ fontSize: 10, color: C.textFaint, marginTop: 2 }}>{hasCapacityData ? `${lines.length} configured production line(s)` : 'No production lines configured'}</p>
          </div>
          <div style={{ padding: mob ? 14 : 18 }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.red, textAlign: 'right', marginBottom: 4 }}>— CRITICAL THRESHOLD (85%)</div>
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height={mob ? 180 : 230}>
                <BarChart data={history} margin={{ top: 5, right: 0, bottom: 0, left: -24 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={C.borderLight} vertical={false} />
                  <XAxis dataKey="d" tick={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", fill: C.textFaint }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 8, fontFamily: "'JetBrains Mono',monospace", fill: C.textFaint }} axisLine={false} tickLine={false} tickFormatter={(value: number) => `${value}%`} />
                  <Tooltip content={<CapTip />} />
                  <Bar dataKey="util" radius={0} fill={C.textDark} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ minHeight: mob ? 180 : 230, display: 'grid', placeItems: 'center', color: C.textFaint, fontSize: 12 }}>No history available</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}`, padding: 16 }}>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>OEE Trend (7-Day)</div>
            <div style={{ fontSize: 28, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, color: C.textDark }}>
              {averageOEE == null ? '—' : <>{averageOEE.toFixed(1)}<span style={{ fontSize: 14, fontWeight: 400, color: C.textFaint }}>%</span></>}
            </div>
            <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 8 }}>{history.length ? 'Recorded history' : 'No verified trend data'}</div>
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height={70}>
                <AreaChart data={history}>
                  <Area type="monotone" dataKey="oee" stroke={C.textDark} fill={`${C.textDark}12`} strokeWidth={1.5} dot={false} />
                  <XAxis dataKey="d" hide /><YAxis domain={[0, 100]} hide />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div style={{ height: 70, color: C.textFaint, fontSize: 11 }}>No history available</div>}
          </div>

          <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}` }}>
            <div style={{ padding: '11px 14px', borderBottom: `1px solid ${C.borderLight}` }}>
              <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Production Lines</div>
            </div>
            {lines.length ? lines.map((line) => (
              <div key={line.lineId} style={{ padding: '10px 14px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 28, background: line.status === 'CRITICAL' ? C.red : line.status === 'ACTIVE' ? C.green : C.textFaint, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.textDark }}>{line.lineName}</span>
                    <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: line.status === 'CRITICAL' ? C.red : line.status === 'ACTIVE' ? C.green : C.textFaint }}>{line.utilization > 0 ? `${line.utilization}%` : 'DOWN'}</span>
                  </div>
                  <div style={{ height: 3, background: C.surfaceLow }}><div style={{ width: `${Math.max(0, Math.min(100, line.utilization))}%`, height: '100%', background: line.status === 'CRITICAL' ? C.red : line.status === 'ACTIVE' ? C.textDark : C.borderLight }} /></div>
                </div>
              </div>
            )) : <div style={{ padding: 14, color: C.textFaint, fontSize: 12 }}>No production lines configured.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
