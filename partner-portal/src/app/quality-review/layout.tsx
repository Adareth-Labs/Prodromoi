import Link from 'next/link';
import { requireQualityReviewer } from '@/lib/auth';
import { colors } from '@/styles/tokens';

const C = colors;

export default async function QualityReviewLayout({ children }: { children: React.ReactNode }) {
  const reviewer = await requireQualityReviewer();

  return (
    <div style={{ minHeight: '100vh', background: C.surface, color: C.textDark }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', padding: '18px clamp(16px, 4vw, 42px)', background: C.surfaceCard, borderBottom: `1px solid ${C.borderLight}` }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-0.02em' }}>PRECISIONCORE AUTOMOTIVE</div>
          <div style={{ marginTop: 4, color: C.textFaint, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: "'JetBrains Mono', monospace" }}>Internal Quality Review</div>
        </div>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }} aria-label="Internal reviewer navigation">
          <Link href="/quality-review" style={{ color: C.textDark, fontSize: 12, textDecoration: 'none' }}>Verification queue</Link>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{reviewer.name}</div>
            <div style={{ color: C.textFaint, fontSize: 10 }}>{reviewer.role === 'QUALITY_ADMIN' ? 'Quality administrator' : 'Quality reviewer'}</div>
          </div>
          <form action="/auth/signout" method="POST">
            <button type="submit" style={{ background: 'transparent', border: `1px solid ${C.borderLight}`, padding: '8px 10px', color: C.textDark, cursor: 'pointer', fontSize: 11 }}>Sign out</button>
          </form>
        </nav>
      </header>
      <main style={{ padding: 'clamp(16px, 3vw, 32px)', maxWidth: 1280, margin: '0 auto' }}>{children}</main>
    </div>
  );
}
