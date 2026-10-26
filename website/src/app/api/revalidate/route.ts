import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

// Payload CMS webhook calls this endpoint after publishing
// Validates the shared secret before revalidating

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cms-webhook-secret')
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const contentType = (body?.collection ?? body?.doc?.collection ?? body?.data?.collection ?? body?.type) as string | undefined

    const pathMap: Record<string, { paths: string[]; detailBase?: string }> = {
      solution:          { paths: ['/solutions'], detailBase: '/solutions' },
      innovationArticle: { paths: ['/innovation'], detailBase: '/innovation' },
      newsArticle:       { paths: ['/', '/newsroom'], detailBase: '/newsroom' },
      leadershipProfile: { paths: ['/company'] },
      facility:          { paths: ['/company'] },
      boardMember:       { paths: ['/governance'] },
      siteMetrics:       { paths: ['/'] },
    }

    const config = pathMap[contentType ?? '']
    if (!config) return NextResponse.json({ message: 'Unsupported revalidation type' }, { status: 400 })
    const paths = [...config.paths]
    const slug = body?.slug
    // Revalidate concrete detail paths rather than dynamic route patterns,
    // which need a route type and can otherwise fail to invalidate the page.
    if (config.detailBase && typeof slug === 'string' && slug.length <= 200 && slug.length > 0 && !/[\/\\\u0000-\u001f]/.test(slug)) {
      paths.push(`${config.detailBase}/${encodeURIComponent(slug)}`)
    }
    paths.forEach((p) => revalidatePath(p))

    return NextResponse.json({ revalidated: true, paths })
  } catch (err) {
    console.error('[revalidate] Revalidation failed', err)
    return NextResponse.json({ message: 'Revalidation failed' }, { status: 500 })
  }
}