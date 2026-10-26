import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { apiFetchServer } from '@/lib/api-server';
import { requireQualityReviewer } from '@/lib/auth';
import QualityReviewDetailClient, { type ReviewDetailCAR } from './QualityReviewDetailClient';

export const metadata: Metadata = { title: 'Review Corrective Action' };

export default async function QualityReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireQualityReviewer();
  const response = await apiFetchServer<{ data?: ReviewDetailCAR }>(`/v1/quality/reviewer/cars/${encodeURIComponent(id)}`).catch((error) => {
    console.error('[QualityReviewDetailPage] CAR load failed', error);
    return { data: undefined };
  });
  if (!response.data) notFound();
  return <QualityReviewDetailClient car={response.data} />;
}
