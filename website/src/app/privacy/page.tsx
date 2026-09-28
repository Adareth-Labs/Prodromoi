import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Privacy Policy', description: 'How PrecisionCore Automotive collects, uses, and protects your personal data.' }
// LAUNCH CHECKLIST: Replace all [BRACKETED] fields before go-live.
const SECTIONS = [
  { h:'1. Who we are', body:'PrecisionCore Automotive is a fictional demonstration company created for this portfolio project. No real legal entity or production data controller is represented by this demo. This policy applies to all digital properties operated by PrecisionCore Automotive.' },
  { h:'2. What data we collect', body:'Three categories: strictly necessary data (session identifiers, language preference cookie pc_lang) required to operate the site; analytics data (anonymised page views, session duration, device type — no personal identifiers) collected only with explicit consent; and partner portal data (company name, role, contact details, OEM relationship) collected under a B2B data processing agreement.' },
  { h:'3. Why we collect it', body:'Strictly necessary data is required for the site to function. Analytics data is collected with your consent to help us reduce friction in the supplier qualification process. Partner portal data is collected to verify access tier eligibility and maintain audit logs of document downloads as required under IATF 16949 supplier qualification obligations.' },
  { h:'4. How long we keep it', body:'Session cookies expire at the end of your browser session. Analytics consent preference stored for 12 months. Email addresses captured via white paper downloads retained for 24 months. Partner portal account data retained for the duration of the active supplier relationship plus three years for audit compliance.' },
  { h:'5. Who we share it with', body:'We do not sell your data. Analytics data is processed by [ANALYTICS PROVIDER — name before launch]. Partner portal data is shared with OEM customers only where required for supplier qualification, and only under a data processing agreement.' },
  { h:'6. Your rights', body:'Under GDPR you have the right to access, correct, delete, and port your personal data. Withdraw analytics consent at any time using the Manage cookies link in the footer. To request deletion use the contact details provided with the live deployment. Requests are handled according to the privacy requirements applicable to the deployed service.' },
  { h:'7. Cookies we use', body:'pc_consent stores consent preferences (12 months). pc_lang stores language preference (session) — strictly necessary, no consent required. [ANALYTICS COOKIE NAME] is set only if you consent to analytics.' },
  { h:'8. Contact', body:'For a production deployment, replace this demo contact section with the appointed data controller’s verified contact details. For UK users: Information Commissioner\'s Office at ico.org.uk. For EU users: your national data protection authority. Full list at edpb.europa.eu.' },
]
export default function PrivacyPage() {
  return (
    <div className="max-w-prose mx-auto px-12 py-12">
      <span className="section-label">Legal</span>
      <h1 className="text-2xl font-medium mb-2">Privacy Policy</h1>
      <div className="font-mono text-xs text-ink-secondary mb-8">[DATE — populate before launch]</div>
      <hr className="border-stroke mb-8" />
      {SECTIONS.map(({h,body})=>(
        <section key={h} className="mb-10">
          <h2 className="text-lg font-medium mb-3">{h}</h2>
          <p className="text-base text-ink-secondary leading-relaxed">{body}</p>
        </section>
      ))}
    </div>
  )
}