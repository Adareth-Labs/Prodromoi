import Link from 'next/link';
import { requirePortalUser } from '@/lib/auth';
import { apiFetchServer } from '@/lib/api-server';
import { toPortalRFQ } from '@/lib/mappers';
import type { RFQDTO } from '@/lib/mappers';
import {
  Badge,
  KPICard,
  SectionHeader,
  RBACGate,
} from '@/components/ui';
import { colors } from '@/styles/tokens';
import type { APIResponse } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RFQ Submissions',
};

const COLORS = colors;

const TABLE_HEADERS = [
  'Reference',
  'Part Name',
  'Part No.',
  'Volume',
  'Status',
  'Submitted',
  'Docs',
  '',
];

export default async function RFQListPage() {
  const user = await requirePortalUser();

  const response =
    user.tier >= 2
      ? await apiFetchServer<APIResponse<RFQDTO[]>>(
          '/v1/rfq',
        ).catch((error) => {
          console.error(
            '[RFQListPage] API request failed',
            error,
          );

          return {
            data: [] as RFQDTO[],
          };
        })
      : {
          data: [] as RFQDTO[],
        };

  const rfqs = (response.data ?? []).map(toPortalRFQ);

  const pendingCount = rfqs.filter(
    (rfq) => rfq.status === 'PENDING',
  ).length;

  const reviewCount = rfqs.filter(
    (rfq) => rfq.status === 'UNDER_REVIEW',
  ).length;

  const approvedCount = rfqs.filter(
    (rfq) => rfq.status === 'APPROVED',
  ).length;

  const lastRFQId = rfqs.at(-1)?.id;

  return (
    <div
      style={{
        padding: 'clamp(14px, 3vw, 28px)',
        maxWidth: 1100,
        margin: '0 auto',
      }}
    >
      <RBACGate user={user} minTier={2}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginBottom: 24,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <SectionHeader
            eyebrow="RFQ Management"
            title="Submissions"
          />

          <Link
            href="/rfq/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '10px 18px',
              background: COLORS.textDark,
              color: '#fff',
              textDecoration: 'none',
              fontSize: 13,
              fontFamily:
                "'Hanken Grotesk', sans-serif",
              fontWeight: 600,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 15,
                color: '#fff',
              }}
            >
              add
            </span>
            New RFQ
          </Link>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 14,
            marginBottom: 24,
          }}
        >
          <KPICard
            label="Total Submissions"
            value={rfqs.length}
            ok={true}
            icon="description"
          />

          <KPICard
            label="Pending"
            value={pendingCount}
            ok={null}
            icon="pending"
          />

          <KPICard
            label="Under Review"
            value={reviewCount}
            ok={null}
            icon="rate_review"
          />

          <KPICard
            label="Approved"
            value={approvedCount}
            ok={true}
            icon="check_circle"
          />
        </div>

        <div
          style={{
            background: COLORS.surfaceCard,
            border:
              `1px solid ${COLORS.borderLight}`,
          }}
        >
          <div
            style={{
              padding: '13px 18px',
              borderBottom:
                `1px solid ${COLORS.borderLight}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily:
                  "'JetBrains Mono', monospace",
                color: COLORS.textFaint,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              All Submissions
            </div>
          </div>

          {rfqs.length === 0 ? (
            <div
              style={{
                padding: '52px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: COLORS.textFaint,
                  marginBottom: 16,
                }}
              >
                No RFQ submissions yet.
              </div>

              <Link
                href="/rfq/new"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  background: COLORS.textDark,
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontFamily:
                    "'Hanken Grotesk', sans-serif",
                  fontWeight: 600,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 15 }}
                >
                  add
                </span>
                Submit First RFQ
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  minWidth: 560,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: COLORS.surfaceLow,
                    }}
                  >
                    {TABLE_HEADERS.map((header) => (
                      <th
                        key={header}
                        style={{
                          padding: '9px 14px',
                          fontSize: 8,
                          fontFamily:
                            "'JetBrains Mono', monospace",
                          color: COLORS.textFaint,
                          textAlign: 'left',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          borderBottom:
                            `1px solid ${COLORS.borderLight}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rfqs.map((rfq) => {
                    const indicatorColor =
                      rfq.status === 'APPROVED'
                        ? COLORS.green
                        : rfq.status === 'UNDER_REVIEW'
                          ? COLORS.amber
                          : COLORS.borderLight;

                    return (
                      <tr
                        key={rfq.id}
                        style={{
                          borderBottom:
                            rfq.id !== lastRFQId
                              ? `1px solid ${COLORS.borderLight}`
                              : 'none',
                        }}
                      >
                        <td
                          style={{
                            padding: '12px 14px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 3,
                                height: 24,
                                background:
                                  indicatorColor,
                                flexShrink: 0,
                              }}
                            />

                            <span
                              style={{
                                fontSize: 11,
                                fontFamily:
                                  "'JetBrains Mono', monospace",
                                color:
                                  COLORS.textFaint,
                                whiteSpace:
                                  'nowrap',
                              }}
                            >
                              {rfq.referenceId}
                            </span>
                          </div>
                        </td>

                        <td
                          style={{
                            padding: '12px 14px',
                            fontSize: 13,
                            fontWeight: 500,
                            color:
                              COLORS.textDark,
                            maxWidth: 200,
                          }}
                        >
                          <div
                            style={{
                              overflow: 'hidden',
                              textOverflow:
                                'ellipsis',
                              whiteSpace:
                                'nowrap',
                            }}
                          >
                            {rfq.partName}
                          </div>
                        </td>

                        <td
                          style={{
                            padding: '12px 14px',
                            fontSize: 11,
                            fontFamily:
                              "'JetBrains Mono', monospace",
                            color:
                              COLORS.textMuted,
                            whiteSpace:
                              'nowrap',
                          }}
                        >
                          {rfq.partNumber}
                        </td>

                        <td
                          style={{
                            padding: '12px 14px',
                            fontSize: 12,
                            color:
                              COLORS.textMuted,
                            whiteSpace:
                              'nowrap',
                          }}
                        >
                          {rfq.annualVolume.toLocaleString()}
                          /yr
                        </td>

                        <td
                          style={{
                            padding: '12px 14px',
                          }}
                        >
                          <Badge
                            s={rfq.status}
                          />
                        </td>

                        <td
                          style={{
                            padding: '12px 14px',
                            fontSize: 10,
                            fontFamily:
                              "'JetBrains Mono', monospace",
                            color:
                              COLORS.textFaint,
                            whiteSpace:
                              'nowrap',
                          }}
                        >
                          {new Date(
                            rfq.submittedAt,
                          ).toLocaleDateString()}
                        </td>

                        <td
                          style={{
                            padding: '12px 14px',
                            fontSize: 12,
                            color:
                              COLORS.textFaint,
                          }}
                        >
                          {rfq.documents.length}
                        </td>

                        <td
                          style={{
                            padding: '12px 14px',
                          }}
                        >
                          <Link
                            href={`/rfq/${rfq.id}`}
                            aria-label={`View RFQ ${rfq.referenceId}`}
                            style={{
                              display:
                                'inline-flex',
                              background: 'none',
                              border: 'none',
                              color:
                                COLORS.textFaint,
                              textDecoration:
                                'none',
                            }}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{
                                fontSize: 16,
                              }}
                            >
                              chevron_right
                            </span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </RBACGate>
    </div>
  );
}