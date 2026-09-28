import { Suspense } from 'react'
import { MetricsBar } from '@/components/home/MetricsBar'
import { TechnicalPillars } from '@/components/home/TechnicalPillars'
import { NewsroomFeed } from '@/components/home/NewsroomFeed'
import Link from 'next/link'
import type { Metadata } from 'next'

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
  }

  // Demonstration newsroom data for the portfolio case study.
  const newsData = {
    items: [
      {
        sys: { id: '1' },
        title: 'PrecisionCore Expands',
        publishedAt: '2026-06-01T10:00:00Z',
        excerpt: 'New state-of-the-art facility opens to support growing EV demands.',
        slug: 'precisioncore-expands',
      },
      {
        sys: { id: '2' },
        title: 'Next-Gen Structural Integrity Tech Announced',
        publishedAt: '2026-05-15T10:00:00Z',
        excerpt: 'Lighter, stronger chassis components enter mass production.',
        slug: 'next-gen-tech',
      },
      {
        sys: { id: '3' },
        title: 'Global Supply Chain Optimization Report',
        publishedAt: '2026-04-20T10:00:00Z',
        excerpt: 'How we are reducing lead times for our OEM partners worldwide.',
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
        <div className="max-w-platform mx-auto px-12 py-20 relative">
          <div className="max-w-2xl">
            <span className="section-label">Tier 1 Automotive Manufacturing</span>
            <h1 className="text-5xl font-medium leading-none tracking-tight mb-5">
              Engineering Precision<br />for Global Mobility
            </h1>
            <p className="text-base text-ink-secondary max-w-lg mb-10">
              Advanced component engineering and manufacturing for the world's most demanding OEMs.
              Structural integrity and technological innovation at scale across 42 global facilities.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: 'precision_manufacturing', label: 'OEM Solutions',       href: '/solutions',         cta: 'Browse Catalog' },
                { icon: 'monitoring',              label: 'Investor Dashboard',  href: '/company/investors', cta: 'View Investor Hub' },
                { icon: 'engineering',             label: 'Engineering Careers', href: '/careers',           cta: 'View Open Roles' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="card card-hover p-6 block group"
                >
                  <span className="material-symbols-outlined text-3xl text-ink-secondary mb-4 block group-hover:text-ink-primary transition-colors" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="section-label" style={{fontSize:'10px'}}>Pathway</span>
                  <div className="flex justify-between items-center text-base font-medium">
                    {item.label}
                    <span className="material-symbols-outlined text-lg text-ink-secondary group-hover:translate-x-0.5 transition-transform" aria-hidden="true">
                      arrow_forward
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <MetricsBar metrics={metrics} />
      </Suspense>

      <TechnicalPillars />

      <Suspense fallback={<div className="h-64 bg-surface-low" />}>
        <NewsroomFeed articles={newsData.items} />
      </Suspense>
    </>
  )
}