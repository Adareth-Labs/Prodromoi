import { getLeadership, getFacilities } from '@/lib/payload/api'
import { automotiveImage } from '@/lib/automotive-image'
import Image from 'next/image'
import type { Metadata } from 'next'

export const revalidate = 86400
export const metadata: Metadata = {
  title: 'About & Footprint',
  description: 'Leadership team, global manufacturing footprint, and corporate history of PrecisionCore Automotive.',
}
export default async function CompanyPage() {
  const [leadership, facilities] = await Promise.all([getLeadership(), getFacilities()])
  const manufacturing = facilities.filter(f => f.facilityType === 'manufacturing')
  const leadershipPortraits = [
    automotiveImage('leader-portrait-04.webp'),
    automotiveImage('leader-portrait-01.webp'),
    automotiveImage('leader-portrait-02.webp'),
  ]

  return (
    <div className="max-w-platform mx-auto px-12 py-12">
      <div className="border-b border-stroke pb-6 mb-12">
        <span className="section-label">Corporate Profile</span>
        <h1 className="text-3xl font-medium tracking-tight">About PrecisionCore</h1>
      </div>

      <section className="mb-16" aria-labelledby="leadership-h">
        <h2 id="leadership-h" className="text-xl font-medium border-b border-stroke pb-3 mb-3">Executive Leadership</h2>
        <p className="text-xs text-ink-secondary mb-8">Illustrative portrait imagery for this demonstration site.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(leadership.length ? leadership : [
            { sys:{id:'1',createdAt:'',updatedAt:''}, name:'Dr. Amara Osei',    title:'Chief Executive Officer',  bio:'20+ years in automotive manufacturing. Previously VP Engineering at Continental AG. PhD Mechanical Engineering, TU Munich.', sortOrder:1 },
            { sys:{id:'2',createdAt:'',updatedAt:''}, name:'Marcus Chen',       title:'Chief Technology Officer', bio:'Led electrification programmes at Bosch Mobility. Holds 23 patents in power electronics and E/E architecture. MSc Electrical Engineering, MIT.', sortOrder:2 },
            { sys:{id:'3',createdAt:'',updatedAt:''}, name:'Ingrid Svensson',   title:'Chief Financial Officer',  bio:'Former CFO at Veoneer. CFA charterholder. Specialist in automotive capital markets and M&A. MBA, Stockholm School of Economics.', sortOrder:3 },
          ]).map((person, index) => (
            <div key={person.sys.id} className="card p-5">
              <div className="relative h-48 w-full overflow-hidden bg-surface-low mb-5">
                <Image
                  src={leadershipPortraits[index % leadershipPortraits.length]}
                  alt={`Illustrative portrait for ${person.name}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center"
                />
              </div>
              <h3 className="text-base font-medium mb-1">{person.name}</h3>
              <div className="font-mono text-xs text-ink-secondary uppercase tracking-widest mb-3">{person.title}</div>
              <p className="text-sm text-ink-secondary leading-relaxed">{person.bio}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16" aria-labelledby="people-h">
        <div className="border-b border-stroke pb-3 mb-7">
          <span className="section-label">People & operations</span>
          <h2 id="people-h" className="text-xl font-medium">Teams behind delivery</h2>
          <p className="text-xs text-ink-secondary mt-2">Representative imagery highlighting the engineering, programme and supplier teams across the ecosystem.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { src: automotiveImage('leader-portrait-03.webp'), alt: 'Illustrative portrait representing programme leadership', title: 'Programme leadership' },
            { src: automotiveImage('engineering-executive.webp'), alt: 'Illustrative portrait representing customer and programme coordination', title: 'Partner coordination' },
            { src: automotiveImage('engineering-lead.webp'), alt: 'Illustrative portrait representing manufacturing engineering', title: 'Manufacturing engineering' },
          ].map((item) => (
            <article key={item.title} className="card overflow-hidden">
              <div className="relative aspect-[4/3] bg-surface-low">
                <Image src={item.src} alt={item.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover object-center" />
              </div>
              <h3 className="p-4 text-sm font-medium">{item.title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="footprint-h">
        <h2 id="footprint-h" className="text-xl font-medium border-b border-stroke pb-3 mb-8">Global Manufacturing Footprint</h2>
        <div className="grid grid-cols-2 gap-8">
          <div className="relative min-h-72 aspect-[4/3] overflow-hidden border border-stroke bg-surface-low">
            <Image
              src={automotiveImage('precision-assembly-facility.webp')}
              alt="Automotive precision assembly floor with manufacturing workstations"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 text-white">
              <div className="font-mono text-xs uppercase tracking-widest">Global manufacturing footprint</div>
              <div className="text-sm mt-1 text-white/85">Representative production facility imagery · 42 facilities</div>
            </div>
          </div>
          <div>
            <span className="section-label mb-4">Key Manufacturing Hubs</span>
            {(manufacturing.length ? manufacturing : [
              { sys:{id:'1',createdAt:'',updatedAt:''}, name:'Facility Alpha', city:'Stuttgart',  country:'Germany',  countryCode:'DE', facilityType:'manufacturing' as const, employeeRange:'3,200', capabilities:['Drivetrain'], iatfCertified:true, latitude:0, longitude:0 },
              { sys:{id:'2',createdAt:'',updatedAt:''}, name:'Facility Beta',  city:'Queretaro', country:'Mexico',   countryCode:'MX', facilityType:'manufacturing' as const, employeeRange:'2,800', capabilities:['Precision Casting'], iatfCertified:true, latitude:0, longitude:0 },
              { sys:{id:'3',createdAt:'',updatedAt:''}, name:'Facility Gamma', city:'Nagoya',    country:'Japan',    countryCode:'JP', facilityType:'manufacturing' as const, employeeRange:'1,900', capabilities:['Electronics'], iatfCertified:true, latitude:0, longitude:0 },
              { sys:{id:'4',createdAt:'',updatedAt:''}, name:'Facility Delta', city:'Wuhan',     country:'China',    countryCode:'CN', facilityType:'manufacturing' as const, employeeRange:'2,400', capabilities:['EV Components'], iatfCertified:true, latitude:0, longitude:0 },
              { sys:{id:'5',createdAt:'',updatedAt:''}, name:'R&D Centre',     city:'Detroit',   country:'USA',      countryCode:'US', facilityType:'rd-centre' as const, employeeRange:'620', capabilities:['R&D'], iatfCertified:false, latitude:0, longitude:0 },
            ]).slice(0,5).map((f) => (
              <div key={f.sys.id} className="flex justify-between items-center py-3 border-b border-stroke last:border-0">
                <div>
                  <div className="text-sm font-medium">{f.city}, {f.country}</div>
                  <div className="text-xs text-ink-secondary">{f.capabilities[0]} · {f.employeeRange} employees</div>
                </div>
                <span className="font-mono text-xs text-success border border-success bg-success-bg px-2 py-0.5">Operational</span>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-4 mt-5">
              {[{n:'42',l:'Facilities'},{n:'24',l:'Countries'},{n:'38',l:'IATF Certified'}].map(({n,l})=>(
                <div key={l} className="text-center p-4 bg-surface-low">
                  <div className="text-2xl font-medium">{n}</div>
                  <div className="text-xs text-ink-secondary mt-1">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
