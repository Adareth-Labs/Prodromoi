import { getNewsArticles } from '@/lib/payload/api'
import { ArticleRow } from '@/components/shared/ArticleRow'
import { Badge } from '@/components/ui/Badge'
import type { Metadata } from 'next'
import type { NewsCategory } from '@/types'

export const revalidate = 300
export const metadata: Metadata = {
  title: 'Newsroom',
  description: 'Press releases, technical disclosures, and corporate announcements from PrecisionCore Automotive.',
}
interface PageProps { searchParams: { category?: string } }

const catVariant: Record<string, 'neutral'|'success'> = { technical:'neutral', corporate:'neutral', esg:'success', financial:'neutral' }

export default async function NewsroomPage({ searchParams }: PageProps) {
  const category = searchParams.category as NewsCategory | undefined
  const { items, total } = await getNewsArticles({ category, limit: 20 })
  const featured = items.find(a => a.featuredMaterial)

  return (
    <div className="max-w-platform mx-auto px-12 py-12">
      <div className="border-b border-stroke pb-6 mb-10">
        <span className="section-label">Press & Corporate Communications</span>
        <h1 className="text-3xl font-medium tracking-tight">Newsroom</h1>
        <p className="text-base text-ink-secondary mt-2">Official repository for press releases, technical disclosures, and corporate announcements. All items are dated and attributed.</p>
      </div>
      <div className="grid grid-cols-[1fr_280px] gap-10">
        <main aria-label="Press archive">
          <div className="bg-surface-low border border-stroke p-4 flex gap-3 items-center mb-6 flex-wrap">
            <input type="search" placeholder="Search archive..." className="flex-1 min-w-48 bg-white border border-stroke px-3 py-2 text-sm" aria-label="Search newsroom" />
            <div className="flex gap-2 flex-wrap">
              {(['all','technical','financial','corporate','esg'] as const).map(cat => (
                <a key={cat} href={cat === 'all' ? '/newsroom' : `?category=${cat}`}
                  className={`font-mono text-xs uppercase px-3 py-1.5 border transition-colors ${(!category && cat==='all')||(category===cat) ? 'bg-action text-white border-action' : 'border-ink-primary text-ink-primary hover:bg-surface-mid'}`}>
                  {cat}
                </a>
              ))}
            </div>
          </div>
          <div>
            {items.map(article => (
              <ArticleRow
                key={article.sys.id}
                href={`/newsroom/${article.slug}`}
                title={article.title}
                summary={article.summary}
                attribution={article.attribution}
                readTime={article.readTimeMinutes}
                publishedAt={article.publishedAt}
                category={article.category}
                categoryVariant={catVariant[article.category] ?? 'neutral'}
              />
            ))}
          </div>
        </main>
        <aside aria-label="Newsroom sidebar">
          <div className="card p-5 mb-5">
            <h2 className="text-sm font-medium mb-4">Categories</h2>
            {[{l:'Technical',n:12},{l:'Corporate',n:8},{l:'ESG',n:5},{l:'Financial',n:14}].map(({l,n})=>(
              <div key={l} className="flex justify-between text-sm mb-2">
                <span>{l}</span>
                <span className="font-mono text-xs border border-stroke px-2 py-0.5 text-ink-secondary">{n}</span>
              </div>
            ))}
          </div>
          {featured && (
            <div className="card p-5">
              <span className="section-label mb-2">Featured Material</span>
              <h3 className="text-sm font-medium mb-2">{featured.title}</h3>
              <p className="text-xs text-ink-secondary mb-4">{featured.summary}</p>
              <a href={`/newsroom/${featured.slug}`} className="block text-center font-mono text-xs border border-ink-primary text-ink-primary px-3 py-2 hover:bg-surface-mid transition-colors">Read Article</a>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
