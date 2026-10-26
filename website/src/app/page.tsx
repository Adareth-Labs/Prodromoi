import { Suspense } from 'react'
import { automotiveImage } from '@/lib/automotive-image'
import Image from 'next/image'
import { MetricsBar } from '@/components/home/MetricsBar'
import { TechnicalPillars } from '@/components/home/TechnicalPillars'
import { NewsroomFeed } from '@/components/home/NewsroomFeed'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { NewsArticle } from '@/types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: "PrecisionCore Automotive — Tier 1 Manufacturing",
  description: "Advanced component engineering and manufacturing for the world's most demanding OEMs. Structural integrity and technological innovation at scale across 42 global facilities.",
}

export default async function HomePage() {

  // Demonstration metrics: illustrative portfolio data, not real company figures.
  const metrics = {
    revenueYear: '2026',
    revenueRunRate: '$1.2B',
    facilityCount: 42,
    headcount: 12500, // Added headcount for .toLocaleString()
    iatfCertifiedCount: 38,
    countryCount: 12,
    lastUpdated: '2026-09-01',
  }

  // Demonstration newsroom data for the portfolio case study.
  const newsData: { items: NewsArticle[] } = {
    items: [
      {
        sys: { id: '1', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
        title: 'PrecisionCore Expands',
        publishedAt: '2026-06-01T10:00:00Z',
        category: 'corporate',
        attribution: 'PrecisionCore',
        readTimeMinutes: 2,
        summary: 'New state-of-the-art facility opens to support growing EV demands.',
        body: null,
        featuredMaterial: false,
        slug: 'precisioncore-expands',
      },
      {
        sys: { id: '2', createdAt: '2026-05-15T10:00:00Z', updatedAt: '2026-05-15T10:00:00Z' },
        title: 'Next-Gen Structural Integrity Tech Announced',
        publishedAt: '2026-05-15T10:00:00Z',
        category: 'technical',
        attribution: 'PrecisionCore',
        readTimeMinutes: 3,
        summary: 'Lighter, stronger chassis components enter mass production.',
        body: null,
        featuredMaterial: false,
        slug: 'next-gen-tech',
      },
      {
        sys: { id: '3', createdAt: '2026-04-20T10:00:00Z', updatedAt: '2026-04-20T10:00:00Z' },
        title: 'Global Supply Chain Optimization Report',
        publishedAt: '2026-04-20T10:00:00Z',
        category: 'corporate',
        attribution: 'PrecisionCore',
        readTimeMinutes: 4,
        summary: 'How we are reducing lead times for our OEM partners worldwide.',
        body: null,
        featuredMaterial: false,
        slug: 'supply-chain-report',
      }
    ]
  };
  return (
    <>
      {/* Hero */}
      <section className="bg-white dark:bg-surface border-b border-stroke relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: [
              'repeating-linear-gradient(0deg,transparent,transparent 48px,#c4c7c8 48px,#c4c7c8 49px)',
              'repeating-linear-gradient(90deg,transparent,transparent 48px,#c4c7c8 48px,#c4c7c8 49px)',
            ].join(','),
          }}
          aria-hidden="true"
        />
        <div className="max-w-platform mx-auto px-6 md:px-12 py-12 md:py-16 relative">
          <div className="grid grid-cols-1 lg:grid-cols-[1.04fr_0.96fr] gap-10 xl:gap-14 items-center">
            <div>
              <span className="section-label">Tier 1 Automotive Manufacturing</span>
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-medium leading-[0.98] tracking-tight mb-5">
                Engineering Precision<br />for Global Mobility
              </h1>
              <p className="text-base text-ink-secondary max-w-lg mb-8 leading-relaxed">
                Advanced component engineering and manufacturing for the world's most demanding OEMs.
                Structural integrity and technological innovation at scale across 42 global facilities.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: 'precision_manufacturing', label: 'OEM Solutions',       href: '/solutions',         cta: 'Browse Catalog' },
                  { icon: 'monitoring',              label: 'Investor Dashboard',  href: '/company/investors', cta: 'View Investor Hub' },
                  { icon: 'engineering',             label: 'Engineering Careers', href: '/careers',           cta: 'View Open Roles' },
                ].map((item) => (
                  <Link key={item.href} href={item.href} className="card card-hover p-5 block group">
                    <span className="material-symbols-outlined text-3xl text-ink-secondary mb-4 block group-hover:text-ink-primary transition-colors" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="section-label" style={{fontSize:'10px'}}>Pathway</span>
                    <div className="flex justify-between items-center text-sm font-medium gap-2">
                      {item.label}
                      <span className="material-symbols-outlined text-lg text-ink-secondary group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                        arrow_forward
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <div className="relative aspect-[5/4] overflow-hidden border border-stroke bg-surface-low">
                <Image
                  src={automotiveImage('automated-manufacturing-line.webp')}
                  alt="Automated automotive manufacturing line with industrial robotics"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-5 md:p-6 text-white">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/75">Precision at scale</span>
                  <div className="text-xl md:text-2xl font-medium mt-1">Engineered for the next generation</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="relative aspect-[16/7] overflow-hidden border border-stroke bg-surface-low">
                  <Image src={automotiveImage('power-electronics-module.webp')} alt="Automotive power electronics control module" fill sizes="(max-width: 1024px) 50vw, 24vw" className="object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/65 px-3 py-2 text-white text-xs">Power electronics</span>
                </div>
                <div className="relative aspect-[16/7] overflow-hidden border border-stroke bg-surface-low">
                  <Image src={automotiveImage('automotive-electronics-components.webp')} alt="Automotive electronic control and sensor components" fill sizes="(max-width: 1024px) 50vw, 24vw" className="object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-black/65 px-3 py-2 text-white text-xs">Control systems</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <MetricsBar metrics={metrics} />
      </Suspense>

      <TechnicalPillars />

      <section className="max-w-platform mx-auto px-6 md:px-12 pb-16" aria-labelledby="systems-heading">
        <div className="border-b border-stroke pb-4 mb-7">
          <span className="section-label">Automotive systems</span>
          <h2 id="systems-heading" className="text-2xl font-medium">Designed for complex mobility systems</h2>
          <p className="text-sm text-ink-secondary mt-2 max-w-2xl">From battery architecture to thermal control and electronic integration, explore the systems that support dependable vehicle platforms.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { src: automotiveImage('battery-pack-exploded-view.webp'), alt: 'Exploded technical view of an electric vehicle battery pack', title: 'Battery architecture', label: 'Pack integration' },
            { src: automotiveImage('battery-cooling-plate.webp'), alt: 'Automotive battery cooling plate with integrated connections', title: 'Thermal management', label: 'Heat transfer systems' },
            { src: automotiveImage('adas-camera-module.webp'), alt: 'Automotive camera and sensing module', title: 'Vehicle sensing', label: 'ADAS components' },
          ].map((item) => (
            <article key={item.title} className="card card-hover overflow-hidden">
              <div className="relative aspect-[16/9] bg-surface-low">
                <Image src={item.src} alt={item.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
              </div>
              <div className="p-5">
                <span className="section-label" style={{fontSize:'10px'}}>{item.label}</span>
                <h3 className="text-base font-medium">{item.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Suspense fallback={<div className="h-64 bg-surface-low" />}>
        <NewsroomFeed articles={newsData.items} />
      </Suspense>
    </>
  )
}



