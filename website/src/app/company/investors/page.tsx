import { getInvestorDocuments } from '@/lib/r2/client'
import { format } from 'date-fns'
import type { Metadata } from 'next'

// Investor hub fetches live document URLs — no ISR, always fresh
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Investor Relations & ESG',
  description: 'Financial filings, ESG data matrix, CSRD readiness status, and investor calendar. NYSE: PCR.',
}

export default async function InvestorsPage() {
  const documents = await getInvestorDocuments().catch(() => [])

  return (
    <div className="max-w-platform mx-auto px-12 py-12">
      <div className="border-b border-stroke pb-6 mb-10">
        <span className="section-label">NYSE: PCR · Public Company · Data current as of Q3 2024</span>
        <h1 className="text-3xl font-medium tracking-tight">Investor Relations &amp; ESG Hub</h1>
        <p className="text-base text-ink-secondary mt-2">Official repository for quarterly earnings, SEC filings, governance frameworks, and Scope 1–3 environmental disclosures.</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-5 mb-10">
        {[
          { label:'Market Capitalisation', value:'$14.2B', sub:'USD', icon:'show_chart' },
          { label:'Share Price (NYSE: PCR)', value:'$142.50', sub:'+1.24%', icon:'candlestick_chart' },
          { label:'MSCI ESG Rating', value:'AA', sub:'Leader', icon:'eco' },
        ].map(({label,value,sub,icon})=>(
          <div key={label} className="card p-6">
            <div className="flex justify-between mb-3">
              <span className="section-label" style={{margin:0}}>{label}</span>
              <span className="material-symbols-outlined text-lg text-ink-secondary" aria-hidden="true">{icon}</span>
            </div>
            <div className="text-3xl font-medium tracking-tight">{value} <span className="text-sm text-ink-secondary">{sub}</span></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-10">
        <section aria-labelledby="filings-h">
          <div className="flex justify-between items-end border-b border-stroke pb-2 mb-5">
            <h2 id="filings-h" className="text-xl font-medium">Financial Filings</h2>
          </div>
          <div className="card overflow-hidden">
            <div className="grid grid-cols-[120px_80px_1fr_80px] gap-4 px-4 py-3 bg-surface-low border-b border-stroke">
              {['Date','Form','Description','Files'].map(h=><span key={h} className="section-label" style={{margin:0}}>{h}</span>)}
            </div>
            {(documents.length ? documents : [
              { key:'10-K/2024/annual.pdf', title:'Annual Report pursuant to Section 13 and 15(d)', filingType:'10-K' as const, filedAt:'2024-02-15', presignedUrl:'#', expiresAt:'', fileSizeBytes:0 },
              { key:'10-Q/2023/q3.pdf',     title:'Quarterly Report pursuant to Section 13 or 15(d)', filingType:'10-Q' as const, filedAt:'2023-11-08', presignedUrl:'#', expiresAt:'', fileSizeBytes:0 },
              { key:'8-K/2023/q3-earnings.pdf', title:'Current report — Q3 2023 Earnings Release', filingType:'8-K' as const, filedAt:'2023-10-15', presignedUrl:'#', expiresAt:'', fileSizeBytes:0 },
              { key:'DEF14A/2023/proxy.pdf', title:'Proxy Statement — Notice of Annual Meeting', filingType:'DEF 14A' as const, filedAt:'2023-09-01', presignedUrl:'#', expiresAt:'', fileSizeBytes:0 },
            ]).map((doc) => (
              <div key={doc.key} className="grid grid-cols-[120px_80px_1fr_80px] gap-4 px-4 py-3.5 border-b border-stroke last:border-0 items-center">
                <time className="font-mono text-xs text-ink-secondary" dateTime={doc.filedAt}>{format(new Date(doc.filedAt),'yyyy-MM-dd')}</time>
                <span className="font-mono text-xs border border-stroke px-2 py-0.5 text-ink-secondary">{doc.filingType}</span>
                <span className="text-sm">{doc.title}</span>
                <div className="flex justify-end">
                  <a href={doc.presignedUrl} target="_blank" rel="noopener noreferrer" aria-label={`Download ${doc.title}`} className="text-xs font-mono border border-ink-primary text-ink-primary px-2 py-1 hover:bg-surface-mid transition-colors">PDF</a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-medium border-b border-stroke pb-2 mb-5">Investor Calendar</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { title:'Q1 2024 Earnings Call', date:'MAR 15, 2024 · 10:00 AM EST', type:'Webcast & Conference Call' },
                { title:'Annual General Meeting', date:'MAY 12, 2024 · 09:00 AM EST', type:'Virtual Access' },
              ].map(({title,date,type})=>(
                <div key={title} className="card p-5">
                  <div className="font-mono text-xs text-ink-secondary mb-2">{date}</div>
                  <h3 className="text-base font-medium mb-1">{title}</h3>
                  <div className="text-sm text-ink-secondary">{type}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside aria-labelledby="esg-h">
          <div className="border-b border-stroke pb-2 mb-5">
            <h2 id="esg-h" className="text-xl font-medium">ESG Data Matrix</h2>
            <span className="font-mono text-xs text-ink-secondary">FY 2023 — Annual Sustainability Report 2023</span>
          </div>
          <div className="card overflow-hidden mb-5">
            {[
              { label:'Scope 1 Emissions', sub:'Direct Operations', value:'142,500', unit:'mtCO2e' },
              { label:'Scope 2 Emissions', sub:'Purchased Energy (Market)', value:'85,200', unit:'mtCO2e' },
              { label:'Scope 3 Emissions', sub:'Value Chain (Est.)', value:'1,150,000', unit:'mtCO2e' },
            ].map(({label,sub,value,unit},i,arr)=>(
              <div key={label} className={`p-4 flex justify-between items-center ${i < arr.length-1 ? 'border-b border-stroke' : ''}`}>
                <div><div className="text-sm font-medium">{label}</div><div className="text-xs text-ink-secondary">{sub}</div></div>
                <div className="text-right"><div className="text-xl font-medium">{value}</div><div className="font-mono text-xs text-ink-secondary">{unit}</div></div>
              </div>
            ))}
          </div>
          <div className="card p-5 border-l-4 border-success mb-4">
            <div className="flex items-center gap-2 mb-2"><span className="material-symbols-outlined text-success text-lg" aria-hidden="true">verified</span><h3 className="text-base font-medium">CSRD Readiness Status</h3></div>
            <p className="text-sm text-ink-secondary mb-3">Alignment with ESRS for mandatory FY 2025 disclosure, publication 2026.</p>
            <span className="font-mono text-xs text-success border border-success bg-success-bg px-2 py-0.5">On Track for 2025 Compliance</span>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-medium mb-2">Automotive Climate Action Questionnaire</h3>
            <p className="text-sm text-ink-secondary mb-3">Aligned with the ACAQ framework developed by Ford, GM, Honda, Denso, and Toyota for consistent Scope 3 reporting.</p>
            <a href="#" className="inline-flex items-center gap-1 text-xs font-mono border border-ink-primary text-ink-primary px-3 py-1.5 hover:bg-surface-mid transition-colors">Download Response 2023</a>
          </div>
        </aside>
      </div>
    </div>
  )
}