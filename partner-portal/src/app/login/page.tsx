'use client';
// src/app/login/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { colors } from '@/styles/tokens';
import type { Metadata } from 'next';

const C = colors;

function Spinner() {
  return (
    <span style={{ width: 13, height: 13, border: `2px solid ${C.bg}33`, borderTopColor: C.bg, borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab]           = useState<'password' | 'magic'>('password');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState<string | null>(null);
  const [error, setError]       = useState('');
  const [magicSent, setMagicSent] = useState(false);

  const clearError = () => setError('');

  const signInPassword = async () => {
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading('password'); clearError();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(null); }
      else { router.push('/dashboard'); router.refresh(); }
    } catch (err) {
      console.error('[login] password sign-in failed', err);
      setError('Something went wrong signing in. Please try again.');
      setLoading(null);
    }
  };

  const signInMagic = async () => {
    if (!email) { setError('Enter your email address.'); return; }
    setLoading('magic'); clearError();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { setError(error.message); setLoading(null); }
      else { setMagicSent(true); setLoading(null); }
    } catch (err) {
      console.error('[login] magic-link sign-in failed', err);
      setError('Something went wrong sending the magic link. Please try again.');
      setLoading(null);
    }
  };

  const signInOAuth = async (provider: 'google' | 'azure') => {
    setLoading(provider); clearError();
    try {
      // signInWithOAuth navigates the browser away on success, so `error`
      // being set here means the redirect never happened — previously this
      // wasn't checked at all, leaving the button stuck on its spinner
      // forever with no feedback.
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) { setError(error.message); setLoading(null); }
    } catch (err) {
      console.error('[login] OAuth sign-in failed', err);
      setError('Something went wrong signing in. Please try again.');
      setLoading(null);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    border: `1px solid ${C.borderDark}`,
    background: 'transparent', color: C.textLight,
    fontSize: 13, fontFamily: "'Inter', sans-serif",
    outline: 'none', boxSizing: 'border-box', borderRadius: 0,
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', fontFamily: "'Hanken Grotesk', sans-serif", color: C.textLight }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Left branding panel ── */}
      <div style={{ flex: 1, padding: '52px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: `1px solid ${C.borderDark}`, minWidth: 0 }}
           className="hide-mobile">
        <div>
          <div style={{ marginBottom: 52 }}>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.025em', marginBottom: 8 }}>PRECISIONCORE AUTOMOTIVE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 18, height: 1, background: C.bgBorder }} />
              <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: `${C.textLight}44`, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                Partner Portal · Supabase Auth
              </span>
            </div>
          </div>
          <h2 style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.035em', lineHeight: '56px', marginBottom: 22 }}>
            GLOBAL<br />PARTNER<br />ECOSYSTEM
          </h2>
          <p style={{ fontSize: 14, color: `${C.textLight}55`, lineHeight: '24px', maxWidth: 380 }}>
            Secure gateway for Tier 1–3 automotive suppliers. Technical documentation, quality compliance, and manufacturing intelligence — behind role-based authentication.
          </p>
        </div>

        {/* Tier architecture */}
        <div>
          <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: `${C.textLight}44`, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>ACCESS ARCHITECTURE</div>
          {[
            { tier: 1, label: 'TIER 01 — BASIC',     desc: 'Public data, ISO certifications, sustainability reports.' },
            { tier: 2, label: 'TIER 02 — QUALIFIED',  desc: 'RFQ submission, PPAP compliance, supplier scorecard.', active: true },
            { tier: 3, label: 'TIER 03 — STRATEGIC',  desc: 'CAR workflow, capacity data, procurement oversight.' },
          ].map(t => (
            <div key={t.tier} style={{ display: 'flex', gap: 12, padding: '11px 14px', marginBottom: 7, border: `1px solid ${t.active ? `${C.blue}44` : C.borderDark}`, background: t.active ? `${C.navy}cc` : 'transparent' }}>
              <div style={{ width: 3, background: t.tier === 3 ? C.blue : t.active ? `${C.blue}66` : C.borderDark, alignSelf: 'stretch', minHeight: 12 }} />
              <div>
                <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: t.active ? C.blue : `${C.textLight}44`, letterSpacing: '0.1em', marginBottom: 2 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: t.active ? `${C.textLight}55` : `${C.textLight}22`, lineHeight: '17px' }}>{t.desc}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, boxShadow: `0 0 6px ${C.green}` }} />
            <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: `${C.textLight}44`, letterSpacing: '0.06em' }}>
              SUPABASE AUTH OPERATIONAL · JWT RS256 · RBAC ENFORCED
            </span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ width: 'clamp(320px, 40%, 480px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 clamp(24px, 5vw, 52px)', flexShrink: 0 }}>
        <div style={{ maxWidth: 360, width: '100%' }}>

          {/* Mobile-only header */}
          <div className="only-mobile" style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 4 }}>PRECISIONCORE AUTOMOTIVE</div>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: `${C.textLight}44`, textTransform: 'uppercase', letterSpacing: '0.14em' }}>Partner Portal</div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: `${C.textLight}44`, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Sign In</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.01em' }}>Partner Authentication</h3>
          </div>

          {/* OAuth buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            <button onClick={() => signInOAuth('google')} disabled={!!loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '11px 16px', background: 'transparent', border: `1px solid ${C.borderDark}`, color: C.textLight, fontSize: 13, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, cursor: loading ? 'wait' : 'pointer', borderRadius: 0 }}>
              {loading === 'google' ? <Spinner /> : (
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>

            <button onClick={() => signInOAuth('azure')} disabled={!!loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', padding: '11px 16px', background: 'transparent', border: `1px solid ${C.borderDark}`, color: C.textLight, fontSize: 13, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, cursor: loading ? 'wait' : 'pointer', borderRadius: 0 }}>
              {loading === 'azure' ? <Spinner /> : (
                <svg width="16" height="16" viewBox="0 0 23 23">
                  <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                  <path fill="#f35325" d="M1 1h10v10H1z"/>
                  <path fill="#81bc06" d="M12 1h10v10H12z"/>
                  <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                  <path fill="#ffba08" d="M12 12h10v10H12z"/>
                </svg>
              )}
              Continue with Microsoft
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: C.borderDark }} />
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: `${C.textLight}44`, letterSpacing: '0.08em' }}>OR</span>
            <div style={{ flex: 1, height: 1, background: C.borderDark }} />
          </div>

          {/* Tab: password vs magic link */}
          <div style={{ display: 'flex', marginBottom: 20, border: `1px solid ${C.borderDark}` }}>
            {(['password', 'magic'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); clearError(); setMagicSent(false); }}
                style={{ flex: 1, padding: '8px', background: tab === t ? C.textLight : 'transparent', color: tab === t ? C.bg : `${C.textLight}66`, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, border: 'none', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {t === 'password' ? 'Password' : 'Magic Link'}
              </button>
            ))}
          </div>

          {magicSent ? (
            <div style={{ padding: 16, border: `1px solid ${C.green}44`, background: `${C.green}11`, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.green, letterSpacing: '0.08em', marginBottom: 6 }}>LINK SENT</div>
              <p style={{ fontSize: 13, color: `${C.textLight}88`, lineHeight: '20px', margin: 0 }}>
                Check <strong style={{ color: C.textLight }}>{email}</strong> for a sign-in link. It expires in 1 hour.
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: `${C.textLight}44`, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Corporate Email</div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (tab === 'password' ? signInPassword() : signInMagic())}
                  placeholder="you@company.com"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = C.blue}
                  onBlur={e => e.target.style.borderColor = C.borderDark}
                />
              </div>

              {tab === 'password' && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: `${C.textLight}44`, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Password</div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && signInPassword()}
                    placeholder="••••••••"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = C.blue}
                    onBlur={e => e.target.style.borderColor = C.borderDark}
                  />
                </div>
              )}

              {error && (
                <div style={{ marginBottom: 14, padding: '8px 12px', border: `1px solid ${C.red}44`, background: `${C.red}11`, fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: C.red, lineHeight: '18px' }}>
                  {error}
                </div>
              )}

              <button
                onClick={tab === 'password' ? signInPassword : signInMagic}
                disabled={!!loading}
                style={{ width: '100%', padding: '12px', background: loading ? `${C.textLight}cc` : C.textLight, color: C.bg, border: 'none', fontSize: 12, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, cursor: loading ? 'wait' : 'pointer', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 0, marginBottom: 12 }}>
                {loading === 'password' || loading === 'magic'
                  ? <><Spinner /> {tab === 'password' ? 'Signing in...' : 'Sending link...'}</>
                  : tab === 'password' ? 'SIGN IN' : 'SEND MAGIC LINK'
                }
              </button>
            </>
          )}

          {/* Security note */}
          <div style={{ marginTop: 16, padding: 12, border: `1px solid ${C.borderDark}`, background: `${C.navy}44` }}>
            <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: `${C.blue}88`, letterSpacing: '0.1em', marginBottom: 5 }}>SESSION SECURITY</div>
            <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: `${C.textLight}55`, lineHeight: '16px' }}>
              Sessions managed by Supabase Auth. JWTs signed RS256, stored in HttpOnly cookies. Tier claims attached via custom access-token hook.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
