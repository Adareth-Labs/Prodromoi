import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

// Called by Vercel Cron every 6 hours (see vercel.json)
// Ensures stale pages are refreshed even without CMS webhooks

export async function GET() {
  const paths = ['/', '/solutions', '/innovation', '/newsroom', '/careers', '/company', '/company/investors', '/governance']
  paths.forEach((p) => revalidatePath(p))
  return NextResponse.json({ revalidated: true, paths, at: new Date().toISOString() })
}