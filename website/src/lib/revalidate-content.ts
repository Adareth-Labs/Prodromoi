/** Server-only helper used by Payload hooks to invalidate public pages. */
export async function triggerContentRevalidation(type: string, slug?: unknown): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const secret = process.env.REVALIDATION_SECRET
  if (!siteUrl || !secret) return

  const body: { type: string; slug?: string } = { type }
  if (typeof slug === 'string' && slug.trim()) body.slug = slug.trim()

  try {
    const response = await fetch(`${siteUrl.replace(/\/+$/, '')}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-cms-webhook-secret': secret,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    if (!response.ok) {
      console.error(`[Payload revalidation] ${type} failed with HTTP ${response.status}`)
    }
  } catch (error) {
    console.error(`[Payload revalidation] ${type} request failed`, error)
  }
}
