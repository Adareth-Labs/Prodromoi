import type { Response, NextFunction } from 'express'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { db } from '@/config/database'
import type { AuthenticatedRequest } from '@/types'
import { env } from '@/config/env'
import { logger } from '@/config/logger'

const JWKS = createRemoteJWKSet(
  new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
)
const ISSUER = `${env.SUPABASE_URL}/auth/v1`

function normalizeTier(value: unknown): AuthenticatedRequest['auth']['tier'] {
  if (value === 'STRATEGIC' || value === 3 || value === '3') return 'STRATEGIC'
  if (value === 'QUALIFIED' || value === 2 || value === '2') return 'QUALIFIED'
  return 'BASIC'
}

async function extractAuth(payload: Record<string, unknown>): Promise<AuthenticatedRequest['auth']> {
  const sub = payload['sub'] as string
  const meta = (payload['app_metadata'] ?? {}) as Record<string, unknown>

  // The database is the source of truth for supplier membership, vendor ID,
  // active status, and tier. Client-editable user_metadata is never used for
  // authorization decisions.
  const supplierUser = await db.supplierUser.findUnique({
    where: { supabaseId: sub },
    include: { supplier: true },
  })

  if (!supplierUser || !supplierUser.supplier || !supplierUser.supplier.isActive) {
    throw new Error('No active supplier mapping for authenticated user')
  }

  return {
    sub,
    email: supplierUser.email || (payload['email'] as string) || '',
    name: supplierUser.name || (meta['name'] as string) || (payload['email'] as string) || 'Partner',
    tier: normalizeTier(supplierUser.supplier.tier),
    supplierId: supplierUser.supplierId,
    vendorId: supplierUser.supplier.vendorId,
  }
}

async function verifyBearerToken(authHeader: string): Promise<AuthenticatedRequest['auth']> {
  const token = authHeader.slice(7)
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: ISSUER,
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
      logger.debug('Optional auth: ignoring invalid token', { error: String(err), ip: req.ip })
      next()
    }
  }
}

export const authenticate = makeAuthMiddleware(true)
export const optionalAuth = makeAuthMiddleware(false)
