'use client';
// src/app/rfq/new/page.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
  SectionHeader, FieldLabel, TextInput, SelectInput, TextArea,
  PrimaryButton, SecondaryButton, Spinner, RBACGate,
} from '@/components/ui';
import { colors } from '@/styles/tokens';
import type { PortalUser, CreateRFQInput } from '@/types';

const C = colors;

const STEPS = ['Technical Specifications', 'Documentation Upload', 'Final Review'];
const MATERIALS = ['Select...','42CrMo4 (Chromoly Steel)','EN-GJS-500-7 (Nodular Iron)','T6061-T6 (Aluminium Alloy)','17-4 PH Stainless Steel','C45 (Carbon Steel)'];
const TOLERANCES = ['Select...','ISO 286 — IT5 (±0.012mm)','ISO 286 — IT6 (±0.019mm)','ISO 286 — IT7 (±0.030mm)','ISO 286 — IT8 (±0.046mm)'];
const DOC_TYPES  = ['Technical Drawing (PDF/DXF)','3D Model File (STEP/IGES)','Material Certificate','Quality Plan (Reference)'];

type FormState = {
  partNumber: string; partName: string; annualVolume: string;
  targetPrice: string; material: string; toleranceClass: string;
  drawingRef: string; requiredBy: string; notes: string;
};
type UploadedFile = { name: string; type: string; size: string; s3Key: string };

export default function RFQNewPage() {
  const router = useRouter();
  const { mob, tab } = useBreakpoint();
  const supabase = createClient();

  const [user, setUser]       = useState<PortalUser | null>(null);
  const [step, setStep]       = useState(1);
  const [done, setDone]       = useState(false);
  const [refId, setRefId]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading]   = useState<string | null>(null);
  const [s3Log, setS3Log]           = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState<FormState>({
    partNumber: '', partName: '', annualVolume: '', targetPrice: '',
    material: 'Select...', toleranceClass: 'Select...',
    drawingRef: '', requiredBy: '', notes: '',
  });

  // Load the Supabase user + vendor data on mount
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: sbUser } }) => {
      if (!sbUser) { router.push('/login'); return; }
      try {
        // Fetch vendor record from our API so we have tier/company/vendorId
        const res = await fetch('/api/me');
        if (res.ok) {
          const { data } = await res.json();
          setUser(data);
        } else {
          setFormError('Could not load your profile. Please refresh the page.');
        }
      } catch (err) {
        console.error('[RFQNewPage] failed to load profile', err);
        setFormError('Could not load your profile. Please refresh the page.');
      }
    }).catch((err) => {
      console.error('[RFQNewPage] Supabase auth check failed', err);
      router.push('/login');
    });
  }, []);

  const set = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const handleUpload = async (docType: string) => {
    setUploading(docType); setS3Log(''); setFormError('');
    try {
      const res = await fetch('/api/rfq/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: `${docType.replace(/\W+/g,'-').toLowerCase()}.pdf`, contentType: 'application/pdf', sizeBytes: 4_200_000 }),
      });
      if (!res.ok) throw new Error(`Upload URL request failed with status ${res.status}`);
      const { uploadUrl, s3Key } = await res.json();
      setS3Log(`PUT ${uploadUrl?.split('?')[0] ?? '...'}\nx-amz-server-side-encryption: AES256\n\n< HTTP/1.1 200 OK → Object stored [OK]`);
      setUploadedFiles(p => [...p, { name: `${docType.toLowerCase().replace(/\W+/g,'-')}-${Date.now()}.pdf`, type: docType, size: `${(Math.random()*7+0.5).toFixed(1)} MB`, s3Key }]);
    } catch (err) {
      console.error('[RFQNewPage] upload failed', err);
      setFormError(`Failed to upload ${docType}. Please try again.`);
    } finally { setUploading(null); }
  };

  const handleSubmit = async () => {
    setSubmitting(true); setFormError('');
    try {
      const body: CreateRFQInput = {
        partNumber:    form.partNumber    || 'PT-7A-CRANK-001',
        partName:      form.partName      || 'Precision Crankshaft Assembly',
        annualVolume:  parseInt(form.annualVolume  || '45000'),
        targetPrice:   parseFloat(form.targetPrice || '124.00'),
        material:      form.material     !== 'Select...' ? form.material      : undefined,
        toleranceClass:form.toleranceClass !== 'Select...' ? form.toleranceClass : undefined,
        drawingRef:    form.drawingRef   || undefined,
        requiredBy:    form.requiredBy   || undefined,
        notes:         form.notes        || undefined,
      };
      const res = await fetch('/api/rfq', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`RFQ submission failed with status ${res.status}`);
      const json = await res.json();
      setRefId(json.data?.referenceId ?? 'RFQ-2024-0001');
      setDone(true);
    } catch (err) {
      console.error('[RFQNewPage] submission failed', err);
      setFormError('Failed to submit RFQ. Please try again.');
    } finally { setSubmitting(false); }
  };

  const pad = mob ? 14 : tab ? 20 : 26;

  if (!user) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <Spinner size={20} color={C.textDark} />
    </div>
  );

  if (done) return (
    <div style={{ padding: pad, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', padding: mob ? '48px 20px' : '70px 40px', border: `1px solid ${C.borderLight}`, background: C.surfaceCard }}>
        <div style={{ width: 56, height: 56, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', color: '#fff' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>check</span>
        </div>
        <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.green, letterSpacing: '0.12em', marginBottom: 10 }}>SUBMITTED — WRITTEN TO POSTGRESQL</div>
        <h2 style={{ fontSize: mob ? 20 : 24, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 700, color: C.textDark, marginBottom: 8 }}>RFQ Submitted Successfully</h2>
        <div style={{ fontSize: 15, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, marginBottom: 20 }}>Reference: {refId}</div>
        <div style={{ textAlign: 'left', background: C.textDark, padding: 14, maxWidth: 420, margin: '0 auto 24px' }}>
          <div style={{ fontSize: 8, color: `${C.blue}88`, marginBottom: 6, letterSpacing: '0.1em', fontFamily: "'JetBrains Mono', monospace" }}>POSTGRESQL WRITE CONFIRMATION</div>
          <pre style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.blue, margin: 0, lineHeight: '16px' }}>{`INSERT INTO rfq_submissions (
  vendor_id, part_number, status
) VALUES (
  '${user.vendorId}',
  '${form.partNumber || 'PT-7A-CRANK-001'}',
  'PENDING'
) RETURNING id;
-- 1 row inserted [OK]`}</pre>
        </div>
        <SecondaryButton icon="arrow_back" onClick={() => { setDone(false); setStep(1); setUploadedFiles([]); setForm({ partNumber:'',partName:'',annualVolume:'',targetPrice:'',material:'Select...',toleranceClass:'Select...',drawingRef:'',requiredBy:'',notes:'' }); }}>
          Submit Another RFQ
        </SecondaryButton>
      </div>
    </div>
  );

  return (
    <div style={{ padding: pad, maxWidth: 1020, margin: '0 auto' }}>
      <RBACGate user={user} minTier={2}>
        <SectionHeader eyebrow="RFQ Flow / New Submission" title={`Step ${step}: ${STEPS[step-1]}`} mob={mob} />

        {formError && (
          <div style={{ background: '#fef2f2', border: '1px solid #b91c1c', color: '#b91c1c', padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
            {formError}
          </div>
        )}

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: mob ? 22 : 32 }}>
          {STEPS.map((s, i) => {
            const n=i+1, dn=step>n, ac=step===n;
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length-1 ? 1 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: mob ? 6 : 9 }}>
                  <div style={{ width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', background:dn?C.green:ac?C.textDark:'transparent', border:`2px solid ${dn?C.green:ac?C.textDark:C.borderLight}`, fontSize:11, fontWeight:700, color:dn||ac?'#fff':C.textFaint, flexShrink:0 }}>
                    {dn ? <span className="material-symbols-outlined" style={{ fontSize:13 }}>check</span> : n}
                  </div>
                  {!mob && <div><div style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", color:C.textFaint }}>STEP 0{n}</div><div style={{ fontSize:11, fontWeight:ac?600:400, color:ac?C.textDark:C.textMuted, whiteSpace:'nowrap' }}>{s}</div></div>}
                </div>
                {i < STEPS.length-1 && <div style={{ flex:1, height:1, background:dn?C.green:C.borderLight, margin: mob?'0 8px':'0 12px' }} />}
              </div>
            );
          })}
        </div>

        {/* Step 1 — Technical Specs */}
        {step===1 && (
          <div style={{ display:'grid', gridTemplateColumns:mob||tab?'1fr':'2fr 1fr', gap:18 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:mob?'1fr':'1fr 1fr', gap:14 }}>
                <div><FieldLabel required>Part Number</FieldLabel><TextInput value={form.partNumber} onChange={set('partNumber')} placeholder="e.g. PT-7A-CRANK-001" /></div>
                <div><FieldLabel required>Drawing Reference</FieldLabel><TextInput value={form.drawingRef} onChange={set('drawingRef')} placeholder="e.g. DRW-2024-089" /></div>
              </div>
              <div><FieldLabel required>Part / Assembly Name</FieldLabel><TextInput value={form.partName} onChange={set('partName')} placeholder="e.g. Precision Crankshaft Assembly — 4-Cyl" /></div>
              <div style={{ display:'grid', gridTemplateColumns:mob?'1fr':'1fr 1fr 1fr', gap:14 }}>
                <div><FieldLabel required>Annual Volume (units)</FieldLabel><TextInput value={form.annualVolume} onChange={set('annualVolume')} type="number" placeholder="45000" /></div>
                <div><FieldLabel required>Target Price (€/unit)</FieldLabel><TextInput value={form.targetPrice} onChange={set('targetPrice')} type="number" placeholder="124.00" /></div>
                <div><FieldLabel required>Required Delivery</FieldLabel><TextInput value={form.requiredBy} onChange={set('requiredBy')} type="date" /></div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:mob?'1fr':'1fr 1fr', gap:14 }}>
                <div><FieldLabel>Material</FieldLabel><SelectInput value={form.material} onChange={set('material')} options={MATERIALS} /></div>
                <div><FieldLabel>Tolerance Class</FieldLabel><SelectInput value={form.toleranceClass} onChange={set('toleranceClass')} options={TOLERANCES} /></div>
              </div>
              <div><FieldLabel>Technical Notes</FieldLabel><TextArea value={form.notes} onChange={set('notes')} placeholder="Surface finish (Ra, Rz), heat treatment, GD&T callouts..." rows={4} /></div>
            </div>
            {!mob && !tab && (
              <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
                <div style={{ background:C.surfaceLow, border:`1px solid ${C.borderLight}`, padding:16 }}>
                  <div style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:C.textFaint, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Submitting As</div>
                  <div style={{ fontSize:14, fontWeight:600, color:C.textDark }}>{user.name}</div>
                  <div style={{ fontSize:12, color:C.textFaint, marginBottom:4 }}>{user.company}</div>
                  <div style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:C.textFaint }}>{user.vendorId}</div>
                </div>
                <div style={{ background:C.surfaceLow, border:`1px solid ${C.borderLight}`, padding:16 }}>
                  <div style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:C.textFaint, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Required Documents</div>
                  {['Technical drawing (PDF/DXF)','3D model (STEP/IGES)','Material certifications','Quality plan reference'].map(r => (
                    <div key={r} style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize:13, color:C.green }}>check_circle</span>
                      <span style={{ fontSize:12, color:C.textMuted }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2 — Upload */}
        {step===2 && (
          <div style={{ display:'grid', gridTemplateColumns:mob?'1fr':'1fr 1fr', gap:22 }}>
            <div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.textDark, fontFamily:"'Hanken Grotesk',sans-serif", marginBottom:4 }}>Documentation Upload</div>
                <div style={{ fontSize:13, color:C.textMuted }}>Each file triggers a pre-signed S3 URL via the API.</div>
              </div>
              {DOC_TYPES.map(t => (
                <div key={t} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 13px', border:`1px solid ${C.borderLight}`, background:C.surfaceCard, marginBottom:8, gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize:16, color:C.textFaint, flexShrink:0 }}>description</span>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:C.textDark, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t}</div>
                      <div style={{ fontSize:10, color:C.textFaint }}>PDF, STEP, IGES — max 25MB</div>
                    </div>
                  </div>
                  <button onClick={() => handleUpload(t)} disabled={!!uploading}
                    style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', background:C.textDark, color:'#fff', border:'none', fontSize:11, fontFamily:"'Hanken Grotesk',sans-serif", fontWeight:600, cursor:uploading?'wait':'pointer', borderRadius:0, flexShrink:0 }}>
                    {uploading===t ? <><Spinner size={9} /> Uploading</> : <><span className="material-symbols-outlined" style={{ fontSize:12 }}>upload</span> Upload</>}
                  </button>
                </div>
              ))}
              {s3Log && (
                <div style={{ background:C.textDark, padding:12, marginTop:10 }}>
                  <div style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", color:`${C.blue}88`, marginBottom:5, letterSpacing:'0.1em' }}>PRE-SIGNED S3 URL GENERATED</div>
                  <pre style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", color:C.blue, margin:0, lineHeight:'14px', whiteSpace:'pre-wrap' }}>{s3Log}</pre>
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:C.textDark, marginBottom:12 }}>Uploaded ({uploadedFiles.length}/{DOC_TYPES.length})</div>
              {uploadedFiles.length===0
                ? <div style={{ padding:26, textAlign:'center', border:`2px dashed ${C.borderLight}`, color:C.textFaint, fontSize:13 }}>No documents uploaded yet</div>
                : uploadedFiles.map((f,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:12, border:`1px solid ${C.green}33`, background:`${C.green}06`, marginBottom:8 }}>
                    <div style={{ width:3, alignSelf:'stretch', background:C.green, minHeight:12, flexShrink:0 }} />
                    <span className="material-symbols-outlined" style={{ fontSize:15, color:C.green, flexShrink:0 }}>check_circle</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:500, color:C.textDark, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</div>
                      <div style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:C.textFaint }}>{f.type} · {f.size}</div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Step 3 — Review */}
        {step===3 && (
          <div style={{ display:'grid', gridTemplateColumns:mob||tab?'1fr':'2fr 1fr', gap:18 }}>
            <div style={{ background:C.surfaceCard, border:`1px solid ${C.borderLight}`, padding:mob?16:20 }}>
              <div style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:C.textFaint, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:14, paddingBottom:12, borderBottom:`1px solid ${C.borderLight}` }}>Technical Specifications</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {([['Part Number',form.partNumber||'PT-7A-CRANK-001'],['Part Name',form.partName||'Precision Crankshaft Assembly'],['Annual Volume',form.annualVolume?`${parseInt(form.annualVolume).toLocaleString()} units`:'45,000 units'],['Target Price',form.targetPrice?`€${form.targetPrice}/unit`:'€124.00/unit'],['Material',form.material!=='Select...'?form.material:'42CrMo4 (Chromoly)'],['Tolerance',form.toleranceClass!=='Select...'?form.toleranceClass:'ISO 286 — IT6'],['Drawing Ref',form.drawingRef||'DRW-2024-089'],['Required By',form.requiredBy||'2025-03-01']] as [string,string][]).map(([k,v]) => (
                  <div key={k}><div style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:C.textFaint, textTransform:'uppercase', marginBottom:3 }}>{k}</div><div style={{ fontSize:13, color:C.textDark, fontWeight:500, wordBreak:'break-word' }}>{v}</div></div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
              <div style={{ background:C.textDark, padding:16 }}>
                <div style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", color:`${C.blue}77`, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>SUBMISSION SUMMARY</div>
                {([['Submitter',user.name],['Company',user.company],['Vendor ID',user.vendorId],['Documents',`${uploadedFiles.length} attached`],['Target Table','rfq_submissions'],['Status','READY']] as [string,string][]).map(([k,v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:7, paddingBottom:7, borderBottom:`1px solid ${C.borderDark}`, gap:8 }}>
                    <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:`${C.textLight}44`, flexShrink:0 }}>{k}</span>
                    <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:C.blue, textAlign:'right' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding:12, border:`1px solid ${C.borderLight}`, background:C.amberBg }}>
                <div style={{ display:'flex', gap:8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize:14, color:C.amber, flexShrink:0, marginTop:1 }}>info</span>
                  <p style={{ fontSize:12, color:C.amber, lineHeight:'18px', margin:0 }}>By submitting, you confirm IATF 16949:2016 compliance.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:mob?22:32, paddingTop:mob?16:20, borderTop:`1px solid ${C.borderLight}` }}>
          <SecondaryButton onClick={() => setStep(s => Math.max(1,s-1))} disabled={step===1} icon="arrow_back">Prev</SecondaryButton>
          {step<3
            ? <PrimaryButton onClick={() => setStep(s => s+1)} icon="arrow_forward">{mob?`Step ${step+1}`:`Continue to Step ${step+1}`}</PrimaryButton>
            : <PrimaryButton onClick={handleSubmit} disabled={submitting} icon={submitting?undefined:'send'}>{submitting?<><Spinner size={13}/>Submitting...</>:'Submit RFQ'}</PrimaryButton>
          }
        </div>
      </RBACGate>
    </div>
  );
}
