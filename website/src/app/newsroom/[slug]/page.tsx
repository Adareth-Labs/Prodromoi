import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { getNewsArticleBySlug, getAllNewsSlugs } from '@/lib/payload/api'
import { RichText } from '@/components/RichText'
import { format } from 'date-fns'
import type { Metadata } from 'next'

export const revalidate = 300
interface PageProps { params: { slug: string } }

export async function generateStaticParams() {
  const slugs = await getAllNewsSlugs()
  return slugs.map(slug => ({ slug }))
}
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const a = await getNewsArticleBySlug(params.slug)
  if (!a) return {}
  return { title: a.metaTitle ?? a.title, description: a.metaDescription ?? a.summary }
}
export default async function NewsArticlePage({ params }: PageProps) {
  const article = await getNewsArticleBySlug(params.slug)
  if (!article) notFound()
  return (
    <div className="max-w-prose mx-auto px-12 py-12">
      <nav className="font-mono text-xs text-ink-secondary mb-8 flex items-center gap-2" aria-label="Breadcrumb">
        <a href="/newsroom" className="hover:text-ink-primary">Newsroom</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="truncate">{article.title}</span>
      </nav>
      <Badge variant="neutral" className="mb-4 inline-block">{article.category}</Badge>
      <h1 className="text-3xl font-medium tracking-tight mb-4">{article.title}</h1>
      <div className="flex items-center gap-3 border-b border-stroke pb-6 mb-8 font-mono text-xs text-ink-secondary">
        <time dateTime={article.publishedAt}>{format(new Date(article.publishedAt),'d MMMM yyyy')}</time>
        <span>·</span><span>{article.attribution}</span>
        <span>·</span><span>{article.readTimeMinutes} min read</span>
      </div>
      <div className="text-base text-ink-secondary leading-relaxed">
        {article.body ? <RichText data={article.body} /> : <p>{article.summary}</p>}
      </div>
    </div>
  )
}

