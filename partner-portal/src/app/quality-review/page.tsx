import type { Metadata } from 'next';
import { apiFetchServer } from '@/lib/api-server';
import { requireQualityReviewer } from '@/lib/auth';
import QualityReviewQueueClient, { type ReviewQueueCAR } from './QualityReviewQueueClient';

export const metadata: Metadata = { title: 'Internal Quality Review Queue' };

export default async function QualityReviewQueuePage() {
  await requireQualityReviewer();
  let cars: ReviewQueueCAR[] = [];
  let error = '';
  try {
    const response = await apiFetchServer<{ data: ReviewQueueCAR[] }>('/v1/quality/reviewer/queue');
    cars = response.data ?? [];
  } catch (cause) {
    console.error('[QualityReviewQueuePage] Could not load review queue', cause);
    error = 'The review queue could not be loaded. Check the API connection and try refreshing.';
  }
  return <QualityReviewQueueClient initialCars={cars} loadError={error} />;
}
