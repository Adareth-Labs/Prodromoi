// Route signed-in users according to server-side API authorization.
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPortalUser, getQualityReviewer } from '@/lib/auth';

export default async function RootPage() {
  const reviewer = await getQualityReviewer();
  if (reviewer) redirect('/quality-review');

  const user = await getPortalUser();
  if (user) redirect('/dashboard');

  // A valid Supabase login alone is not enough to enter either workspace.
  // Show a clear provisioning message rather than redirecting an unassigned
  // account forever between /, /login, and /dashboard.
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (authUser) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f8f9fc', color: '#131b2e', fontFamily: 'Inter, sans-serif' }}>
        <section style={{ maxWidth: 520, width: '100%', background: '#fff', border: '1px solid #dde1ef', padding: 28 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 10 }}>PrecisionCore Partner Portal</div>
          <h1 style={{ fontSize: 24, margin: '0 0 12px' }}>Your account is not provisioned</h1>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: '#44474f' }}>You are signed in, but this account is not assigned to an active supplier or an authorized internal quality-reviewer role. Contact your PrecisionCore administrator to request access.</p>
          <form action="/auth/signout" method="POST" style={{ marginTop: 20 }}><button type="submit" style={{ border: '1px solid #9ba3bb', padding: '9px 12px', background: '#fff', cursor: 'pointer' }}>Sign out</button></form>
        </section>
      </main>
    );
  }

  redirect('/login');
}
