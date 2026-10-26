import Image from 'next/image'
import { automotiveImage } from '@/lib/automotive-image'
import Link from 'next/link'

const PILLARS = [
  {
    icon: 'bolt',
    title: 'Electrification Systems',
    body: 'High-voltage power distribution, thermal management for battery arrays, and integrated e-axle components for next-generation EV platforms.',
    items: ['Thermal Management', 'Power Inverters', 'Busbar Solutions'],
    image: automotiveImage('thermal-management-diagram.webp'),
    imageAlt: 'Technical thermal map of a battery pack during fast charging',
  },
  {
    icon: 'settings',
    title: 'Advanced Drivetrain',
    body: 'Precision-engineered transmission components, torque converters, and hybrid drivetrain solutions optimising mechanical efficiency and durability.',
    items: ['Hybrid Transmissions', 'Torque Vectoring', 'Gear Sets'],
    image: automotiveImage('electric-drive-unit.webp'),
    imageAlt: 'Automotive electric drive unit assembly',
  },
  {
    icon: 'memory',
    title: 'Vehicle Electronics',
    body: 'Automotive-grade PCBs, sensor arrays, and centralised control units built for extreme environments and real-time data delivery across E/E architectures.',
    items: ['Sensor Suites (ADAS)', 'ECU Assemblies', 'Wire Harnesses'],
    image: automotiveImage('adas-camera-module.webp'),
    imageAlt: 'Automotive camera and sensor module for driver assistance',
  },
] as const

export function TechnicalPillars() {
  return (
    <section className="max-w-platform mx-auto px-6 md:px-12 py-14 md:py-16" aria-labelledby="pillars-heading">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-stroke pb-4 mb-8 gap-3">
        <div>
          <span className="section-label">Core Competencies</span>
          <h2 id="pillars-heading" className="text-2xl font-medium">Technical Pillars</h2>
        </div>
        <Link href="/solutions" className="text-sm text-ink-secondary hover:text-ink-primary flex items-center gap-1 transition-colors">
          View Full Catalog
          <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_outward</span>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PILLARS.map((p) => (
          <article key={p.title} className="card card-hover overflow-hidden flex flex-col">
            <div className="relative aspect-[16/9] bg-surface-low">
              <Image src={p.image} alt={p.imageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <span className="material-symbols-outlined text-2xl text-ink-secondary mb-3 block" aria-hidden="true">{p.icon}</span>
              <h3 className="text-lg font-medium mb-3">{p.title}</h3>
              <p className="text-sm text-ink-secondary mb-5 leading-relaxed">{p.body}</p>
              <ul className="text-sm text-ink-secondary space-y-0 mt-auto">
                {p.items.map((item, i) => (
                  <li key={item} className={`py-2 ${i < p.items.length - 1 ? 'border-b border-stroke' : ''}`}>· {item}</li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
