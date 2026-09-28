'use client';
import { useState } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Badge, KPICard, SectionHeader, PrimaryButton, SecondaryButton, Spinner } from '@/components/ui';
import { colors } from '@/styles/tokens';
import type { PortalUser } from '@/types';
import { apiFetch } from '@/lib/api';
const C = colors;

export default function PPAPClient({ user, initialDocs }: { user: PortalUser; initialDocs: any[] }) {
  const { mob, tab } = useBreakpoint();
  const [docs, setDocs] = useState(initialDocs);
  const [uploading, setUploading] = useState(false);
  const [r2Log, setR2Log] = useState('');
  const pad = mob ? 14 : tab ? 20 : 26;

  const handleUpload = async () => {
    setUploading(true); setR2Log('');
    try {
      const json = await apiFetch<any>('/v1/ppap/upload-url', {
        method: 'POST',
        body: JSON.stringify({ documentType: 'PPAP_DOCUMENT', fileName: `ppap-doc-${Date.now()}.pdf`, contentType: 'application/pdf', ppapLevel: 3, sizeBytes: 2400000 }),
      });
      const { uploadUrl, key } = json.data ?? {};
      setR2Log(`R2 PUT ${uploadUrl?.split('?')[0] ?? '...'}\ncontent-type: application/pdf\n\nPre-signed upload URL authorized by Express API.`);
      setDocs(p => [{ id: json.data?.documentId ?? Date.now(), name: `New PPAP Document — ${new Date().toLocaleDateString()}`, fileType: 'PDF', sizeBytes: 2400000, ppapLevel: 3, status: 'UNDER_REVIEW', uploadedAt: new Date().toISOString(), s3Key: key }, ...p]);
    } finally { setUploading(false); }
  };

  const approved = docs.filter(d => d.status === 'APPROVED').length;
  const review = docs.filter(d => d.status === 'UNDER_REVIEW').length;

  return (
    <div style={{ padding: pad, maxWidth: 1200, margin: '0 auto' }}>
      <SectionHeader eyebrow="PPAP Compliance Hub" title="Production Part Approval" mob={mob} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
        <KPICard label="Total Documents" value={docs.length} ok={true} icon="folder" />
        <KPICard label="Approved" value={approved} ok={true} icon="check_circle" />
        <KPICard label="Under Review" value={review} ok={null} icon="pending" />
        <KPICard label="PPAP Level" value="3" unit=" / 5" ok={true} icon="military_tech" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: mob || tab ? '1fr' : '2fr 1fr', gap: 18 }}>
        <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}` }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.borderLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: C.textDark, fontFamily: "'Hanken Grotesk', sans-serif" }}>Document Repository</h3>
            <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, textTransform: 'uppercase' as const, letterSpacing: '0.1em' }}>PPAP Level 3</span>
          </div>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead><tr style={{ background: C.surfaceLow }}>
                {['Document','Type','Level','Status','Date',''].map(h => <th key={h} style={{ padding: '9px 14px', fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, textAlign: 'left', letterSpacing: '0.1em', textTransform: 'uppercase' as const, borderBottom: `1px solid ${C.borderLight}`, whiteSpace: 'nowrap' as const }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {docs.map((doc, i) => (
                  <tr key={doc.id} style={{ borderBottom: i < docs.length-1 ? `1px solid ${C.borderLight}` : 'none' }}>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 3, height: 24, background: doc.status==='APPROVED'?C.green:doc.status==='UNDER_REVIEW'?C.amber:C.borderLight, flexShrink: 0 }} />
                        <div style={{ fontSize: 12, fontWeight: 500, color: C.textDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: mob?140:260 }}>{doc.name}</div>
                      </div>
                    </td>
                    <td style={{ padding: '11px 14px' }}><span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, border: `1px solid ${C.borderLight}`, padding: '2px 5px' }}>{doc.fileType}</span></td>
                    <td style={{ padding: '11px 14px', fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: C.textMuted }}>L{doc.ppapLevel}</td>
                    <td style={{ padding: '11px 14px' }}><Badge s={doc.status} /></td>
                    <td style={{ padding: '11px 14px', fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, whiteSpace: 'nowrap' as const }}>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                    <td style={{ padding: '11px 14px' }}><button style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textFaint }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}`, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textDark, fontFamily: "'Hanken Grotesk', sans-serif", marginBottom: 14 }}>Upload to R2 Vault</div>
            <div style={{ border: `2px dashed ${C.borderLight}`, padding: 24, textAlign: 'center', marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 26, color: C.textFaint, display: 'block', marginBottom: 8 }}>cloud_upload</span>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 3 }}>Drop PPAP documents here</div>
              <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint }}>PDF, XLSX — Max 50MB</div>
            </div>
            <SecondaryButton icon="upload" onClick={handleUpload} disabled={uploading} wide>
              {uploading ? <><Spinner size={12} color={C.textDark} /> Generating URL...</> : 'Upload Document'}
            </SecondaryButton>
          </div>
          {r2Log && (
            <div style={{ background: C.textDark, padding: 12 }}>
              <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: `${C.blue}88`, marginBottom: 5, letterSpacing: '0.1em' }}>R2 UPLOAD LOG</div>
              <pre style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: C.blue, margin: 0, lineHeight: '14px', whiteSpace: 'pre-wrap' as const }}>{r2Log}</pre>
            </div>
          )}
          <div style={{ background: C.surfaceLow, border: `1px solid ${C.borderLight}`, padding: 13 }}>
            <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>STORAGE CONFIG</div>
            {[['Bucket','ppap-vault'],['Encryption','AES-256 SSE'],['URL Expiry','3600s'],['Versioning','Enabled'],['Provider','Cloudflare R2']].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint }}>{k}</span>
                <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.textMuted }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
