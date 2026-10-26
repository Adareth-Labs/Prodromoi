import { requirePortalUser } from '@/lib/auth'
import CARNewClient from './CARNewClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'New Corrective Action Report' }

export default async function NewCARPage() {
  const user = await requirePortalUser({ minTier: 2 })
  return <CARNewClient user={user} />
}
