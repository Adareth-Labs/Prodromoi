/**
 * Return the Supabase Storage URL for an uploaded automotive image when configured.
 * Otherwise fall back to the bundled copy, so local development still works before
 * the images are uploaded to the public `site-media/automotive/` folder.
 */
export function automotiveImage(filename: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_PUBLIC_URL?.replace(/\/+$/, '')
  const safeFilename = filename.replace(/^\/+/, '')
  return base ? `${base}/automotive/${safeFilename}` : `/images/automotive/${safeFilename}`
}
