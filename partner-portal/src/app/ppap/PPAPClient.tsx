'use client';
import { useRef, useState } from 'react';
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
  const [storageLog, setStorageLog] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pad = mob ? 14 : tab ? 20 : 26;

  const handleUpload = async (file?: File) => {
    if (!file) {
      fileInputRef.current?.click();
      return;
    }
    setUploading(true); setStorageLog(''); setUploadError('');
    try {
      if (file.size > 25 * 1024 * 1024) throw new Error('File exceeds the 25 MB bucket limit.');
      const contentType = file.type || 'application/octet-stream';
      const json = await apiFetch<any>('/v1/ppap/upload-url', {
        method: 'POST',
        body: JSON.stringify({ documentType: 'PPAP_DOCUMENT', fileName: file.name, contentType, ppapLevel: 3, sizeBytes: file.size }),
      });
      const { uploadUrl, key } = json.data ?? {};
      if (!uploadUrl || !key) throw new Error('The API did not return a signed upload URL.');
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error(`Storage upload failed (${uploadResponse.status}). Check Supabase Storage S3/CORS settings.`);
      // Finalize on the API only after the object exists. The API performs a
      // server-side HEAD check before creating the database record or sending notifications.
      const completed = await apiFetch<any>('/v1/ppap/upload-complete', {
        method: 'POST',
        body: JSON.stringify({
          ppapId: json.data.ppapId, key, documentType: json.data.documentType,
          fileName: file.name, contentType, sizeBytes: file.size, ppapLevel: 3, isRequired: true,
        }),
      });
      const saved = completed.data;
      if (!saved?.id) throw new Error('The file uploaded, but the API could not confirm the document record. Please retry or contact support.');
      setStorageLog(`Uploaded and verified ${file.name} in Supabase Storage\nObject key: ${key}\nDocument record: ${saved.id}`);
      setDocs(p => [{ id: saved.id, ppapId: saved.ppapId ?? json.data.ppapId, name: saved.fileName ?? file.name, fileType: file.name.split('.').pop()?.toUpperCase() ?? 'FILE', sizeBytes: saved.sizeBytes ?? file.size, ppapLevel: saved.ppapLevel ?? 3, status: 'DRAFT', uploadedAt: saved.uploadedAt ?? new Date().toISOString(), s3Key: key }, ...p]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      setUploadError(message);
      setStorageLog(`Supabase Storage upload failed\n${message}`);
    } finally { setUploading(false); }
  };

  const downloadDocument = async (doc: (typeof docs)[number]) => {
    if (!doc.ppapId) { setDownloadError('This document is missing its PPAP reference. Refresh the page and try again.'); return; }
    setDownloadingId(doc.id); setDownloadError('');
    try {
      const response = await apiFetch<any>(`/v1/ppap/${encodeURIComponent(doc.ppapId)}/documents/${encodeURIComponent(doc.id)}/download`);
      if (!response.data?.downloadUrl) throw new Error('The API did not return a download URL.');
      window.location.assign(response.data.downloadUrl);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Could not download the document.');
    } finally { setDownloadingId(null); }
  };

  const approved = docs.filter(d => d.status === 'APPROVED').length;
  const review = docs.filter(d => d.status === 'UNDER_REVIEW').length;

  return (
    <div style={{ padding: pad, maxWidth: 1200, margin: '0 auto' }}>
      <SectionHeader eyebrow="PPAP Compliance Hub" title="Production Part Approval" mob={mob} />
      {downloadError && <div role="alert" style={{ background: '#fef2f2', border: '1px solid #b91c1c', color: '#b91c1c', padding: '10px 14px', fontSize: 12, marginBottom: 16 }}>{downloadError}</div>}
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
                    <td style={{ padding: '11px 14px' }}><button type="button" aria-label={`Download ${doc.name}`} disabled={downloadingId === doc.id} onClick={() => void downloadDocument(doc)} style={{ background: 'none', border: 'none', cursor: downloadingId === doc.id ? 'wait' : 'pointer', color: C.textFaint, opacity: downloadingId === doc.id ? 0.5 : 1 }}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>{downloadingId === doc.id ? 'hourglass_top' : 'download'}</span></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ background: C.surfaceCard, border: `1px solid ${C.borderLight}`, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textDark, fontFamily: "'Hanken Grotesk', sans-serif", marginBottom: 14 }}>Upload to Supabase Storage</div>
            <div style={{ border: `2px dashed ${C.borderLight}`, padding: 24, textAlign: 'center', marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 26, color: C.textFaint, display: 'block', marginBottom: 8 }}>cloud_upload</span>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 3 }}>Choose a PPAP document to upload</div>
              <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint }}>PDF, XLSX, CSV, or images — max 25 MB</div>
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.webp" style={{ display: 'none' }} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) void handleUpload(file); }} />
            <SecondaryButton icon="upload" onClick={() => void handleUpload()} disabled={uploading} wide>
              {uploading ? <><Spinner size={12} color={C.textDark} /> Uploading...</> : 'Choose & Upload Document'}
            </SecondaryButton>
            {uploadError && <div role="alert" style={{ color: '#b42318', fontSize: 11 }}>{uploadError}</div>}
          </div>
          {storageLog && (
            <div style={{ background: C.textDark, padding: 12 }}>
              <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: `${C.blue}88`, marginBottom: 5, letterSpacing: '0.1em' }}>SUPABASE STORAGE LOG</div>
              <pre style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: C.blue, margin: 0, lineHeight: '14px', whiteSpace: 'pre-wrap' as const }}>{storageLog}</pre>
            </div>
          )}
          <div style={{ background: C.surfaceLow, border: `1px solid ${C.borderLight}`, padding: 13 }}>
            <div style={{ fontSize: 8, fontFamily: "'JetBrains Mono', monospace", color: C.textFaint, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 8 }}>STORAGE CONFIG</div>
            {[['Bucket','partner-private'],['Access','Private bucket'],['Upload URL','300s'],['Download URL','3600s'],['Provider','Supabase Storage']].map(([k,v]) => (
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
