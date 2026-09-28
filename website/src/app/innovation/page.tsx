import Link from 'next/link'
import { getInnovationArticles } from '@/lib/payload/api'
import { Badge } from '@/components/ui/Badge'
import type { Metadata } from 'next'

export const revalidate = 3600
export const metadata: Metadata = {
  title: 'Innovation & Technology',
  description: 'R&D pipeline and technology editorial from PrecisionCore engineers. Peer-reviewed research on electrification, SDV, cybersecurity, and circular economy.',
}

export default async function InnovationPage() {
  const { items } = await getInnovationArticles({ limit: 20 })
  const featured = items.find((a) => a.featuredOnHomepage) ?? items[0]
  const rest = items.filter((a) => a.sys.id !== featured?.sys.id).slice(0, 4)
  const papers = items.filter((a) => a.isWhitePaper).slice(0, 3)

  return (
    <div className="max-w-platform mx-auto px-12 py-12">
      <div className="border-b border-stroke pb-6 mb-10">
        <span className="section-label">R&D Pipeline</span>
        <h1 className="text-3xl font-medium tracking-tight">Innovation & Technology</h1>
        <p className="text-base text-ink-secondary mt-2 max-w-xl">
          Editorial content authored by PrecisionCore engineers and researchers. All white papers are peer-reviewed.
        </p>
      </div>

      {featured && (
        <Link href={`/innovation/${featured.slug}`} className="grid grid-cols-3 gap-8 card card-hover p-10 mb-6 block">
          <div className="col-span-2">
            <Badge variant="neutral" className="mb-5 inline-block">{featured.category.replace(/-/g, ' ')}</Badge>
            <h2 className="text-2xl font-medium leading-snug mb-4">{featured.title}</h2>
            <p className="text-base text-ink-secondary max-w-md">{featured.summary}</p>
            <div className="mt-6 font-mono text-xs text-ink-secondary">
              {featured.authorName} · {new Date(featured.publishedAt).toLocaleDateString('en-GB',{year:'numeric',month:'short'})} · {featured.readTimeMinutes} min
            </div>
          </div>
          <div className="bg-surface-mid flex items-center justify-center min-h-[200px]">
            <span className="material-symbols-outlined text-5xl text-ink-secondary opacity-30" aria-hidden="true">science</span>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-6 mb-12">
        {rest.map((article) => (
          <Link key={article.sys.id} href={`/innovation/${article.slug}`} className="card card-hover p-8 block">
            <Badge variant="neutral" className="mb-4 inline-block">{article.category.replace(/-/g,' ')}</Badge>
            <h2 className="text-lg font-medium mb-2 leading-snug">{article.title}</h2>
            <p className="text-sm text-ink-secondary mb-4">{article.summary}</p>
            <div className="font-mono text-xs text-ink-secondary">{article.authorName} · {article.readTimeMinutes} min</div>
          </Link>
        ))}
      </div>

      {papers.length > 0 && (
        <section aria-labelledby="wp-heading">
          <div className="border-b-2 border-ink-primary pb-2 mb-6 flex justify-between">
            <h2 id="wp-heading" className="text-xl font-medium">White Papers</h2>
            <span className="font-mono text-xs text-ink-secondary">Gated — email capture</span>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {papers.map((p) => (
              <Link key={p.sys.id} href={`/innovation/${p.slug}`} className="card card-hover p-6 block">
                <h3 className="text-base font-medium mb-2 leading-snug">{p.title}</h3>
                <div className="font-mono text-xs text-ink-secondary">{p.authorName}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}