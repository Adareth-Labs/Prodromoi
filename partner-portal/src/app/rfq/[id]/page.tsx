import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { requirePortalUser } from '@/lib/auth';
import { apiFetchServer } from '@/lib/api-server';
import RFQDetailClient from './RFQDetailClient';

export const metadata: Metadata = { title: 'RFQ Detail' };

export default async function RFQDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePortalUser({ minTier: 2 });
  if (!user.supplierId) redirect('/dashboard');

  const response = await apiFetchServer<any>(`/v1/rfq/${encodeURIComponent(id)}`).catch((error) => {
    console.error('[RFQDetailPage] API request failed', error);
    return { data: null };
  });
  if (!response.data) notFound();

  // Only pass fields needed by the page; storage object keys stay server-side.
  const rfq = {
    id: response.data.id,
    trackingId: response.data.trackingId,
    partNumber: response.data.partNumber ?? response.data.sku ?? '',
    partName: response.data.partName ?? response.data.partFamily ?? '',
    partFamily: response.data.partFamily ?? '',
    status: response.data.status,
    annualVolume: response.data.annualVolume ?? null,
    targetPrice: response.data.targetPrice == null ? null : Number(response.data.targetPrice),
    material: response.data.material ?? null,
    toleranceClass: response.data.toleranceClass ?? null,
    drawingRef: response.data.drawingRef ?? null,
    requiredBy: response.data.requiredBy ?? null,
    notes: response.data.notes ?? null,
    createdAt: response.data.createdAt,
    submittedAt: response.data.submittedAt ?? null,
    documents: (response.data.documents ?? []).map((document: any) => ({
      id: document.id,
      fileName: document.fileName,
      contentType: document.contentType,
      sizeBytes: document.sizeBytes,
      uploadedAt: document.uploadedAt,
    })),
  };

  return <RFQDetailClient rfq={rfq} />;
}
