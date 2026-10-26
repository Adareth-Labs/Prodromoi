// LEGACY CLOUDFLARE R2 CLIENT — intentionally disabled, retained for reference/rollback.
// Active investor-document reads now use ../supabase-storage/investor-documents.ts.
// [R2 LEGACY] import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
// [R2 LEGACY] import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
// [R2 LEGACY] import type { InvestorDocument, FilingType } from '@/types'
//
// [R2 LEGACY] // Cloudflare R2, region must be 'auto', endpoint required
// [R2 LEGACY] const r2 = new S3Client({
// [R2 LEGACY]   region:   'auto',
// [R2 LEGACY]   endpoint: process.env.R2_ENDPOINT ?? '',   // https://<ACCOUNT_ID>.r2.cloudflarestorage.com
// [R2 LEGACY]   credentials: {
// [R2 LEGACY]     accessKeyId:     process.env.R2_ACCESS_KEY_ID ?? '',
// [R2 LEGACY]     secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
// [R2 LEGACY]   },
// [R2 LEGACY] })
//
// [R2 LEGACY] const BUCKET = process.env.R2_INVESTOR_BUCKET ?? 'precisioncore-investor-documents'
// [R2 LEGACY] const EXPIRY  = parseInt(process.env.R2_PRESIGN_EXPIRY ?? '3600', 10)
//
// [R2 LEGACY] // Key convention: {filingType}/{year}/{filename}
// [R2 LEGACY] // e.g.  annual-report/2024/precisioncore-annual-report-2023.pdf
//
// [R2 LEGACY] function parseDocumentKey(key: string): Omit<InvestorDocument, 'presignedUrl' | 'expiresAt'> {
// [R2 LEGACY]   const parts      = key.split('/')
// [R2 LEGACY]   const filingType = (parts[0] ?? 'annual-report') as FilingType
// [R2 LEGACY]   const year       = parts[1] ?? new Date().getFullYear().toString()
// [R2 LEGACY]   const filename   = parts[parts.length - 1] ?? key
//
// [R2 LEGACY]   const quarterMatch  = filename.match(/q([1-4])-(\d{4})/i)
// [R2 LEGACY]   const fiscalQuarter = quarterMatch ? `Q${quarterMatch[1]}` : undefined
// [R2 LEGACY]   const fiscalYear    = quarterMatch ? quarterMatch[2] : year
//
// [R2 LEGACY]   const title = filename
// [R2 LEGACY]     .replace(/\.pdf$/i, '')
// [R2 LEGACY]     .replace(/[-_]/g, ' ')
// [R2 LEGACY]     .replace(/\b\w/g, (c) => c.toUpperCase())
//
// [R2 LEGACY]   return { key, title, filingType, filedAt: new Date().toISOString(), fiscalYear, fiscalQuarter, fileSizeBytes: 0 }
// [R2 LEGACY] }
//
// [R2 LEGACY] export async function getInvestorDocuments(): Promise<InvestorDocument[]> {
// [R2 LEGACY]   const response = await r2.send(
// [R2 LEGACY]     new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 200 })
// [R2 LEGACY]   )
//
// [R2 LEGACY]   if (!response.Contents) return []
//
// [R2 LEGACY]   const documents = await Promise.all(
// [R2 LEGACY]     response.Contents
// [R2 LEGACY]       .filter((obj) => obj.Key?.endsWith('.pdf'))
// [R2 LEGACY]       .map(async (obj) => {
// [R2 LEGACY]         const key    = obj.Key!
// [R2 LEGACY]         const parsed = parseDocumentKey(key)
// [R2 LEGACY]         const url    = await getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: EXPIRY })
// [R2 LEGACY]         return {
// [R2 LEGACY]           ...parsed,
// [R2 LEGACY]           filedAt:       obj.LastModified?.toISOString() ?? parsed.filedAt,
// [R2 LEGACY]           fileSizeBytes: obj.Size ?? 0,
// [R2 LEGACY]           presignedUrl:  url,
// [R2 LEGACY]           expiresAt:     new Date(Date.now() + EXPIRY * 1000).toISOString(),
// [R2 LEGACY]         } satisfies InvestorDocument
// [R2 LEGACY]       })
// [R2 LEGACY]   )
//
// [R2 LEGACY]   return documents.sort((a, b) => new Date(b.filedAt).getTime() - new Date(a.filedAt).getTime())
// [R2 LEGACY] }
//
// [R2 LEGACY] export async function getPresignedDownloadUrl(key: string): Promise<string> {
// [R2 LEGACY]   return getSignedUrl(r2, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: EXPIRY })
// [R2 LEGACY] }
