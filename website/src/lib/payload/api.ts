/**
 * Payload Local API helpers for Next.js server components.
 *
 * Payload is the website CMS. Content is stored in the same Postgres database
 * used by the Payload application, and media is stored in Cloudflare R2.
 */

import { getPayloadHMR } from '@payloadcms/next/utilities'
import config from '@payload-config'
import type {
  Solution,
  InnovationArticle,
  NewsArticle,
  LeadershipProfile,
  Facility,
  BoardMember,
  SiteMetrics,
  PaginatedResponse,
  TechnologyDomain,
  NewsCategory,
} from '@/types'

async function getPayload() {
  return getPayloadHMR({ config })
}

async function queryCollection(args: Parameters<Awaited<ReturnType<typeof getPayload>>['find']>[0]) {
  try {
    const payload = await getPayload()
    return await payload.find(args)
  } catch (err) {
    console.error(`[payload] find failed for collection="${args.collection}"`, err)
    throw err
  }
}

async function queryGlobal(slug: 'site-metrics') {
  try {
    const payload = await getPayload()
    return await payload.findGlobal({ slug })
  } catch (err) {
    console.error(`[payload] global read failed for slug="${slug}"`, err)
    throw err
  }
}

const DOMAIN_TO_PAYLOAD: Record<string, string> = {
  powertrain: 'Powertrain',
  'safety-systems': 'Chassis',
  'adas-autonomy': 'ADAS',
  'thermal-management': 'Thermal',
  'electrical-electronics': 'Connected',
  'body-chassis': 'Chassis',
  interiors: 'Interiors',
}

const PAYLOAD_TO_DOMAIN: Record<string, TechnologyDomain> = {
  EV: 'electrical-electronics',
  ADAS: 'adas-autonomy',
  Powertrain: 'powertrain',
  Thermal: 'thermal-management',
  Chassis: 'body-chassis',
  Connected: 'electrical-electronics',
  Interiors: 'interiors',
}

type PayloadDoc = {
  id?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

type PayloadMedia = PayloadDoc & {
  url?: string
  alt?: string
  filename?: string
  mimeType?: string
  width?: number
  height?: number
  filesize?: number
}

function meta(doc: PayloadDoc) {
  return {
    id: String(doc.id ?? ''),
    createdAt: String(doc.createdAt ?? ''),
    updatedAt: String(doc.updatedAt ?? ''),
  }
}

function richTextToPlainText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const root = (value as Record<string, unknown>).root
  const walk = (node: unknown): string => {
    if (!node || typeof node !== 'object') return ''
    const item = node as Record<string, unknown>
    const ownText = typeof item.text === 'string' ? item.text : ''
    const children = Array.isArray(item.children) ? item.children.map(walk).join('') : ''
    return ownText || children
  }
  return walk(root ?? value).trim()
}

function media(value: unknown) {
  if (!value || typeof value !== 'object') return undefined
  const doc = value as PayloadMedia
  if (!doc.url) return undefined
  return {
    id: String(doc.id ?? ''),
    url: doc.url,
    alt: typeof doc.alt === 'string' ? doc.alt : '',
    filename: typeof doc.filename === 'string' ? doc.filename : undefined,
    mimeType: typeof doc.mimeType === 'string' ? doc.mimeType : undefined,
    width: typeof doc.width === 'number' ? doc.width : undefined,
    height: typeof doc.height === 'number' ? doc.height : undefined,
    filesize: typeof doc.filesize === 'number' ? doc.filesize : undefined,
  }
}

function normaliseSolution(doc: PayloadDoc): Solution {
  const specs = Array.isArray(doc.specs)
    ? doc.specs.map((spec) => {
        const s = spec as Record<string, unknown>
        return {
          label: String(s.label ?? ''),
          value: String(s.value ?? ''),
        }
      })
    : []
  const seo = (doc.seo ?? {}) as Record<string, unknown>

  return {
    sys: meta(doc),
    slug: String(doc.slug ?? ''),
    name: String(doc.title ?? ''),
    partFamily: String(doc.partFamily ?? ''),
    domain: PAYLOAD_TO_DOMAIN[String(doc.domain ?? '')] ?? 'powertrain',
    vehicleSegments: Array.isArray(doc.vehicleSegments) ? doc.vehicleSegments.map(String) as Solution['vehicleSegments'] : [],
    status: String(doc.lifecycleStatus ?? 'active-production') as Solution['status'],
    certifications: Array.isArray(doc.certifications) ? doc.certifications.map(String) as Solution['certifications'] : [],
    shortDescription: String(doc.summary ?? ''),
    fullDescription: String(doc.summary ?? ''),
    specifications: specs,
    oemCompatibility: Array.isArray(doc.oemCompatibility) ? doc.oemCompatibility.map(String) : [],
    heroImage: media(doc.heroImage),
    technicalDataSheetUrl: typeof doc.technicalDataSheetUrl === 'string' ? doc.technicalDataSheetUrl : undefined,
    featuredOnHomepage: Boolean(doc.featuredOnHomepage),
    metaTitle: typeof seo.title === 'string' ? seo.title : undefined,
    metaDescription: typeof seo.description === 'string' ? seo.description : undefined,
  }
}

function normaliseArticle(doc: PayloadDoc): InnovationArticle {
  const seo = (doc.seo ?? {}) as Record<string, unknown>
  return {
    sys: meta(doc),
    slug: String(doc.slug ?? ''),
    title: String(doc.title ?? ''),
    category: String(doc.topicCategory ?? 'electrification') as InnovationArticle['category'],
    authorName: String(doc.authorName ?? ''),
    authorRole: String(doc.authorRole ?? ''),
    publishedAt: String(doc.publishedAt ?? ''),
    readTimeMinutes: Number(doc.readTimeMinutes ?? 0),
    summary: String(doc.excerpt ?? ''),
    body: doc.body ?? null,
    heroImage: media(doc.coverImage),
    isWhitePaper: Boolean(doc.isWhitePaper),
    whitePaperAsset: media(doc.whitePaperAsset),
    featuredOnHomepage: Boolean(doc.featuredOnHomepage),
    metaTitle: typeof seo.title === 'string' ? seo.title : undefined,
    metaDescription: typeof seo.description === 'string' ? seo.description : undefined,
  }
}

function normaliseNews(doc: PayloadDoc): NewsArticle {
  const seo = (doc.seo ?? {}) as Record<string, unknown>
  return {
    sys: meta(doc),
    slug: String(doc.slug ?? ''),
    title: String(doc.title ?? ''),
    category: String(doc.topicCategory ?? 'corporate') as NewsArticle['category'],
    attribution: String(doc.attribution ?? ''),
    publishedAt: String(doc.publishedAt ?? ''),
    readTimeMinutes: Number(doc.readTimeMinutes ?? 0),
    summary: String(doc.excerpt ?? ''),
    body: doc.body ?? null,
    heroImage: undefined,
    featuredMaterial: Boolean(doc.featuredMaterial),
    metaTitle: typeof seo.title === 'string' ? seo.title : undefined,
    metaDescription: typeof seo.description === 'string' ? seo.description : undefined,
  }
}

function normaliseLeadership(doc: PayloadDoc): LeadershipProfile {
  return {
    sys: meta(doc),
    name: String(doc.name ?? ''),
    title: String(doc.jobTitle ?? ''),
    bio: richTextToPlainText(doc.bio),
    photo: media(doc.portrait),
    linkedInUrl: typeof doc.linkedin === 'string' ? doc.linkedin : undefined,
    sortOrder: Number(doc.order ?? 99),
  }
}

function normaliseFacility(doc: PayloadDoc): Facility {
  const coordinates = (doc.coordinates ?? {}) as Record<string, unknown>
  return {
    sys: meta(doc),
    name: String(doc.name ?? ''),
    city: String(doc.location ?? ''),
    country: String(doc.country ?? ''),
    countryCode: String(doc.countryCode ?? ''),
    facilityType: String(doc.facilityType ?? 'manufacturing') as Facility['facilityType'],
    employeeRange: String(doc.employeeRange ?? (doc.headcount ?? '')),
    capabilities: Array.isArray(doc.capabilities) ? doc.capabilities.map(String) : [],
    iatfCertified: Boolean(doc.iatfCertified),
    latitude: Number(coordinates.lat ?? 0),
    longitude: Number(coordinates.lng ?? 0),
  }
}

function normaliseBoardMember(doc: PayloadDoc): BoardMember {
  return {
    sys: meta(doc),
    name: String(doc.name ?? ''),
    title: String(doc.title ?? ''),
    committee: typeof doc.committee === 'string' ? doc.committee : undefined,
    type: String(doc.type ?? 'non-executive') as BoardMember['type'],
    sortOrder: Number(doc.order ?? 99),
  }
}

// ─── Solutions ───────────────────────────────────────────────────────────────

export async function getSolutions(options?: {
  domain?: TechnologyDomain
  limit?: number
  skip?: number
}): Promise<PaginatedResponse<Solution>> {
  const where: Record<string, unknown> = { status: { equals: 'published' } }
  if (options?.domain) where.domain = { equals: DOMAIN_TO_PAYLOAD[options.domain] ?? options.domain }

  const response = await queryCollection({
    collection: 'solutions',
    where,
    sort: 'title',
    limit: options?.limit ?? 24,
    page: options?.skip ? Math.floor(options.skip / (options?.limit ?? 24)) + 1 : undefined,
  })

  return {
    items: response.docs.map((doc) => normaliseSolution(doc as unknown as PayloadDoc)),
    total: response.totalDocs,
    skip: options?.skip ?? 0,
    limit: options?.limit ?? 24,
  }
}

export async function getSolutionBySlug(slug: string): Promise<Solution | null> {
  const { docs } = await queryCollection({
    collection: 'solutions',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    limit: 1,
  })
  return docs[0] ? normaliseSolution(docs[0] as unknown as PayloadDoc) : null
}

export async function getAllSolutionSlugs(): Promise<string[]> {
  const { docs } = await queryCollection({
    collection: 'solutions',
    where: { status: { equals: 'published' } },
    select: { slug: true },
    limit: 1000,
  })
  return docs.map((doc) => String((doc as { slug?: string }).slug ?? ''))
}

// ─── Innovation ──────────────────────────────────────────────────────────────

export async function getInnovationArticles(options?: {
  limit?: number
  skip?: number
}): Promise<PaginatedResponse<InnovationArticle>> {
  const response = await queryCollection({
    collection: 'articles',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: options?.limit ?? 20,
  })
  const limit = options?.limit ?? 20
  return {
    items: response.docs.map((doc) => normaliseArticle(doc as unknown as PayloadDoc)),
    total: response.totalDocs,
    skip: options?.skip ?? 0,
    limit,
  }
}

export async function getInnovationArticleBySlug(slug: string): Promise<InnovationArticle | null> {
  const { docs } = await queryCollection({
    collection: 'articles',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    limit: 1,
  })
  return docs[0] ? normaliseArticle(docs[0] as unknown as PayloadDoc) : null
}

export async function getAllInnovationSlugs(): Promise<string[]> {
  const { docs } = await queryCollection({
    collection: 'articles',
    where: { status: { equals: 'published' } },
    select: { slug: true },
    limit: 1000,
  })
  return docs.map((doc) => String((doc as { slug?: string }).slug ?? ''))
}

// ─── Newsroom ────────────────────────────────────────────────────────────────

export async function getNewsArticles(options?: {
  category?: NewsCategory
  limit?: number
  skip?: number
}): Promise<PaginatedResponse<NewsArticle>> {
  const where: Record<string, unknown> = { status: { equals: 'published' } }
  if (options?.category) where.topicCategory = { equals: options.category }
  const response = await queryCollection({
    collection: 'news',
    where,
    sort: '-publishedAt',
    limit: options?.limit ?? 20,
  })
  const limit = options?.limit ?? 20
  return {
    items: response.docs.map((doc) => normaliseNews(doc as unknown as PayloadDoc)),
    total: response.totalDocs,
    skip: options?.skip ?? 0,
    limit,
  }
}

export async function getNewsArticleBySlug(slug: string): Promise<NewsArticle | null> {
  const { docs } = await queryCollection({
    collection: 'news',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    limit: 1,
  })
  return docs[0] ? normaliseNews(docs[0] as unknown as PayloadDoc) : null
}

export async function getAllNewsSlugs(): Promise<string[]> {
  const { docs } = await queryCollection({
    collection: 'news',
    where: { status: { equals: 'published' } },
    select: { slug: true },
    limit: 1000,
  })
  return docs.map((doc) => String((doc as { slug?: string }).slug ?? ''))
}

// ─── Company ─────────────────────────────────────────────────────────────────

export async function getLeadership(): Promise<LeadershipProfile[]> {
  const { docs } = await queryCollection({ collection: 'leadership', sort: 'order', limit: 50 })
  return docs.map((doc) => normaliseLeadership(doc as unknown as PayloadDoc))
}

export async function getFacilities(): Promise<Facility[]> {
  const { docs } = await queryCollection({ collection: 'facilities', sort: 'name', limit: 100 })
  return docs.map((doc) => normaliseFacility(doc as unknown as PayloadDoc))
}

export async function getBoardMembers(): Promise<BoardMember[]> {
  const { docs } = await queryCollection({ collection: 'board-members', sort: 'order', limit: 50 })
  return docs.map((doc) => normaliseBoardMember(doc as unknown as PayloadDoc))
}

export async function getSiteMetrics(): Promise<SiteMetrics | null> {
  const doc = await queryGlobal('site-metrics') as unknown as PayloadDoc
  if (!doc) return null
  return {
    revenueRunRate: String(doc.revenueRunRate ?? ''),
    revenueYear: String(doc.revenueYear ?? ''),
    facilityCount: Number(doc.facilityCount ?? 0),
    headcount: Number(doc.headcount ?? 0),
    iatfCertifiedCount: Number(doc.iatfCertifiedCount ?? 0),
    countryCount: Number(doc.countryCount ?? 0),
    lastUpdated: String(doc.updatedAt ?? new Date().toISOString()),
  }
}

// Backwards-compatible function names used by existing page components.
export const getArticleBySlug = getInnovationArticleBySlug
export const getAllArticleSlugs = getAllInnovationSlugs
export const getNewsItemBySlug = getNewsArticleBySlug
export const getNewsItems = async (opts?: { type?: string; limit?: number }) =>
  (await getNewsArticles({ limit: opts?.limit })).items
