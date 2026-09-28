import { Suspense } from 'react'
import { DomainFilter } from '@/components/solutions/DomainFilter'
import { ProductCard } from '@/components/solutions/ProductCard'
import { getSolutions } from '@/lib/payload/api'
import type { Metadata } from 'next'
import type { TechnologyDomain } from '@/types'

export const revalidate = parseInt(process.env.REVALIDATE_SOLUTIONS ?? '3600', 10)

export const metadata: Metadata = {
  title: 'Solutions Catalog',
  description: 'Structured product records for high-performance automotive components. Filter by technology domain, vehicle segment, and certification.',
}

interface PageProps {
  searchParams: { domain?: string; cert?: string | string[]; page?: string }
}

export default async function SolutionsPage({ searchParams }: PageProps) {
  const domain = searchParams.domain as TechnologyDomain | undefined
  const page   = parseInt(searchParams.page ?? '1', 10)
  const limit  = 12
  const skip   = (page - 1) * limit

  const { items, total } = await getSolutions({ domain, limit, skip })
  const pageCount = Math.ceil(total / limit)

  const domainLabels: Record<string, string> = {
    'powertrain':             'Powertrain Domain',
    'safety-systems':         'Safety Systems Domain',
    'adas-autonomy':          'ADAS & Autonomy Domain',
    'thermal-management':     'Thermal Management Domain',
    'electrical-electronics': 'Electronics Domain',
    'body-chassis':           'Body & Chassis Domain',
    'interiors':              'Interiors Domain',
  }
  const title = domain ? (domainLabels[domain] ?? 'Solutions Catalog') : 'All Solutions'

  return (
    <div className="flex min-h-screen">
      <Suspense fallback={null}>
        <DomainFilter />
      </Suspense>

      <main className="flex-1 p-12 overflow-y-auto" aria-label="Solutions catalog">
        <div className="flex justify-between items-end border-b border-stroke pb-4 mb-8">
          <div>
            <h1 className="text-3xl font-medium tracking-tight mb-1">{title}</h1>
            <p className="text-sm text-ink-secondary">
              {total} product{total !== 1 ? 's' : ''} — all items include specifications and direct RFQ access
            </p>
          </div>
          <div className="font-mono text-xs text-ink-secondary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">sort</span>
            Sort: Performance Rating
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24 text-ink-secondary">
            <span className="material-symbols-outlined text-5xl block mb-4 opacity-30" aria-hidden="true">search_off</span>
            <p>No products found for the selected filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {items.map((solution) => (
              <ProductCard key={solution.sys.id} solution={solution} />
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <nav className="flex justify-center gap-2 mt-10" aria-label="Pagination">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`?${new URLSearchParams({ ...(domain ? { domain } : {}), page: String(p) })}`}
                aria-current={p === page ? 'page' : undefined}
                className={`font-mono text-xs px-3 py-2 border transition-colors ${
                  p === page
                    ? 'bg-action text-white border-action'
                    : 'bg-transparent text-ink-primary border-ink-primary hover:bg-surface-mid'
                }`}
              >
                {p}
              </a>
            ))}
          </nav>
        )}
      </main>
    </div>
  )
}