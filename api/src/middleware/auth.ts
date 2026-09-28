import type { Response, NextFunction } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { AuthenticatedRequest } from '@/types'
import { env } from '@/config/env'
import { logger } from '@/config/logger'

// Supabase exposes a JWKS endpoint for RS256 token verification
const JWKS = createRemoteJWKSet(
  new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
)

// Supabase JWT issuer
const ISSUER = `${env.SUPABASE_URL}/auth/v1`

function normalizeTier(value: unknown): AuthenticatedRequest['auth']['tier'] {
  if (value === 3 || value === '3' || value === 'STRATEGIC') return 'STRATEGIC'
  if (value === 2 || value === '2' || value === 'QUALIFIED') return 'QUALIFIED'
  return 'BASIC'
}

function extractAuth(payload: Record<string, unknown>): AuthenticatedRequest['auth'] {
  // Keep authorization data in Supabase app_metadata so users cannot alter their
  // tier/vendor claims from the client. A custom access-token hook can expose
  // these claims directly in the JWT; app_metadata is retained as the fallback.
  const meta = (payload['app_metadata'] ?? payload['user_metadata'] ?? {}) as Record<string, unknown>

  return {
    sub:        payload['sub'] as string,
    email:      payload['email'] as string,
    name:       (meta['name'] ?? payload['email']) as string,
    tier:       normalizeTier(meta['tier']),
    supplierId: (meta['supplier_id'] ?? meta['supplierId']) as string,
    vendorId:   (meta['vendor_id'] ?? meta['vendorId']) as string,
  }
}

// Shared by `authenticate` and `optionalAuth` below — both need to pull the
// bearer token off the request and verify it against Supabase's JWKS; they
// only differ in what happens when that fails (see `required`).
async function verifyBearerToken(authHeader: string): Promise<AuthenticatedRequest['auth']> {
  const token = authHeader.slice(7)
  const { payload } = await jwtVerify(token, JWKS, {
    issuer:   ISSUER,
    audience: 'authenticated',
  })
  return extractAuth(payload as Record<string, unknown>)
}

function makeAuthMiddleware(required: boolean) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      if (required) {
        res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' })
        return
      }
      next()
      return
    }

    try {
      req.auth = await verifyBearerToken(authHeader)
      next()
    } catch (err) {
      if (required) {
        logger.warn('JWT validation failed', { error: String(err), ip: req.ip })
        res.status(401).json({ success: false, error: 'Invalid or expired token' })
        return
      }
      // Optional auth: an invalid token just means the request proceeds
      // unauthenticated, but the failure is still logged rather than
      // silently discarded.
      logger.debug('Optional auth: ignoring invalid token', { error: String(err), ip: req.ip })
      next()
    }
  }
}

export const authenticate  = makeAuthMiddleware(true)
export const optionalAuth  = makeAuthMiddleware(false)
