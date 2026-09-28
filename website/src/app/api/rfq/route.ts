import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// RFQ submission endpoint — the public site only initiates; the portal
// (partner-portal/src/app/api/rfq/initiate) owns the actual lead record.

const schema = z.object({
  productSlug:    z.string().optional(),
  sku:            z.string().optional(),
  annualVolume:   z.number().optional(),
  sopDate:        z.string().optional(),
  contactEmail:   z.string().email().optional(),
  step:           z.number().min(1).max(3),
})

export async function POST(req: NextRequest) {
  let data: z.infer<typeof schema>
  try {
    data = schema.parse(await req.json())
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: err.errors }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 })
  }

  const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://portal.precisioncore.com'
  const PORTAL_API_SECRET = process.env.PORTAL_API_SECRET

  let response: Response | null = null
  try {
    response = await fetch(`${PORTAL_URL}/api/rfq/initiate`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${PORTAL_API_SECRET}`,
        'X-Source':      'public-site',
      },
      body: JSON.stringify(data),
    })
  } catch (err) {
    console.error('[POST /api/rfq] portal unreachable', err)
  }

  if (!response?.ok) {
    // No fabricated success here — if the portal didn't confirm the write,
    // the client needs to know the submission did not go through, not see
    // a tracking ID for a record that doesn't exist anywhere.
    const status = response?.status
    console.error(`[POST /api/rfq] portal intake failed${status ? ` (HTTP ${status})` : ' (no response)'}`)
    return NextResponse.json(
      { success: false, message: 'Submission failed — please try again or contact us directly.' },
      { status: 502 }
    )
  }

  const result = (await response.json()) as { trackingId?: string }
  if (!result.trackingId) {
    console.error('[POST /api/rfq] portal returned 2xx with no trackingId')
    return NextResponse.json(
      { success: false, message: 'Submission failed — please try again or contact us directly.' },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true, trackingId: result.trackingId })
}