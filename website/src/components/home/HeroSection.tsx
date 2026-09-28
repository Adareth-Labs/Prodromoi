import Link from 'next/link'

const PATHWAYS = [
  {
    icon:  'precision_manufacturing',
    label: 'OEM Solutions',
    href:  '/solutions',
  },
  {
    icon:  'monitoring',
    label: 'Investor Dashboard',
    href:  '/company/investors',
  },
  {
    icon:  'engineering',
    label: 'Engineering Careers',
    href:  '/careers',
  },
] as const

interface Props {
  headline?:    string
  subheadline?: string
}

export function HeroSection({
  headline    = 'Engineering Precision for Global Mobility',
  subheadline = "Advanced component engineering and manufacturing for the world's most demanding OEMs. Structural integrity and technological innovation at scale across 42 global facilities.",
}: Props) {
  return (
    <section
      className="bg-white dark:bg-surface border-b border-stroke relative overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Grid background — structural pattern, not decorative gradient */}
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
          <h1
            id="hero-heading"
            className="text-5xl font-medium leading-none tracking-tight mb-5 whitespace-pre-line"
          >
            {headline}
          </h1>
          <p className="text-base text-ink-secondary max-w-lg mb-10 leading-relaxed">
            {subheadline}
          </p>

          {/* Audience pathway cards */}
          <div className="grid grid-cols-3 gap-4">
            {PATHWAYS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="card card-hover p-6 block group"
                aria-label={`Go to ${item.label}`}
              >
                <span
                  className="material-symbols-outlined text-3xl text-ink-secondary mb-4 block group-hover:text-ink-primary transition-colors"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="section-label" style={{ fontSize: '10px' }}>Pathway</span>
                <div className="flex justify-between items-center text-base font-medium">
                  {item.label}
                  <span
                    className="material-symbols-outlined text-lg text-ink-secondary group-hover:translate-x-0.5 transition-transform"
                    aria-hidden="true"
                  >
                    arrow_forward
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}