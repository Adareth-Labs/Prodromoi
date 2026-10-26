import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '@/config/env'
import { auditService } from '@/services/audit/AuditService'
import type { PortalTier } from '@/types'
import { randomUUID } from 'crypto'

// Active provider: Supabase Storage's S3-compatible endpoint. Generate S3-compatible
// signed URLs on the server; never expose these credentials to browser code.
const supabaseStorageS3 = new S3Client({
  region: env.SUPABASE_STORAGE_S3_REGION,
  endpoint: env.SUPABASE_STORAGE_S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: env.SUPABASE_STORAGE_S3_ACCESS_KEY_ID,
    secretAccessKey: env.SUPABASE_STORAGE_S3_SECRET_ACCESS_KEY,
  },
})

/*
 * LEGACY CLOUDFLARE R2 CLIENT — intentionally commented out, not deleted.
 * Restore only as part of an explicit rollback after updating the environment.
 *
 * const r2 = new S3Client({
 *   region: 'auto',
 *   endpoint: env.R2_ENDPOINT,
 *   credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
 * })
 */

// Upload windows are short-lived on purpose — the client is expected to
// start the PUT immediately after requesting the URL.
const UPLOAD_URL_EXPIRY_SECONDS = 300 // 5 min

// Key structure: {resourceType}/{supplierId}/{resourceId}/{fileName}
// e.g. rfq/sup-123/rfq-456/drawing.pdf
// e.g. ppap/sup-123/ppap-789/control_plan.pdf
// e.g. certs/sup-123/iatf-cert.pdf

interface BuildKeyInput {
  resourceType: string
  supplierId:   string
  resourceId:   string
  fileName:     string
}

interface GetUploadUrlInput {
  key:         string
  contentType: string
  sizeBytes:   number
  expiresIn?:  number
}

interface GetDownloadUrlInput {
  key:        string
  expiresIn?: number
}

interface AuditDownloadInput {
  key:        string
  actorId:    string
  actorEmail: string
  actorTier:  PortalTier
  supplierId: string
  ipAddress:  string
}

class DocumentService {
  buildKey({ resourceType, supplierId, resourceId, fileName }: BuildKeyInput): string {
    const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    return `${resourceType}/${supplierId}/${resourceId}/${randomUUID()}_${sanitized}`
  }

  async getUploadUrl({
    key,
    contentType,
    sizeBytes,
    expiresIn = UPLOAD_URL_EXPIRY_SECONDS,
  }: GetUploadUrlInput): Promise<string> {
    const command = new PutObjectCommand({
      Bucket:      env.SUPABASE_STORAGE_DOCUMENTS_BUCKET,
      Key:         key,
      ContentType: contentType,
      ContentLength: sizeBytes,
    })
    return getSignedUrl(supabaseStorageS3, command, { expiresIn })
  }

  async getDownloadUrl({
    key,
    expiresIn = env.STORAGE_SIGNED_URL_EXPIRY,
  }: GetDownloadUrlInput): Promise<string> {
    const command = new GetObjectCommand({ Bucket: env.SUPABASE_STORAGE_DOCUMENTS_BUCKET, Key: key })
    return getSignedUrl(supabaseStorageS3, command, { expiresIn })
  }

  async getObjectMetadata(key: string): Promise<{ sizeBytes: number; contentType?: string }> {
    const result = await supabaseStorageS3.send(new HeadObjectCommand({
      Bucket: env.SUPABASE_STORAGE_DOCUMENTS_BUCKET,
      Key: key,
    }))
    return { sizeBytes: result.ContentLength ?? -1, contentType: result.ContentType }
  }

  async delete(key: string): Promise<void> {
    await supabaseStorageS3.send(new DeleteObjectCommand({ Bucket: env.SUPABASE_STORAGE_DOCUMENTS_BUCKET, Key: key }))
  }

  // Log every document download for IATF 16949 compliance
  async auditDownload(params: AuditDownloadInput): Promise<void> {
    await auditService.log({
      action:       'DOWNLOAD',
      actorId:      params.actorId,
      actorEmail:   params.actorEmail,
      actorTier:    params.actorTier,
      ipAddress:    params.ipAddress,
      resourceType: 'Document',
      resourceId:   params.key,
      supplierId:   params.supplierId,
      metadata:     { storageProvider: 'supabase', storageKey: params.key },
    })
  }
}

export const documentService = new DocumentService()
