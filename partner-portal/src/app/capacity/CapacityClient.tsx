'use client';
import { useState } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { KPICard, SectionHeader } from '@/components/ui';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { colors } from '@/styles/tokens';
import type { PortalUser } from '@/types';
const C = colors;

const FALLBACK_LINES = [
  {lineId:'Alpha-09',lineName:'Alpha-09',oee:88.4,utilization:94,status:'CRITICAL'},
  {lineId:'Beta-04', lineName:'Beta-04', oee:86,  utilization:73,status:'ACTIVE'},
  {lineId:'Beta-07', lineName:'Beta-07', oee:85,  utilization:68,status:'ACTIVE'},
  {lineId:'Gamma-02',lineName:'Gamma-02',oee:0,   utilization:0, status:'MAINTENANCE'},
  {lineId:'Gamma-11',lineName:'Gamma-11',oee:79,  utilization:55,status:'ACTIVE'},
];
const FALLBACK_HISTORY = [
  {d:'MON',util:60,oee:82},{d:'TUE',util:75,oee:86},{d:'WED',util:82,oee:85},
  {d:'THU',util:94,oee:88},{d:'FRI',util:70,oee:84},{d:'SAT',util:65,oee:81},{d:'SUN',util:58,oee:79},
];

export default function CapacityClient({ user, lines: serverLines, history: serverHistory, overallOEE }: { user: PortalUser; lines: any[]; history: any[]; overallOEE: number }) {
  const { mob, tab } = useBreakpoint();
  const [timeRange, setTimeRange] = useState('7D');
  const lines = serverLines.length > 0 ? serverLines : FALLBACK_LINES;
  const history = serverHistory.length > 0 ? serverHistory.map((h:any)=>({d:h.day, util:h.utilization, oee:h.oee})) : FALLBACK_HISTORY;
  const pad = mob ? 14 : tab ? 20 : 26;
  const oee = overallOEE || (lines.filter(l=>l.status!=='MAINTENANCE').reduce((s,l)=>s+l.oee,0)/(lines.filter(l=>l.status!=='MAINTENANCE').length||1));

  const CapTip = ({ active, payload, label }: any) => active && payload?.length ? (
    <div style={{ background: C.textDark, padding: '8px 12px' }}>
      <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: C.blue, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: payload[0].value > 85 ? '#fca5a5' : '#fff', fontWeight: 600 }}>
        {payload[0].value}%{payload[0].value > 85 ? ' ⚠ CRITICAL' : ''}
      </div>
    </div>
  ) : null;

  return (
    <div style={{ padding: pad, maxWidth: 1200, margin: '0 auto' }}>
      <SectionHeader eyebrow="Manufacturing Intelligence" title="Capacity Dashboard" mob={mob} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 22 }}>
        <KPICard label="Current OEE" value={oee.toFixed(1)} unit="%" trend="↑ 2.1%" ok={true} sub="from prev. shift" icon="speed" />
        <KPICard label="Parts Shipped MTD" value="142,850" ok={true} sub="72% of 200k target" icon="inventory_2" />
        <KPICard label="Lines Active" value={lines.filter(l=>l.status==='ACTIVE').length} unit={`/${lines.length}`} ok={true} sub="scheduled maint." icon="precision_manufacturing" />
        <KPICard label="Critical Load" value={lines.filter(l=>l.status==='CRITICAL').length} unit=" line" trend="Above 85%" ok={false} sub="threshold exceeded" icon="warning" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: mob||tab?'1fr':'2fr 1fr', gap: 18 }}>
        <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}` }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: 8 }}>
            <div>
              <h3 style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: C.textDark }}>Live Capacity Utilization</h3>
              <p style={{ fontSize: 10, color: C.textFaint, marginTop: 2 }}>Alpha-09 (Precision Casting)</p>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              {['24H','7D','30D'].map(t => <button key={t} onClick={() => setTimeRange(t)} style={{ padding: '4px 8px', border: `1px solid ${timeRange===t?C.textDark:C.borderLight}`, background: timeRange===t?C.textDark:'transparent', color: timeRange===t?'#fff':C.textFaint, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer', borderRadius: 0 }}>{t}</button>)}
            </div>
          </div>
          <div style={{ padding: mob?14:18 }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.red, textAlign: 'right', marginBottom: 4 }}>— CRITICAL THRESHOLD (85%)</div>
            <ResponsiveContainer width="100%" height={mob?180:230}>
              <BarChart data={history} margin={{ top:5, right:0, bottom:0, left:-24 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={C.borderLight} vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", fill:C.textFaint }} axisLine={false} tickLine={false} />
                <YAxis domain={[0,100]} tick={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", fill:C.textFaint }} axisLine={false} tickLine={false} tickFormatter={(v:number)=>`${v}%`} />
                <Tooltip content={<CapTip />} />
                <Bar dataKey="util" radius={0} fill={C.textDark} shape={(props: any) => <rect x={props.x} y={props.y} width={props.width} height={props.height} fill={props.value>85?C.red:C.textDark} />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}`, padding: 16 }}>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 6 }}>OEE Trend (7-Day)</div>
            <div style={{ fontSize: 28, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, color: C.textDark }}>{oee.toFixed(1)}<span style={{ fontSize: 14, fontWeight: 400, color: C.textFaint }}>%</span></div>
            <div style={{ fontSize: 11, color: C.green, marginBottom: 8 }}>↑ 2.1% from prev. shift</div>
            <ResponsiveContainer width="100%" height={70}>
              <AreaChart data={history}>
                <Area type="monotone" dataKey="oee" stroke={C.textDark} fill={`${C.textDark}12`} strokeWidth={1.5} dot={false} />
                <XAxis dataKey="d" hide /><YAxis domain={[70,100]} hide />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}` }}>
            <div style={{ padding: '11px 14px', borderBottom: `1px solid ${C.borderLight}` }}>
              <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>Production Lines</div>
            </div>
            {lines.map(line => (
              <div key={line.lineId} style={{ padding: '10px 14px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 28, background: line.status==='CRITICAL'?C.red:line.status==='ACTIVE'?C.green:C.textFaint, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: C.textDark }}>{line.lineName}</span>
                    <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: line.status==='CRITICAL'?C.red:line.status==='ACTIVE'?C.green:C.textFaint }}>{line.utilization>0?`${line.utilization}%`:'DOWN'}</span>
                  </div>
                  <div style={{ height: 3, background: C.surfaceLow }}><div style={{ width: `${line.utilization}%`, height: '100%', background: line.status==='CRITICAL'?C.red:line.status==='ACTIVE'?C.textDark:C.borderLight }} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
