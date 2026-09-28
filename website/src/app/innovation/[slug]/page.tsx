import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { getInnovationArticleBySlug, getAllInnovationSlugs } from '@/lib/payload/api'
import { documentToReactComponents } from '@/components/RichText'
import type { Metadata } from 'next'

export const revalidate = 3600
interface PageProps { params: { slug: string } }

export async function generateStaticParams() {
  const slugs = await getAllInnovationSlugs()
  return slugs.map((slug) => ({ slug }))
}
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const a = await getInnovationArticleBySlug(params.slug)
  if (!a) return {}
  return { title: a.metaTitle ?? a.title, description: a.metaDescription ?? a.summary }
}
export default async function InnovationArticlePage({ params }: PageProps) {
  const article = await getInnovationArticleBySlug(params.slug)
  if (!article) notFound()
  return (
    <div className="max-w-prose mx-auto px-12 py-12">
      <nav className="font-mono text-xs text-ink-secondary mb-8 flex items-center gap-2" aria-label="Breadcrumb">
        <a href="/innovation" className="hover:text-ink-primary">Innovation</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="truncate">{article.title}</span>
      </nav>
      <Badge variant="neutral" className="mb-6 inline-block">{article.category.replace(/-/g,' ')}</Badge>
      <h1 className="text-3xl font-medium tracking-tight mb-4">{article.title}</h1>
      <div className="flex items-center gap-4 mb-8 border-b border-stroke pb-6">
        <div><div className="text-sm font-medium">{article.authorName}</div><div className="text-xs text-ink-secondary">{article.authorRole}</div></div>
        <div className="font-mono text-xs text-ink-secondary ml-auto">{new Date(article.publishedAt).toLocaleDateString('en-GB',{year:'numeric',month:'long',day:'numeric'})} · {article.readTimeMinutes} min read</div>
      </div>
      <div className="prose prose-neutral max-w-none text-base text-ink-secondary leading-relaxed">
        {article.body ? documentToReactComponents(article.body as Parameters<typeof documentToReactComponents>[0]) : <p>{article.summary}</p>}
      </div>
    </div>
  )
}