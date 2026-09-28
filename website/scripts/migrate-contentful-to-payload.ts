/**
 * Contentful → Payload content migration
 * ========================================
 *
 * Usage:
 *   npm run migrate:contentful:dry-run   # logs everything, writes nothing
 *   npm run migrate:contentful           # actually migrates
 *
 * Required env vars:
 *   CONTENTFUL_SPACE_ID, CONTENTFUL_CDA_TOKEN   — Contentful side
 *   DATABASE_URL, PAYLOAD_SECRET                 — Payload side (already
 *     required by payload.config.ts for anything Payload-related to run)
 *   Also needs whatever payload.config.ts requires for media uploads
 *   (S3_CMS_BUCKET, S3_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 *   if any Solutions/Articles/News/Facilities have hero images to migrate.
 *
 * Design notes:
 *   - Idempotent: every content type is upserted by its natural key (slug,
 *     or name for Leadership/BoardMembers), so re-running after a partial
 *     failure does not create duplicates.
 *   - Nothing here silently drops or misclassifies data. Anywhere a value
 *     can't be faithfully mapped (see FLAGGED CASES below), it's forced
 *     into the least-wrong option and logged in the final review report —
 *     never silently dropped, never silently "close enough."
 *
 * FLAGGED CASES needing review (see the end-of-run report):
 *   - Solution.domain: 'safety-systems' and 'electrical-electronics' don't
 *     have exact Payload equivalents and are best-effort mapped (see
 *     DOMAIN_MAP below) — review these on a sample before trusting them at
 *     scale. ('interiors' used to be a third forced guess here; Payload's
 *     Solutions.domain now has a real 'Interiors' option, so that one's an
 *     exact match, not a guess.)
 *   - News items have no source data for Payload's `type` field at all
 *     (Contentful only ever captured subject-area `category`, migrated
 *     separately into `topicCategory`). `type` is optional in Payload for
 *     exactly this reason, so migrated News items are left with `type`
 *     unset rather than forced into a likely-wrong classification —
 *     reclassify by hand when convenient, not before this script can run.
 */

import { createClient } from 'contentful'
import { getPayload, type Payload } from 'payload'
import config from '../payload.config'
import { contentfulRichTextToLexical, plainTextToLexical } from './lib/richTextConvert'
import { migrateAsset } from './lib/assets'

// Mirrors the exact pattern queries.ts already uses successfully — the
// `contentful` SDK's own Entry<T> requires T to extend EntrySkeletonType,
// which is more machinery than a migration script needs. A loose
// structural type, cast once at the fetch boundary, is what the rest of
// this codebase already does for the same reason.
type CFEntry = { sys: { id: string }; fields: Record<string, any> }

const DRY_RUN = process.argv.includes('--dry-run')

const flaggedForReview: string[] = []
function flag(msg: string) {
  flaggedForReview.push(msg)
  console.warn(`  [FLAG] ${msg}`)
}

// Contentful's 7 domain values → Payload's 7 (now a full 1:1 vocabulary —
// 'Interiors' was added to Solutions.domain specifically to close this gap).
const DOMAIN_MAP: Record<string, string> = {
  'powertrain':             'Powertrain',
  'adas-autonomy':          'ADAS',
  'thermal-management':     'Thermal',
  'body-chassis':           'Chassis',
  'interiors':              'Interiors',
  'safety-systems':         'Chassis',   // best-effort — Payload's own label is "Chassis & Safety"
  'electrical-electronics': 'Connected', // best-effort — closest conceptual overlap
}

async function fetchAll(
  contentful: ReturnType<typeof createClient>,
  contentType: string
): Promise<CFEntry[]> {
  const limit = 100
  let skip = 0
  let total = Infinity
  const all: CFEntry[] = []
  while (skip < total) {
    const res = await contentful.getEntries({ content_type: contentType, limit, skip })
    total = res.total
    all.push(...(res.items as unknown as CFEntry[]))
    skip += limit
  }
  return all
}

async function upsert(
  payload: Payload,
  collection: string,
  whereField: string,
  whereValue: string,
  data: Record<string, unknown>
): Promise<'created' | 'updated' | 'dry-run'> {
  if (DRY_RUN) return 'dry-run'
  const existing = await payload.find({
    collection: collection as any,
    where: { [whereField]: { equals: whereValue } },
    limit: 1,
  })
  if (existing.docs[0]) {
    await payload.update({ collection: collection as any, id: existing.docs[0].id, data })
    return 'updated'
  }
  await payload.create({ collection: collection as any, data })
  return 'created'
}

// ── Solutions ──────────────────────────────────────────────────────────────

async function migrateSolutions(contentful: ReturnType<typeof createClient>, payload: Payload) {
  console.log('\n=== Solutions ===')
  const entries = await fetchAll(contentful, 'solution')
  const counts = { created: 0, updated: 0, 'dry-run': 0 }

  for (const entry of entries) {
    const f = entry.fields
    const heroImageId = await migrateAsset(payload, f.heroImage, DRY_RUN)

    let domain = DOMAIN_MAP[f.domain]
    if (!domain) {
      flag(`Solution "${f.slug}": unknown domain "${f.domain}", defaulting to Chassis`)
      domain = 'Chassis'
    } else if (['safety-systems', 'electrical-electronics'].includes(f.domain)) {
      flag(`Solution "${f.slug}": domain "${f.domain}" best-effort mapped to "${domain}" — review`)
    }

    const data = {
      title:                  f.name,
      slug:                   f.slug,
      domain,
      status:                 'published', // fetched via CDA => already live in Contentful
      lifecycleStatus:        f.status,
      partFamily:             f.partFamily,
      vehicleSegments:        f.vehicleSegments ?? [],
      certifications:         f.certifications ?? [],
      oemCompatibility:       f.oemCompatibility ?? [],
      summary:                f.shortDescription,
      body:                   plainTextToLexical(f.fullDescription),
      specs:                  (f.specifications ?? []).map((s: any) => ({ label: s.label, value: s.value })),
      heroImage:              heroImageId ?? undefined,
      technicalDataSheetUrl:  f.technicalDataSheetUrl,
      featuredOnHomepage:     Boolean(f.featuredOnHomepage),
      seo: { title: f.metaTitle, description: f.metaDescription },
    }

    const result = await upsert(payload, 'solutions', 'slug', f.slug, data)
    counts[result]++
    console.log(`  ${result}: ${f.slug}`)
  }
  console.log(`Solutions: ${JSON.stringify(counts)}`)
}

// ── Articles (InnovationArticle) ────────────────────────────────────────────

async function migrateArticles(contentful: ReturnType<typeof createClient>, payload: Payload) {
  console.log('\n=== Articles ===')
  const entries = await fetchAll(contentful, 'innovationArticle')
  const counts = { created: 0, updated: 0, 'dry-run': 0 }

  for (const entry of entries) {
    const f = entry.fields
    const heroImageId = await migrateAsset(payload, f.heroImage, DRY_RUN)
    const whitePaperId = f.isWhitePaper ? await migrateAsset(payload, f.whitePaperAsset, DRY_RUN) : null

    const { lexical: body, report } = contentfulRichTextToLexical(f.body)
    if (report.unsupportedNodes.length) {
      flag(`Article "${f.slug}": body had unsupported node types [${[...new Set(report.unsupportedNodes)].join(', ')}] — review placeholders in body`)
    }

    const data = {
      title:              f.title,
      slug:               f.slug,
      // domain: intentionally left unset — Contentful never captured a
      // product-domain classification for innovation articles, only topic.
      topicCategory:      f.category,
      authorName:         f.authorName,
      authorRole:         f.authorRole,
      readTimeMinutes:    f.readTimeMinutes,
      summary:            f.summary,
      body,
      heroImage:          heroImageId ?? undefined,
      isWhitePaper:       Boolean(f.isWhitePaper),
      whitePaperAsset:    whitePaperId ?? undefined,
      featuredOnHomepage: Boolean(f.featuredOnHomepage),
      seo: { title: f.metaTitle, description: f.metaDescription },
    }

    const result = await upsert(payload, 'articles', 'slug', f.slug, data)
    counts[result]++
    console.log(`  ${result}: ${f.slug}`)
  }
  console.log(`Articles: ${JSON.stringify(counts)}`)
}

// ── News ─────────────────────────────────────────────────────────────────

async function migrateNews(contentful: ReturnType<typeof createClient>, payload: Payload) {
  console.log('\n=== News ===')
  const entries = await fetchAll(contentful, 'newsArticle')
  const counts = { created: 0, updated: 0, 'dry-run': 0 }

  for (const entry of entries) {
    const f = entry.fields
    const heroImageId = await migrateAsset(payload, f.heroImage, DRY_RUN)

    const { lexical: body, report } = contentfulRichTextToLexical(f.body)
    if (report.unsupportedNodes.length) {
      flag(`News "${f.slug}": body had unsupported node types [${[...new Set(report.unsupportedNodes)].join(', ')}] — review placeholders in body`)
    }

    const data = {
      title:            f.title,
      slug:             f.slug,
      // type: intentionally left unset — Contentful never captured this
      // classification at all (only topicCategory, migrated below), and
      // the field is no longer required, so a missing value is honest
      // rather than a forced, likely-wrong default.
      topicCategory:    f.category,
      attribution:      f.attribution,
      readTimeMinutes:  f.readTimeMinutes,
      summary:          f.summary,
      body,
      heroImage:        heroImageId ?? undefined,
      featuredMaterial: Boolean(f.featuredMaterial),
      seo: { title: f.metaTitle, description: f.metaDescription },
    }

    const result = await upsert(payload, 'news', 'slug', f.slug, data)
    counts[result]++
    console.log(`  ${result}: ${f.slug}`)
  }
  console.log(`News: ${JSON.stringify(counts)}`)
}

// ── Leadership ───────────────────────────────────────────────────────────

async function migrateLeadership(contentful: ReturnType<typeof createClient>, payload: Payload) {
  console.log('\n=== Leadership ===')
  const entries = await fetchAll(contentful, 'leadershipProfile')
  const counts = { created: 0, updated: 0, 'dry-run': 0 }

  for (const entry of entries) {
    const f = entry.fields
    const portraitId = await migrateAsset(payload, f.photo, DRY_RUN)
    if (!portraitId && !DRY_RUN) {
      flag(`Leadership "${f.name}": Payload's "portrait" field is required but no photo could be migrated — will fail to save until one is added manually`)
    }

    const data = {
      contentfulId: entry.sys.id,
      name:       f.name,
      jobTitle:   f.title,
      bio:        plainTextToLexical(f.bio),
      portrait:   portraitId ?? undefined,
      linkedin:   f.linkedInUrl,
      order:      f.sortOrder,
      // department: intentionally left unset — no Contentful source exists
    }

    const result = await upsert(payload, 'leadership', 'contentfulId', entry.sys.id, data)
    counts[result]++
    console.log(`  ${result}: ${f.name}`)
  }
  console.log(`Leadership: ${JSON.stringify(counts)}`)
}

// ── Facilities ───────────────────────────────────────────────────────────

async function migrateFacilities(contentful: ReturnType<typeof createClient>, payload: Payload) {
  console.log('\n=== Facilities ===')
  const entries = await fetchAll(contentful, 'facility')
  const counts = { created: 0, updated: 0, 'dry-run': 0 }

  for (const entry of entries) {
    const f = entry.fields

    const data = {
      contentfulId:   entry.sys.id,
      name:           f.name,
      location:       f.city,
      country:        f.country,
      countryCode:    f.countryCode,
      facilityType:   f.facilityType,
      employeeRange:  f.employeeRange,
      iatfCertified:  Boolean(f.iatfCertified),
      capabilities:   f.capabilities ?? [],
      // specialties: intentionally left unset — Contentful's free-text
      // `capabilities` doesn't map cleanly onto this fixed enum; see
      // `capabilities` field above for the raw migrated values instead.
      coordinates: { lat: f.latitude, lng: f.longitude },
    }

    const result = await upsert(payload, 'facilities', 'contentfulId', entry.sys.id, data)
    counts[result]++
    console.log(`  ${result}: ${f.name}`)
  }
  console.log(`Facilities: ${JSON.stringify(counts)}`)
}

// ── Board members ────────────────────────────────────────────────────────

async function migrateBoardMembers(contentful: ReturnType<typeof createClient>, payload: Payload) {
  console.log('\n=== Board members ===')
  const entries = await fetchAll(contentful, 'boardMember')
  const counts = { created: 0, updated: 0, 'dry-run': 0 }

  for (const entry of entries) {
    const f = entry.fields
    const data = {
      contentfulId: entry.sys.id,
      name:      f.name,
      title:     f.title,
      committee: f.committee,
      type:      f.type,
      order:     f.sortOrder,
    }
    const result = await upsert(payload, 'board-members', 'contentfulId', entry.sys.id, data)
    counts[result]++
    console.log(`  ${result}: ${f.name}`)
  }
  console.log(`Board members: ${JSON.stringify(counts)}`)
}

// ── Site metrics (Global — one document, not a collection) ─────────────────

async function migrateSiteMetrics(contentful: ReturnType<typeof createClient>, payload: Payload) {
  console.log('\n=== Site metrics ===')
  const entries = await fetchAll(contentful, 'siteMetrics')
  if (!entries.length) {
    console.log('  no siteMetrics entry found in Contentful — nothing to migrate')
    return
  }
  if (entries.length > 1) {
    flag(`siteMetrics: found ${entries.length} entries in Contentful, expected exactly 1 (a singleton) — using the first, review the rest by hand`)
  }
  const f = entries[0].fields
  const data = {
    revenueRunRate:      f.revenueRunRate,
    revenueYear:         f.revenueYear,
    facilityCount:       f.facilityCount,
    headcount:           f.headcount,
    iatfCertifiedCount:  f.iatfCertifiedCount,
    countryCount:        f.countryCount,
  }
  if (DRY_RUN) {
    console.log('  [dry-run] would update site-metrics global')
  } else {
    await payload.updateGlobal({ slug: 'site-metrics', data })
    console.log('  updated site-metrics global')
  }
}

// ── Entrypoint ───────────────────────────────────────────────────────────

async function main() {
  if (DRY_RUN) console.log('*** DRY RUN — no writes will be performed ***')

  const spaceId = process.env.CONTENTFUL_SPACE_ID
  const accessToken = process.env.CONTENTFUL_CDA_TOKEN
  if (!spaceId || !accessToken) {
    console.error('Missing CONTENTFUL_SPACE_ID or CONTENTFUL_CDA_TOKEN')
    process.exit(1)
  }

  const contentful = createClient({ space: spaceId, accessToken })
  const payload = await getPayload({ config })

  await migrateSolutions(contentful, payload)
  await migrateArticles(contentful, payload)
  await migrateNews(contentful, payload)
  await migrateLeadership(contentful, payload)
  await migrateFacilities(contentful, payload)
  await migrateBoardMembers(contentful, payload)
  await migrateSiteMetrics(contentful, payload)

  console.log(`\n${'='.repeat(60)}`)
  console.log(DRY_RUN ? 'DRY RUN COMPLETE — nothing was written.' : 'MIGRATION COMPLETE.')
  if (flaggedForReview.length) {
    console.log(`\n${flaggedForReview.length} item(s) need manual review:\n`)
    flaggedForReview.forEach((f) => console.log(`  - ${f}`))
  } else {
    console.log('No items flagged for review.')
  }

  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
