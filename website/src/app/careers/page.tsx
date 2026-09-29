import Link from 'next/link'
import { getJobListings } from '@/lib/ats/client'
import { Badge } from '@/components/ui/Badge'
import type { Metadata } from 'next'

export const revalidate = 1800
export const metadata: Metadata = {
  title: 'Engineering Careers',
  description: '24 open positions across Engineering, Quality, R&D, and Operations. Roles in Stuttgart, Detroit, Nagoya, Queretaro, and remote.',
}
interface PageProps { searchParams: { dept?: string; level?: string } }

export default async function CareersPage({ searchParams }: PageProps) {
  const jobs = await getJobListings({ department: searchParams.dept }).catch(() => [])

  const fallback = [
    { id:'1', title:'Senior Embedded Systems Engineer', department:'Electronics Engineering', location:'Stuttgart, Germany', country:'Germany', seniorityLevel:'L4' as const, contractType:'full-time' as const, postedAt:new Date().toISOString(), description:'', requirements:[], applicationUrl:'#', featured:true },
    { id:'2', title:'Thermal Dynamics Architect', department:'R&D', location:'Remote (US/EU)', country:'', seniorityLevel:'L5' as const, contractType:'full-time' as const, postedAt:new Date().toISOString(), description:'', requirements:[], applicationUrl:'#', featured:false },
    { id:'3', title:'Quality Assurance Specialist — Drivetrain', department:'Quality & Compliance', location:'Queretaro, Mexico', country:'Mexico', seniorityLevel:'L3' as const, contractType:'contract' as const, postedAt:new Date().toISOString(), description:'', requirements:[], applicationUrl:'#', featured:false },
    { id:'4', title:'Autonomous Systems Software Lead', department:'R&D — ADAS', location:'Detroit, USA', country:'USA', seniorityLevel:'L5' as const, contractType:'full-time' as const, postedAt:new Date().toISOString(), description:'', requirements:[], applicationUrl:'#', featured:false },
    { id:'5', title:'Manufacturing Process Engineer — EV', department:'Operations', location:'Wuhan, China', country:'China', seniorityLevel:'L4' as const, contractType:'full-time' as const, postedAt:new Date().toISOString(), description:'', requirements:[], applicationUrl:'#', featured:false },
  ]
  const displayJobs = jobs.length ? jobs : fallback

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 flex-shrink-0 bg-surface-low border-r border-stroke py-6 px-4 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto" aria-label="Job filters">
        <h2 className="text-base font-medium mb-5">Filter Roles</h2>
        <div className="mb-5">
          <span className="section-label mb-2.5">Department</span>
          {['Engineering','Quality & Compliance','R&D','Operations'].map(d=>(
            <label key={d} className="flex items-center gap-2 mb-2 text-sm text-ink-secondary cursor-pointer">
              <input type="checkbox" className="accent-action" defaultChecked={d==='Engineering'} />{d}
            </label>
          ))}
        </div>
        <div className="mb-5">
          <span className="section-label mb-2.5">Seniority</span>
          {[['L3','Mid'],['L4','Senior'],['L5','Principal']].map(([v,l])=>(
            <label key={v} className="flex items-center gap-2 mb-2 text-sm text-ink-secondary cursor-pointer">
              <input type="checkbox" className="accent-action" defaultChecked={v==='L4'} />{v} — {l}
            </label>
          ))}
        </div>
        <div className="mb-5">
          <span className="section-label mb-2.5">Contract</span>
          {['Full-Time','Contract'].map(c=>(
            <label key={c} className="flex items-center gap-2 mb-2 text-sm text-ink-secondary cursor-pointer">
              <input type="checkbox" className="accent-action" defaultChecked={c==='Full-Time'} />{c}
            </label>
          ))}
        </div>
        <Link href="/careers/students" className="block w-full text-center font-mono text-xs border border-ink-primary text-ink-primary py-2 hover:bg-surface-mid transition-colors mt-2">
          Graduate Pathway →
        </Link>
      </aside>
      <main className="flex-1 px-12 py-12" aria-label="Job listings">
        <div className="border-b border-stroke pb-6 mb-8">
          <span className="section-label">Open Positions — {displayJobs.length} active requisitions</span>
          <h1 className="text-2xl font-medium">Engineering Careers</h1>
        </div>
        <div>
          {displayJobs.map(job=>(
            <a key={job.id} href={job.applicationUrl} className="article-row justify-between items-center">
              <div>
                <h3 className="text-base font-medium mb-1.5">{job.title}</h3>
                <div className="flex gap-4 font-mono text-xs text-ink-secondary">
                  <span>{job.location}</span><span>{job.contractType.replace('-',' ')}</span><span>{job.department}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Badge variant="neutral">{job.seniorityLevel}</Badge>
                <span className="material-symbols-outlined text-lg text-ink-secondary" aria-hidden="true">arrow_forward</span>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}
