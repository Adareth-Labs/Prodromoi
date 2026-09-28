import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { InvestorDocument, FilingType } from '@/types'

// Cloudflare R2, region must be 'auto', endpoint required
const r2 = new S3Client({
  region:   'auto',
  endpoint: process.env.R2_ENDPOINT ?? '',   // https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
})

const BUCKET = process.env.R2_INVESTOR_BUCKET ?? 'precisioncore-investor-documents'
const EXPIRY  = parseInt(process.env.R2_PRESIGN_EXPIRY ?? '3600', 10)

// Key convention: {filingType}/{year}/{filename}
// e.g.  annual-report/2024/precisioncore-annual-report-2023.pdf

function parseDocumentKey(key: string): Omit<InvestorDocument, 'presignedUrl' | 'expiresAt'> {
  const parts      = key.split('/')
  const filingType = (parts[0] ?? 'annual-report') as FilingType
  const year       = parts[1] ?? new Date().getFullYear().toString()
  const filename   = parts[parts.length - 1] ?? key

  const quarterMatch  = filename.match(/q([1-4])-(\d{4})/i)
  const fiscalQuarter = quarterMatch ? `Q${quarterMatch[1]}` : undefined
  const fiscalYear    = quarterMatch ? quarterMatch[2] : year

  const title = filename
    .replace(/\.pdf$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return { key, title, filingType, filedAt: new Date().toISOString(), fiscalYear, fiscalQuarter, fileSizeBytes: 0 }
}

export async function getInvestorDocuments(): Promise<InvestorDocument[]> {
  const response = await r2.send(
    new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 200 })
  )

  if (!response.Contents) return []

  const documents = await Promise.all(
    response.Contents
      .filter((obj) => obj.Key?.endsWith('.pdf'))
      .map(async (obj) => {
        const key    = obj.Key!
        const parsed = parseDocumentKey(key)
        const url    = await getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: EXPIRY })
        return {
          ...parsed,
          filedAt:       obj.LastModified?.toISOString() ?? parsed.filedAt,
          fileSizeBytes: obj.Size ?? 0,
          presignedUrl:  url,
          expiresAt:     new Date(Date.now() + EXPIRY * 1000).toISOString(),
        } satisfies InvestorDocument
      })
  )

  return documents.sort((a, b) => new Date(b.filedAt).getTime() - new Date(a.filedAt).getTime())
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: EXPIRY })
}
