import type { MetadataRoute } from 'next'
import {
  getAllSolutionSlugs,
  getAllInnovationSlugs,
  getAllNewsSlugs,
} from '@/lib/payload/api'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://precisioncore.com'

  const [solutionSlugs, innovationSlugs, newsSlugs] = await Promise.all([
    getAllSolutionSlugs().catch(() => [] as string[]),
    getAllInnovationSlugs().catch(() => [] as string[]),
    getAllNewsSlugs().catch(() => [] as string[]),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,                        lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${base}/solutions`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${base}/innovation`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/company`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/company/investors`, lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
    { url: `${base}/newsroom`,          lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${base}/careers`,           lastModified: new Date(), changeFrequency: 'daily',   priority: 0.7 },
    { url: `${base}/careers/students`,  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/governance`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/privacy`,           lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]

  const solutionRoutes: MetadataRoute.Sitemap = solutionSlugs.map((slug) => ({
    url:             `${base}/solutions/${slug}`,
    changeFrequency: 'weekly',
    priority:        0.8,
  }))

  const innovationRoutes: MetadataRoute.Sitemap = innovationSlugs.map((slug) => ({
    url:             `${base}/innovation/${slug}`,
    changeFrequency: 'monthly',
    priority:        0.6,
  }))

  const newsRoutes: MetadataRoute.Sitemap = newsSlugs.map((slug) => ({
    url:             `${base}/newsroom/${slug}`,
    changeFrequency: 'yearly',
    priority:        0.6,
  }))

  return [...staticRoutes, ...solutionRoutes, ...innovationRoutes, ...newsRoutes]
}