import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { InvestorDocument, FilingType } from '@/types'

const BUCKET = process.env.SUPABASE_STORAGE_INVESTOR_BUCKET ?? 'partner-private'
const EXPIRY = Number.parseInt(process.env.STORAGE_SIGNED_URL_EXPIRY ?? '3600', 10)
const INVESTOR_PREFIX = (process.env.SUPABASE_STORAGE_INVESTOR_PREFIX ?? 'investor-documents').replace(/^\/+|\/+$/g, '') + '/'

function getStorageClient(): S3Client {
  const endpoint = process.env.SUPABASE_STORAGE_S3_ENDPOINT
  const region = process.env.SUPABASE_STORAGE_S3_REGION
  const accessKeyId = process.env.SUPABASE_STORAGE_S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.SUPABASE_STORAGE_S3_SECRET_ACCESS_KEY
  if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
    throw new Error('Supabase Storage S3 configuration is missing; configure the server-only Storage S3 credentials.')
  }
  return new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  })
}

// Object-key convention: investor-documents/{filingType}/{year}/{filename}.pdf
function parseDocumentKey(key: string): Omit<InvestorDocument, 'presignedUrl' | 'expiresAt'> {
  const relativeKey = key.startsWith(INVESTOR_PREFIX) ? key.slice(INVESTOR_PREFIX.length) : key
  const parts = relativeKey.split('/')
  const filingType = (parts[0] ?? 'annual-report') as FilingType
  const year = parts[1] ?? new Date().getFullYear().toString()
  const filename = parts[parts.length - 1] ?? key
  const quarterMatch = filename.match(/q([1-4])-(\d{4})/i)
  const fiscalQuarter = quarterMatch ? `Q${quarterMatch[1]}` : undefined
  const fiscalYear = quarterMatch ? quarterMatch[2] : year
  const title = filename
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
  return { key, title, filingType, filedAt: new Date().toISOString(), fiscalYear, fiscalQuarter, fileSizeBytes: 0 }
}

export async function getInvestorDocuments(): Promise<InvestorDocument[]> {
  const storage = getStorageClient()
  const response = await storage.send(new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: INVESTOR_PREFIX,
    MaxKeys: 200,
  }))
  if (!response.Contents) return []

  const documents = await Promise.all(
    response.Contents
      .filter((obj) => obj.Key?.toLowerCase().endsWith('.pdf'))
      .map(async (obj) => {
        const key = obj.Key!
        const parsed = parseDocumentKey(key)
        const url = await getSignedUrl(storage, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: EXPIRY })
        return {
          ...parsed,
          filedAt: obj.LastModified?.toISOString() ?? parsed.filedAt,
          fileSizeBytes: obj.Size ?? 0,
          presignedUrl: url,
          expiresAt: new Date(Date.now() + EXPIRY * 1000).toISOString(),
        } satisfies InvestorDocument
      })
  )
  return documents.sort((a, b) => new Date(b.filedAt).getTime() - new Date(a.filedAt).getTime())
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const storage = getStorageClient()
  return getSignedUrl(storage, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: EXPIRY })
}
