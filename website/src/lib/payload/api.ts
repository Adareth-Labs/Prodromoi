/**
 * Payload Local API helpers for Next.js server components.
 *
 * These are drop-in replacements for the old src/lib/contentful/queries.ts
 * functions. The function signatures are identical so page components need
 * no changes — only the import path changes:
 *
 *   - import { getSolutions } from '@/lib/contentful/queries'
 *   + import { getSolutions } from '@/lib/payload/api'
 */

import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import type { Solution, Article, NewsItem, Leader, Facility } from '@/types'

// The Local API is a direct in-process call — no HTTP overhead, no rate limits.
async function getPayload() {
  return getPayloadHMR({ config })
}

// Every function below used to call `getPayload()` then `payload.find(...)`
// directly with no error handling — a Payload/DB failure would surface as
// an unhandled rejection instead of a logged, traceable failure. This is
// the single place that pair of calls goes through now.
async function queryCollection(args: Parameters<Awaited<ReturnType<typeof getPayload>>['find']>[0]) {
  try {
    const payload = await getPayload()
    return await payload.find(args)
  } catch (err) {
    console.error(`[payload] find failed for collection="${args.collection}"`, err)
    throw err
  }
}

// ─── Solutions ───────────────────────────────────────────────────────────────

export async function getSolutions(domain?: string): Promise<Solution[]> {
  const where = domain ? { domain: { equals: domain } } : {}
  const { docs } = await queryCollection({
    collection: 'solutions',
    where:      { ...where, status: { equals: 'published' } },
    sort:       'title',
    limit:      100,
  })
  return docs as unknown as Solution[]
}

export async function getSolutionBySlug(slug: string): Promise<Solution | null> {
  const { docs } = await queryCollection({
    collection: 'solutions',
    where:      { slug: { equals: slug }, status: { equals: 'published' } },
    limit: 1,
  })
  return (docs[0] as unknown as Solution) ?? null
}

// ─── Innovation articles ─────────────────────────────────────────────────────

export async function getArticles(opts?: { domain?: string; limit?: number }): Promise<Article[]> {
  const where: Record<string, unknown> = { status: { equals: 'published' } }
  if (opts?.domain) where.domain = { equals: opts.domain }
  const { docs } = await queryCollection({
    collection: 'articles',
    where,
    sort:  '-publishedAt',
    limit: opts?.limit ?? 20,
  })
  return docs as unknown as Article[]
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { docs } = await queryCollection({
    collection: 'articles',
    where:      { slug: { equals: slug }, status: { equals: 'published' } },
    limit: 1,
  })
  return (docs[0] as unknown as Article) ?? null
}

// ─── Newsroom ────────────────────────────────────────────────────────────────

export async function getNewsItems(opts?: { type?: string; limit?: number }): Promise<NewsItem[]> {
  const where: Record<string, unknown> = { status: { equals: 'published' } }
  if (opts?.type) where.type = { equals: opts.type }
  const { docs } = await queryCollection({
    collection: 'news',
    where,
    sort:  '-publishedAt',
    limit: opts?.limit ?? 20,
  })
  return docs as unknown as NewsItem[]
}

export async function getNewsItemBySlug(slug: string): Promise<NewsItem | null> {
  const { docs } = await queryCollection({
    collection: 'news',
    where:      { slug: { equals: slug }, status: { equals: 'published' } },
    limit: 1,
  })
  return (docs[0] as unknown as NewsItem) ?? null
}

// ─── Leadership ──────────────────────────────────────────────────────────────

export async function getLeadership(): Promise<Leader[]> {
  const { docs } = await queryCollection({
    collection: 'leadership',
    sort:        'order',
    limit:       50,
  })
  return docs as unknown as Leader[]
}

// ─── Facilities ──────────────────────────────────────────────────────────────

export async function getFacilities(): Promise<Facility[]> {
  const { docs } = await queryCollection({
    collection: 'facilities',
    sort:        'name',
    limit:       50,
  })
  return docs as unknown as Facility[]
}

// ─── Slug lists (for generateStaticParams) ───────────────────────────────────

export async function getAllSolutionSlugs(): Promise<string[]> {
  const { docs } = await queryCollection({
    collection: 'solutions',
    where:      { status: { equals: 'published' } },
    select:     { slug: true },
    limit:      200,
  })
  return docs.map((d) => d.slug as string)
}

export async function getAllArticleSlugs(): Promise<string[]> {
  const { docs } = await queryCollection({
    collection: 'articles',
    where:      { status: { equals: 'published' } },
    select:     { slug: true },
    limit:      200,
  })
  return docs.map((d) => d.slug as string)
}

export async function getAllNewsSlugs(): Promise<string[]> {
  const { docs } = await queryCollection({
    collection: 'news',
    where:      { status: { equals: 'published' } },
    select:     { slug: true },
    limit:      200,
  })
  return docs.map((d) => d.slug as string)
}
