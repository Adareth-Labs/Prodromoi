import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

// Called by Vercel Cron every 6 hours (see vercel.json). This route must not
// allow arbitrary visitors to trigger cache invalidation. Configure CRON_SECRET
// in the hosting environment; Vercel sends it as a Bearer token.

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authorization = req.headers.get('authorization')
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const paths = ['/', '/solutions', '/innovation', '/newsroom', '/careers', '/company', '/company/investors', '/governance']
  paths.forEach((path) => revalidatePath(path))
  return NextResponse.json({ revalidated: true, paths, at: new Date().toISOString() })
}
