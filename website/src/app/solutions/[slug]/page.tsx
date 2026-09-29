import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { getSolutionBySlug, getAllSolutionSlugs } from '@/lib/payload/api'
import type { Metadata } from 'next'

export const revalidate = 3600

interface PageProps { params: { slug: string } }

export async function generateStaticParams() {
  const slugs = await getAllSolutionSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const solution = await getSolutionBySlug(params.slug)
  if (!solution) return {}
  return {
    title:       solution.metaTitle ?? solution.name,
    description: solution.metaDescription ?? solution.shortDescription,
  }
}

export default async function SolutionDetailPage({ params }: PageProps) {
  const solution = await getSolutionBySlug(params.slug)
  if (!solution) notFound()

  const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'https://portal.precisioncore.com'

  return (
    <div className="max-w-platform mx-auto px-12 py-12">
      <nav className="font-mono text-xs text-ink-secondary mb-8 flex items-center gap-2" aria-label="Breadcrumb">
        <a href="/solutions" className="hover:text-ink-primary transition-colors">Solutions</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{solution.name}</span>
      </nav>

      <div className="grid grid-cols-3 gap-12">
        <div className="col-span-2">
          <div className="flex gap-2 mb-4">
            <Badge variant="success" dot>{solution.status.replace(/-/g, ' ')}</Badge>
            {solution.certifications.map((c) => <Badge key={c} variant="neutral">{c}</Badge>)}
          </div>
          <h1 className="text-3xl font-medium tracking-tight mb-3">{solution.name}</h1>
          <p className="font-mono text-xs text-ink-secondary mb-6">Part family: {solution.partFamily}</p>
          <p className="text-base text-ink-secondary mb-8 leading-relaxed">{solution.fullDescription}</p>

          <div className="bg-surface-low p-6 mb-8">
            <span className="section-label mb-4">Performance Specifications</span>
            <dl>
              {solution.specifications.map((spec) => (
                <div key={spec.label} className="spec-row">
                  <dt className="spec-label">{spec.label}</dt>
                  <dd className="spec-value">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {solution.oemCompatibility.length > 0 && (
            <div className="mb-8">
              <span className="section-label mb-3">OEM Compatibility</span>
              <div className="flex flex-wrap gap-2">
                {solution.oemCompatibility.map((oem) => (
                  <Badge key={oem} variant="neutral">{oem}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside>
          <div className="card p-6 sticky top-20">
            <h2 className="text-lg font-medium mb-4">Get started</h2>
            <a
              href={`${PORTAL_URL}/rfq/new?product=${solution.slug}`}
              className="block w-full text-center bg-action text-white border border-action font-mono text-xs uppercase tracking-widest font-medium py-3 hover:opacity-85 transition-opacity mb-3"
            >
              Initiate RFQ
            </a>
            {solution.technicalDataSheetUrl && (
              <a
                href={solution.technicalDataSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-transparent text-ink-primary border border-ink-primary font-mono text-xs uppercase tracking-widest font-medium py-3 hover:bg-surface-mid transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">download</span>
                Download TDS
              </a>
            )}
            <div className="border-t border-stroke mt-6 pt-4">
              <span className="section-label mb-3">Vehicle Segments</span>
              <div className="flex flex-wrap gap-1.5">
                {solution.vehicleSegments.map((seg) => (
                  <Badge key={seg} variant="neutral">{seg.replace(/-/g,' ')}</Badge>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
