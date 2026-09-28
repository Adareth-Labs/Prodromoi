// src/app/api/rfq/initiate/route.ts
//
// Public RFQ intake — called server-to-server by the marketing website's
// /api/rfq route, never directly by a browser. This did not exist before;
// the website was calling a URL with nothing behind it and faking a
// success response whenever the fetch failed, which was always.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/db';

const schema = z.object({
  productSlug:  z.string().optional(),
  sku:          z.string().optional(),
  annualVolume: z.number().int().positive().optional(),
  sopDate:      z.string().refine((v) => !isNaN(Date.parse(v)), 'Invalid date').optional(),
  contactEmail: z.string().email().optional(),
  step:         z.number().int().min(1).max(3),
});

// In-memory, per-instance rate limit — same limitation as the Express API's
// rate limiter elsewhere in this codebase (doesn't share state across
// horizontally-scaled instances). Adequate for a single-instance deployment,
// not a substitute for a shared store or gateway-level limiting in
// production.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

// A one-time visitor's entry would otherwise never get revisited/cleaned —
// nothing prunes it unless that exact IP sends another request. A periodic
// sweep is what actually bounds the map's size in a long-running process.
// unref() so this timer doesn't block process shutdown.
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of hits) {
    const recent = timestamps.filter((t) => now - t < WINDOW_MS);
    if (recent.length === 0) hits.delete(ip);
    else hits.set(ip, recent);
  }
}, WINDOW_MS).unref();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.PORTAL_API_SECRET;
  if (!expected) return false; // fail closed if the secret was never configured

  const header = req.headers.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch rather than returning false —
  // guard that explicitly instead of leaking timing information via a
  // length-dependent early exit.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function generateTrackingId(): string {
  // Random, not sequential — this endpoint is unauthenticated, so a
  // guessable/enumerable id (like the count-based referenceId used
  // elsewhere in this codebase) would let anyone walk every lead.
  return `LEAD-${randomBytes(5).toString('hex').toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = schema.parse(await req.json());
    const trackingId = generateTrackingId();

    await prisma.publicRFQLead.create({
      data: {
        trackingId,
        productSlug:  body.productSlug,
        sku:          body.sku,
        annualVolume: body.annualVolume,
        sopDate:      body.sopDate ? new Date(body.sopDate) : undefined,
        contactEmail: body.contactEmail,
        step:         body.step,
      },
    });

    return NextResponse.json({ trackingId }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: err.errors }, { status: 400 });
    }
    console.error('[POST /api/rfq/initiate]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
