import type { Payload } from 'payload'

type ContentfulAssetEntry = {
  sys?: { id?: string }
  fields?: {
    title?: string
    file?: { url: string; fileName: string; contentType: string }
  }
} | undefined

/**
 * Migrates one Contentful asset into Payload's `media` collection.
 * Idempotent: keyed by Contentful's own sys.id (stored in the hidden
 * `contentfulId` field), not the display filename — two unrelated assets
 * can easily share a filename like "hero.jpg", which would otherwise
 * cause the second to silently reuse the first's media doc.
 */
export async function migrateAsset(
  payload: Payload,
  asset: ContentfulAssetEntry,
  dryRun: boolean
): Promise<string | number | null> {
  const file = asset?.fields?.file
  const contentfulId = asset?.sys?.id
  if (!file?.url || !contentfulId) return null

  const existing = await payload.find({
    collection: 'media',
    where: { contentfulId: { equals: contentfulId } },
    limit: 1,
  })
  if (existing.docs[0]) return existing.docs[0].id

  if (dryRun) {
    console.log(`  [dry-run] would download + upload media: ${file.fileName}`)
    return null
  }

  // Contentful asset URLs are protocol-relative ("//images.ctfassets.net/...")
  const url = file.url.startsWith('//') ? `https:${file.url}` : file.url
  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`  [warn] failed to download asset ${file.fileName}: HTTP ${res.status}`)
    return null
  }
  const buffer = Buffer.from(await res.arrayBuffer())

  const doc = await payload.create({
    collection: 'media',
    data: { alt: asset?.fields?.title ?? file.fileName, contentfulId },
    file: {
      data: buffer,
      mimetype: file.contentType,
      name: file.fileName,
      size: buffer.length,
    },
  })
  return doc.id
}
