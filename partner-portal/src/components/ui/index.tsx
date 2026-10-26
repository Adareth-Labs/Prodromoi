'use client';
// src/components/ui/index.tsx
// Precision Engine Design System — reusable atoms

import { colors } from '@/styles/tokens';
import type { Tier } from '@/types';

const C = colors;

// ─── Icon ─────────────────────────────────────────────────────

export function Ic({ n, sz = 20, style }: { n: string; sz?: number; style?: React.CSSProperties }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: sz, lineHeight: 1, userSelect: 'none', ...style }}>
      {n}
    </span>
  );
}

// ─── Badge ────────────────────────────────────────────────────

const BADGE_MAP: Record<string, { bg: string; tc: string; bc: string }> = {
  'Approved':     { bg: C.greenBg,      tc: C.green,    bc: '#bbf7d0' },
  'Closed':       { bg: C.greenBg,      tc: C.green,    bc: '#bbf7d0' },
  'Active':       { bg: C.greenBg,      tc: C.green,    bc: '#bbf7d0' },
  'Under Review': { bg: C.amberBg,      tc: C.amber,    bc: '#fde68a' },
  'In Progress':  { bg: '#eff6ff',      tc: '#2563eb',  bc: '#bfdbfe' },
  'Pending':      { bg: '#eff6ff',      tc: '#2563eb',  bc: '#bfdbfe' },
  'Draft':        { bg: C.surface,      tc: C.textFaint,bc: C.borderLight },
  'Critical':     { bg: C.redBg,        tc: C.red,      bc: '#fecaca' },
  'Major':        { bg: C.amberBg,      tc: C.amber,    bc: '#fde68a' },
  'Minor':        { bg: C.surface,      tc: C.textFaint,bc: C.borderLight },
  'Maintenance':  { bg: C.surfaceLow,   tc: C.textFaint,bc: C.borderLight },
  'Strategic':    { bg: C.navy,         tc: C.blue,     bc: C.navyMid },
  'PENDING':      { bg: '#eff6ff',      tc: '#2563eb',  bc: '#bfdbfe' },
  'UNDER_REVIEW': { bg: C.amberBg,      tc: C.amber,    bc: '#fde68a' },
  'APPROVED':     { bg: C.greenBg,      tc: C.green,    bc: '#bbf7d0' },
  'OPEN':         { bg: '#eff6ff',      tc: '#2563eb',  bc: '#bfdbfe' },
  'IN_PROGRESS':  { bg: C.amberBg,      tc: C.amber,    bc: '#fde68a' },
  'CLOSED':       { bg: C.greenBg,      tc: C.green,    bc: '#bbf7d0' },
};

export function Badge({ s }: { s: string }) {
  const t = BADGE_MAP[s] ?? BADGE_MAP['Draft'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: t.bg, color: t.tc, border: `1px solid ${t.bc}`, fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: t.tc, flexShrink: 0 }} />
      {s.replace(/_/g, ' ')}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────

interface KPIProps {
  label: string; value: string | number; unit?: string;
  trend?: string; ok?: boolean | null; sub?: string; icon?: string;
}
export function KPICard({ label, value, unit = '', trend, ok, sub, icon }: KPIProps) {
  return (
    <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}`, padding: 16, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: ok === true ? C.green : ok === false ? C.red : C.amber }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.textFaint, lineHeight: '14px' }}>{label}</span>
        {icon && <Ic n={icon} sz={14} style={{ color: C.textFaint }} />}
      </div>
      <div style={{ fontSize: 24, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, color: C.textDark, lineHeight: 1 }}>
        {value}<span style={{ fontSize: 12, fontWeight: 400, color: C.textFaint, marginLeft: 3 }}>{unit}</span>
      </div>
      <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {trend && <span style={{ fontSize: 10, fontWeight: 700, color: ok === true ? C.green : ok === false ? C.red : C.amber }}>{trend}</span>}
        {sub && <span style={{ fontSize: 10, color: C.textFaint }}>{sub}</span>}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────

export function SectionHeader({ eyebrow, title, mob }: { eyebrow: string; title: string; mob?: boolean }) {
  return (
    <div style={{ marginBottom: mob ? 18 : 26 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ width: 20, height: 1, background: C.borderMid }} />
        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textFaint }}>{eyebrow}</span>
      </div>
      <h1 style={{ fontSize: mob ? 20 : 26, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, color: C.textDark, letterSpacing: '-0.01em', lineHeight: mob ? '28px' : '34px' }}>{title}</h1>
    </div>
  );
}

// ─── Form Primitives ─────────────────────────────────────────

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: 'block', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 6 }}>
      {children}{required && <span style={{ color: C.red }}> *</span>}
    </label>
  );
}

const inputBase: React.CSSProperties = {
  width: '100%', padding: '9px 11px', border: `1px solid ${C.borderLight}`,
  background: C.surfaceCard, color: C.textDark, fontSize: 13,
  fontFamily: "'Inter', sans-serif", outline: 'none', boxSizing: 'border-box', borderRadius: 0,
};

export function TextInput({ value, onChange, placeholder, type = 'text', readOnly }: {
  value: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; readOnly?: boolean;
}) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
      style={inputBase}
      onFocus={e => { e.target.style.borderColor = C.textDark; e.target.style.borderWidth = '2px'; e.target.style.padding = '8px 10px'; }}
      onBlur={e => { e.target.style.borderColor = C.borderLight; e.target.style.borderWidth = '1px'; e.target.style.padding = '9px 11px'; }}
    />
  );
}

export function SelectInput({ value, onChange, options }: {
  value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[];
}) {
  return (
    <select value={value} onChange={onChange} style={{ ...inputBase, cursor: 'pointer' }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function TextArea({ value, onChange, placeholder, rows = 4, readOnly }: {
  value: string; onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string; rows?: number; readOnly?: boolean;
}) {
  return (
    <textarea rows={rows} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
      style={{ ...inputBase, resize: readOnly ? 'none' : 'vertical', background: readOnly ? C.surfaceLow : inputBase.background }}
      onFocus={e => e.target.style.borderColor = C.textDark}
      onBlur={e => e.target.style.borderColor = C.borderLight}
    />
  );
}

// ─── Buttons ──────────────────────────────────────────────────

export function PrimaryButton({ children, onClick, disabled, icon, wide }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; icon?: string; wide?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: wide ? 'center' : 'flex-start', gap: 7, padding: '10px 18px', background: disabled ? C.textFaint : C.textDark, color: '#fff', border: 'none', fontSize: 13, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', letterSpacing: '0.02em', borderRadius: 0, width: wide ? '100%' : 'auto' }}>
      {icon && <Ic n={icon} sz={15} style={{ color: '#fff' }} />}{children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled, icon, wide }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; icon?: string; wide?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: wide ? 'center' : 'flex-start', gap: 7, padding: '10px 18px', background: 'transparent', color: C.textDark, border: `1px solid ${C.borderLight}`, fontSize: 13, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, width: wide ? '100%' : 'auto', borderRadius: 0 }}>
      {icon && <Ic n={icon} sz={15} />}{children}
    </button>
  );
}

// ─── RBAC Gate ────────────────────────────────────────────────

const TIER_NAMES: Record<Tier, string> = { 1: 'Basic', 2: 'Qualified', 3: 'Strategic' };
const TIER_LABELS: Record<Tier, string> = { 1: 'TIER 01', 2: 'TIER 02', 3: 'TIER 03' };

export function RBACGate({ user, minTier, children }: {
  user: { tier: number }; minTier: Tier; children: React.ReactNode;
}) {
  if (user.tier < minTier) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 20, padding: 32, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, border: `2px solid ${C.borderLight}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textFaint }}>
          <Ic n="lock" sz={28} />
        </div>
        <div style={{ maxWidth: 360 }}>
          <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em', textTransform: 'uppercase', color: C.textFaint, marginBottom: 8 }}>Access Restricted</div>
          <p style={{ fontSize: 18, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, color: C.textDark, marginBottom: 10 }}>
            {TIER_LABELS[minTier]} — {TIER_NAMES[minTier]} Required
          </p>
          <p style={{ fontSize: 13, color: C.textMuted, lineHeight: '22px' }}>
            This feature requires <strong>{TIER_NAMES[minTier]}</strong> partner credentials. Contact your account manager to upgrade your access tier.
          </p>
        </div>
        <div style={{ padding: '10px 16px', border: `1px solid ${C.borderLight}`, background: C.surfaceLow, maxWidth: 340, width: '100%' }}>
          <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>JWT CLAIMS REQUIRED</div>
          <pre style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.blueDeep, margin: 0, lineHeight: '15px' }}>
            {`{ "tier": ${minTier}, "role": "${TIER_NAMES[minTier].toLowerCase()}" }`}
          </pre>
        </div>
        <SecondaryButton icon="open_in_new">Request Access Upgrade</SecondaryButton>
      </div>
    );
  }
  return <>{children}</>;
}

// ─── Spinner ──────────────────────────────────────────────────

export function Spinner({ size = 14, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <span style={{ width: size, height: size, border: `2px solid ${color}33`, borderTopColor: color, borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
  );
}
