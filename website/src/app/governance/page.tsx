import { getBoardMembers } from '@/lib/payload/api'
import type { Metadata } from 'next'
export const revalidate = 86400
export const metadata: Metadata = { title: 'Corporate Governance', description: 'Board of directors, committee structure, and published governance policies.' }
export default async function GovernancePage() {
  const board = await getBoardMembers().catch(() => [])
  const fallback = [
    { sys:{id:'1',createdAt:'',updatedAt:''}, name:'Dr. Amara Osei',    title:'CEO & Executive Director',      committee:undefined, type:'executive' as const, sortOrder:1 },
    { sys:{id:'2',createdAt:'',updatedAt:''}, name:'Prof. Leila Nasseri',title:'Chair, Audit Committee',        committee:'Audit',          type:'independent' as const, sortOrder:2 },
    { sys:{id:'3',createdAt:'',updatedAt:''}, name:'James Okafor',       title:'Chair, Remuneration Committee', committee:'Remuneration',   type:'independent' as const, sortOrder:3 },
    { sys:{id:'4',createdAt:'',updatedAt:''}, name:'Hana Müller',        title:'Chair, Sustainability Committee',committee:'Sustainability', type:'independent' as const, sortOrder:4 },
  ]
  const members = board.length ? board : fallback
  const POLICIES = ['Code of Conduct','Anti-Bribery Policy','Supplier Code of Conduct','Data Protection Policy','Whistleblower Policy']
  return (
    <div className="max-w-platform mx-auto px-12 py-12">
      <div className="border-b border-stroke pb-6 mb-10"><span className="section-label">Corporate Governance</span><h1 className="text-3xl font-medium tracking-tight">Board & Governance</h1></div>
      <div className="grid grid-cols-[2fr_1fr] gap-10">
        <section>
          <h2 className="text-xl font-medium border-b border-stroke pb-3 mb-6">Board of Directors</h2>
          {members.map(m=>(
            <div key={m.sys.id} className="flex justify-between items-center py-4 border-b border-stroke last:border-0">
              <div><div className="text-sm font-medium">{m.name}</div><div className="text-xs text-ink-secondary">{m.title}</div></div>
              <span className="font-mono text-xs border border-stroke px-2 py-0.5 text-ink-secondary capitalize">{m.type}</span>
            </div>
          ))}
        </section>
        <section>
          <h2 className="text-xl font-medium border-b border-stroke pb-3 mb-6">Policies</h2>
          <div className="flex flex-col gap-3">
            {POLICIES.map(p=>(
              <button key={p} type="button" className="flex justify-between items-center bg-transparent text-ink-primary border border-ink-primary font-mono text-xs uppercase tracking-widest font-medium px-4 py-2.5 hover:bg-surface-mid transition-colors">
                <span>{p}</span><span>PDF ↓</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
