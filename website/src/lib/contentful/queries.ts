import { getClient } from './client'
import type {
  Solution,
  InnovationArticle,
  NewsArticle,
  LeadershipProfile,
  Facility,
  BoardMember,
  SiteMetrics,
  TechnologyDomain,
  NewsCategory,
  PaginatedResponse,
} from '@/types'

// Every query function below used to call `client.getEntries(...)` directly
// with no error handling — a Contentful outage or bad query would surface
// as an unhandled rejection instead of a logged, traceable failure. This is
// the single place that call goes through now.
async function fetchEntries(client: ReturnType<typeof getClient>, query: Record<string, unknown>) {
  try {
    return await client.getEntries(query)
  } catch (err) {
    console.error(`[contentful] getEntries failed for content_type="${query.content_type}"`, err)
    throw err
  }
}

// ── SOLUTIONS ──────────────────────────────────────────────────────────────────

export async function getSolutions(options?: {
  domain?: TechnologyDomain
  limit?: number
  skip?: number
  preview?: boolean
}): Promise<PaginatedResponse<Solution>> {
  const client = getClient(options?.preview)
  const query: Record<string, unknown> = {
    content_type: 'solution',
    order: ['-fields.featuredOnHomepage', 'fields.name'],
    limit: options?.limit ?? 24,
    skip: options?.skip ?? 0,
  }

  if (options?.domain) {
    query['fields.domain'] = options.domain
  }

  const response = await fetchEntries(client, query)

  return {
    items: response.items.map(normaliseSolution),
    total: response.total,
    skip:  response.skip,
    limit: response.limit,
  }
}

export async function getSolutionBySlug(
  slug: string,
  preview = false
): Promise<Solution | null> {
  const client = getClient(preview)
  const response = await fetchEntries(client, {
    content_type: 'solution',
    'fields.slug': slug,
    limit: 1,
  })

  if (response.items.length === 0) return null
  return normaliseSolution(response.items[0])
}

export async function getAllSolutionSlugs(): Promise<string[]> {
  const client = getClient()
  const response = await fetchEntries(client, {
    content_type: 'solution',
    select: ['fields.slug'],
    limit: 1000,
  })
  return response.items.map(
    (item) => (item.fields as { slug: string }).slug
  )
}

// ── INNOVATION ────────────────────────────────────────────────────────────────

export async function getInnovationArticles(options?: {
  limit?: number
  skip?: number
  preview?: boolean
}): Promise<PaginatedResponse<InnovationArticle>> {
  const client = getClient(options?.preview)
  const response = await fetchEntries(client, {
    content_type: 'innovationArticle',
    order: ['-fields.publishedAt'],
    limit: options?.limit ?? 20,
    skip:  options?.skip ?? 0,
  })

  return {
    items: response.items.map(normaliseInnovationArticle),
    total: response.total,
    skip:  response.skip,
    limit: response.limit,
  }
}

export async function getInnovationArticleBySlug(
  slug: string,
  preview = false
): Promise<InnovationArticle | null> {
  const client = getClient(preview)
  const response = await fetchEntries(client, {
    content_type: 'innovationArticle',
    'fields.slug': slug,
    limit: 1,
  })

  if (response.items.length === 0) return null
  return normaliseInnovationArticle(response.items[0])
}

export async function getAllInnovationSlugs(): Promise<string[]> {
  const client = getClient()
  const response = await fetchEntries(client, {
    content_type: 'innovationArticle',
    select: ['fields.slug'],
    limit: 1000,
  })
  return response.items.map(
    (item) => (item.fields as { slug: string }).slug
  )
}

// ── NEWSROOM ──────────────────────────────────────────────────────────────────

export async function getNewsArticles(options?: {
  category?: NewsCategory
  limit?: number
  skip?: number
  preview?: boolean
}): Promise<PaginatedResponse<NewsArticle>> {
  const client = getClient(options?.preview)
  const query: Record<string, unknown> = {
    content_type: 'newsArticle',
    order: ['-fields.publishedAt'],
    limit: options?.limit ?? 20,
    skip:  options?.skip ?? 0,
  }

  if (options?.category) {
    query['fields.category'] = options.category
  }

  const response = await fetchEntries(client, query)

  return {
    items: response.items.map(normaliseNewsArticle),
    total: response.total,
    skip:  response.skip,
    limit: response.limit,
  }
}

export async function getNewsArticleBySlug(
  slug: string,
  preview = false
): Promise<NewsArticle | null> {
  const client = getClient(preview)
  const response = await fetchEntries(client, {
    content_type: 'newsArticle',
    'fields.slug': slug,
    limit: 1,
  })

  if (response.items.length === 0) return null
  return normaliseNewsArticle(response.items[0])
}

export async function getAllNewsSlugs(): Promise<string[]> {
  const client = getClient()
  const response = await fetchEntries(client, {
    content_type: 'newsArticle',
    select: ['fields.slug'],
    limit: 1000,
  })
  return response.items.map(
    (item) => (item.fields as { slug: string }).slug
  )
}

// ── COMPANY ───────────────────────────────────────────────────────────────────

export async function getLeadership(preview = false): Promise<LeadershipProfile[]> {
  const client = getClient(preview)
  const response = await fetchEntries(client, {
    content_type: 'leadershipProfile',
    order: ['fields.sortOrder'],
    limit: 50,
  })
  return response.items.map(normaliseLeadershipProfile)
}

export async function getFacilities(preview = false): Promise<Facility[]> {
  const client = getClient(preview)
  const response = await fetchEntries(client, {
    content_type: 'facility',
    order: ['fields.country', 'fields.city'],
    limit: 200,
  })
  return response.items.map(normaliseFacility)
}

export async function getBoardMembers(preview = false): Promise<BoardMember[]> {
  const client = getClient(preview)
  const response = await fetchEntries(client, {
    content_type: 'boardMember',
    order: ['fields.sortOrder'],
    limit: 50,
  })
  return response.items.map(normaliseBoardMember)
}

// ── SITE METRICS ───────────────────────────────────────────────────────────────

export async function getSiteMetrics(preview = false): Promise<SiteMetrics | null> {
  const client = getClient(preview)
  const response = await fetchEntries(client, {
    content_type: 'siteMetrics',
    limit: 1,
  })

  if (response.items.length === 0) return null
  const fields = response.items[0].fields as Record<string, unknown>
  return {
    revenueRunRate:      fields.revenueRunRate as string,
    revenueYear:         fields.revenueYear as string,
    facilityCount:       fields.facilityCount as number,
    headcount:           fields.headcount as number,
    iatfCertifiedCount:  fields.iatfCertifiedCount as number,
    countryCount:        fields.countryCount as number,
    lastUpdated:         fields.lastUpdated as string,
  }
}

// ── NORMALISERS ────────────────────────────────────────────────────────────────
// Map raw Contentful entries to typed domain objects
// These shield the rest of the application from Contentful's data shape

function normaliseSolution(entry: { sys: { id: string; createdAt: string; updatedAt: string }; fields: Record<string, unknown> }): Solution {
  const f = entry.fields
  return {
    sys:               { id: entry.sys.id, createdAt: entry.sys.createdAt, updatedAt: entry.sys.updatedAt },
    slug:              f.slug as string,
    name:              f.name as string,
    partFamily:        f.partFamily as string,
    domain:            f.domain as Solution['domain'],
    vehicleSegments:   (f.vehicleSegments as string[]) ?? [],
    status:            f.status as Solution['status'],
    certifications:    (f.certifications as Solution['certifications']) ?? [],
    shortDescription:  f.shortDescription as string,
    fullDescription:   f.fullDescription as string,
    specifications:    (f.specifications as Solution['specifications']) ?? [],
    oemCompatibility:  (f.oemCompatibility as string[]) ?? [],
    heroImage:         f.heroImage as Solution['heroImage'],
    technicalDataSheetUrl: f.technicalDataSheetUrl as string | undefined,
    featuredOnHomepage: Boolean(f.featuredOnHomepage),
    metaTitle:         f.metaTitle as string | undefined,
    metaDescription:   f.metaDescription as string | undefined,
  }
}

function normaliseInnovationArticle(entry: { sys: { id: string; createdAt: string; updatedAt: string }; fields: Record<string, unknown> }): InnovationArticle {
  const f = entry.fields
  return {
    sys:               { id: entry.sys.id, createdAt: entry.sys.createdAt, updatedAt: entry.sys.updatedAt },
    slug:              f.slug as string,
    title:             f.title as string,
    category:          f.category as InnovationArticle['category'],
    authorName:        f.authorName as string,
    authorRole:        f.authorRole as string,
    publishedAt:       f.publishedAt as string,
    readTimeMinutes:   f.readTimeMinutes as number,
    summary:           f.summary as string,
    body:              f.body,
    heroImage:         f.heroImage as InnovationArticle['heroImage'],
    isWhitePaper:      Boolean(f.isWhitePaper),
    whitePaperAsset:   f.whitePaperAsset as InnovationArticle['whitePaperAsset'],
    featuredOnHomepage: Boolean(f.featuredOnHomepage),
    metaTitle:         f.metaTitle as string | undefined,
    metaDescription:   f.metaDescription as string | undefined,
  }
}

function normaliseNewsArticle(entry: { sys: { id: string; createdAt: string; updatedAt: string }; fields: Record<string, unknown> }): NewsArticle {
  const f = entry.fields
  return {
    sys:              { id: entry.sys.id, createdAt: entry.sys.createdAt, updatedAt: entry.sys.updatedAt },
    slug:             f.slug as string,
    title:            f.title as string,
    category:         f.category as NewsArticle['category'],
    attribution:      f.attribution as string,
    publishedAt:      f.publishedAt as string,
    readTimeMinutes:  f.readTimeMinutes as number,
    summary:          f.summary as string,
    body:             f.body,
    heroImage:        f.heroImage as NewsArticle['heroImage'],
    featuredMaterial: Boolean(f.featuredMaterial),
    metaTitle:        f.metaTitle as string | undefined,
    metaDescription:  f.metaDescription as string | undefined,
  }
}

function normaliseLeadershipProfile(entry: { sys: { id: string; createdAt: string; updatedAt: string }; fields: Record<string, unknown> }): LeadershipProfile {
  const f = entry.fields
  return {
    sys:        { id: entry.sys.id, createdAt: entry.sys.createdAt, updatedAt: entry.sys.updatedAt },
    name:       f.name as string,
    title:      f.title as string,
    bio:        f.bio as string,
    photo:      f.photo as LeadershipProfile['photo'],
    linkedInUrl: f.linkedInUrl as string | undefined,
    sortOrder:  f.sortOrder as number,
  }
}

function normaliseFacility(entry: { sys: { id: string; createdAt: string; updatedAt: string }; fields: Record<string, unknown> }): Facility {
  const f = entry.fields
  return {
    sys:           { id: entry.sys.id, createdAt: entry.sys.createdAt, updatedAt: entry.sys.updatedAt },
    name:          f.name as string,
    city:          f.city as string,
    country:       f.country as string,
    countryCode:   f.countryCode as string,
    facilityType:  f.facilityType as Facility['facilityType'],
    employeeRange: f.employeeRange as string,
    capabilities:  (f.capabilities as string[]) ?? [],
    iatfCertified: Boolean(f.iatfCertified),
    latitude:      f.latitude as number,
    longitude:     f.longitude as number,
  }
}

function normaliseBoardMember(entry: { sys: { id: string; createdAt: string; updatedAt: string }; fields: Record<string, unknown> }): BoardMember {
  const f = entry.fields
  return {
    sys:       { id: entry.sys.id, createdAt: entry.sys.createdAt, updatedAt: entry.sys.updatedAt },
    name:      f.name as string,
    title:     f.title as string,
    committee: f.committee as string | undefined,
    type:      f.type as BoardMember['type'],
    sortOrder: f.sortOrder as number,
  }
}
