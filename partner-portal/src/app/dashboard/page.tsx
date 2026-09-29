import Link from 'next/link';
import { requirePortalUser } from '@/lib/auth';
import { apiFetchServer } from '@/lib/api-server';
import {
  toPortalCAR,
  toPortalRFQ,
  toPortalScorecardPeriod,
} from '@/lib/mappers';
import type {
  CARDTO,
  RFQDTO,
  ScorecardPeriodDTO,
} from '@/lib/mappers';
import { Badge, KPICard, SectionHeader } from '@/components/ui';
import { colors } from '@/styles/tokens';
import type { APIResponse } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

const COLORS = colors;

const RECENT_RFQS = 5;
const RECENT_CARS = 3;

export default async function DashboardPage() {
  const user = await requirePortalUser();

  const [rfqResponse, carResponse, scoreResponse] = await Promise.all([
    apiFetchServer<APIResponse<RFQDTO[]>>('/v1/rfq').catch((error) => {
      console.error('[DashboardPage] RFQ API failed', error);
      return { data: [] as RFQDTO[] };
    }),

    apiFetchServer<APIResponse<CARDTO[]>>('/v1/quality').catch((error) => {
      console.error('[DashboardPage] CAR API failed', error);
      return { data: [] as CARDTO[] };
    }),

    apiFetchServer<APIResponse<ScorecardPeriodDTO[]>>(
      '/v1/suppliers/me/scorecard/periods',
    ).catch((error) => {
      console.error('[DashboardPage] Scorecard API failed', error);
      return { data: [] as ScorecardPeriodDTO[] };
    }),
  ]);

  const latestScore = scoreResponse.data?.[0]
    ? toPortalScorecardPeriod(scoreResponse.data[0])
    : undefined;

  const rfqs = (rfqResponse.data ?? [])
    .slice(0, RECENT_RFQS)
    .map(toPortalRFQ);

  const cars = (carResponse.data ?? [])
    .slice(0, RECENT_CARS)
    .map(toPortalCAR);

  const openCars = cars.filter((car) => car.status !== 'CLOSED');

  const tierLabel = {
    1: 'TIER 01 — Basic',
    2: 'TIER 02 — Qualified',
    3: 'TIER 03 — Strategic',
  }[user.tier];

  const firstName = user.name.split(' ')[0];

  const lastRFQId = rfqs.at(-1)?.id;
  const lastOpenCarId = openCars.at(-1)?.id;

  return (
    <div
      style={{
        padding: 'clamp(14px, 3vw, 28px)',
        maxWidth: 1300,
        margin: '0 auto',
      }}
    >
      <SectionHeader
        eyebrow={`Welcome back, ${firstName}`}
        title="Partner Dashboard"
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <KPICard
          label="Quality (PPM)"
          value={latestScore?.qualityPPM ?? '—'}
          trend="↓ 12%"
          ok={true}
          sub="vs Target 100"
          icon="verified"
        />

        <KPICard
          label="Delivery OTD"
          value={
            latestScore
              ? `${latestScore.deliveryOTD}`
              : '—'
          }
          unit="%"
          trend="↑ 0.5%"
          ok={true}
          sub="vs Target 98%"
          icon="local_shipping"
        />

        <KPICard
          label="Active RFQs"
          value={rfqs.length}
          ok={true}
          sub="across all statuses"
          icon="description"
        />

        <KPICard
          label="Open CARs"
          value={openCars.length}
          ok={openCars.length === 0}
          sub="requiring action"
          icon="report_problem"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div
            style={{
              background: COLORS.surfaceCard,
              border: `1px solid ${COLORS.borderLight}`,
            }}
          >
            <div
              style={{
                padding: '14px 20px',
                borderBottom:
                  `1px solid ${COLORS.borderLight}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.textDark,
                  fontFamily:
                    "'Hanken Grotesk', sans-serif",
                }}
              >
                Recent RFQs
              </h3>

              <Link
                href="/rfq"
                style={{
                  fontSize: 9,
                  fontFamily:
                    "'JetBrains Mono', monospace",
                  color: COLORS.textFaint,
                  textDecoration: 'none',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                VIEW ALL →
              </Link>
            </div>

            {rfqs.length === 0 ? (
              <div
                style={{
                  padding: '32px 20px',
                  textAlign: 'center',
                  color: COLORS.textFaint,
                  fontSize: 13,
                }}
              >
                No RFQ submissions yet.
              </div>
            ) : (
              rfqs.map((rfq) => (
                <div
                  key={rfq.id}
                  style={{
                    padding: '13px 20px',
                    borderBottom:
                      rfq.id !== lastRFQId
                        ? `1px solid ${COLORS.borderLight}`
                        : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        alignItems: 'center',
                        marginBottom: 4,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily:
                            "'JetBrains Mono', monospace",
                          color: COLORS.textFaint,
                        }}
                      >
                        {rfq.referenceId}
                      </span>

                      <Badge s={rfq.status} />
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: COLORS.textDark,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {rfq.partName}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: COLORS.textFaint,
                        marginTop: 2,
                      }}
                    >
                      {rfq.annualVolume.toLocaleString()}
                      {' '}
                      units/yr
                    </div>
                  </div>
                </div>
              ))
            )}

            {user.tier >= 2 && (
              <div
                style={{
                  padding: '12px 20px',
                  borderTop:
                    rfqs.length > 0
                      ? `1px solid ${COLORS.borderLight}`
                      : 'none',
                }}
              >
                <Link
                  href="/rfq/new"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: COLORS.textDark,
                    textDecoration: 'none',
                    fontFamily:
                      "'Hanken Grotesk', sans-serif",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 15 }}
                  >
                    add
                  </span>
                  New RFQ Submission
                </Link>
              </div>
            )}
          </div>

          {openCars.length > 0 && (
            <div
              style={{
                background: COLORS.surfaceCard,
                border:
                  `1px solid ${COLORS.borderLight}`,
              }}
            >
              <div
                style={{
                  padding: '14px 20px',
                  borderBottom:
                    `1px solid ${COLORS.borderLight}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.textDark,
                    fontFamily:
                      "'Hanken Grotesk', sans-serif",
                  }}
                >
                  Open CARs
                </h3>

                <Link
                  href="/car"
                  style={{
                    fontSize: 9,
                    fontFamily:
                      "'JetBrains Mono', monospace",
                    color: COLORS.textFaint,
                    textDecoration: 'none',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  VIEW ALL →
                </Link>
              </div>

              {openCars.map((car) => (
                <div
                  key={car.id}
                  style={{
                    padding: '13px 20px',
                    borderBottom:
                      car.id !== lastOpenCarId
                        ? `1px solid ${COLORS.borderLight}`
                        : 'none',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 3,
                      alignSelf: 'stretch',
                      background: COLORS.amber,
                      flexShrink: 0,
                      minHeight: 14,
                    }}
                  />

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: 6,
                        alignItems: 'center',
                        marginBottom: 3,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily:
                            "'JetBrains Mono', monospace",
                          color: COLORS.textFaint,
                        }}
                      >
                        {car.referenceId}
                      </span>

                      <Badge s={car.severity} />
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: COLORS.textDark,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {car.deviation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div
            style={{
              background: COLORS.textDark,
              padding: 22,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontFamily:
                  "'JetBrains Mono', monospace",
                color: `${COLORS.blue}77`,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              Scorecard Rating
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 14,
              }}
            >
              <div
                style={{
                  fontSize: 72,
                  fontFamily:
                    "'Hanken Grotesk', sans-serif",
                  fontWeight: 900,
                  color: COLORS.blue,
                  lineHeight: 1,
                }}
              >
                {latestScore?.overallGrade ?? '—'}
              </div>

              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: COLORS.blue,
                    marginBottom: 8,
                  }}
                >
                  {user.company}
                </div>

                {user.tier === 3 && (
                  <Badge s="Strategic" />
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              background: COLORS.surfaceCard,
              border:
                `1px solid ${COLORS.borderLight}`,
              padding: 18,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontFamily:
                  "'JetBrains Mono', monospace",
                color: COLORS.textFaint,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 14,
              }}
            >
              Account Details
            </div>

            {[
              ['Vendor ID', user.vendorId],
              ['Tier', tierLabel],
              ['Contact', user.name],
              ['Email', user.email],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                  paddingBottom: 8,
                  borderBottom:
                    `1px solid ${COLORS.borderLight}`,
                  gap: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontFamily:
                      "'JetBrains Mono', monospace",
                    color: COLORS.textFaint,
                    flexShrink: 0,
                  }}
                >
                  {label}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: COLORS.textDark,
                    textAlign: 'right',
                    wordBreak: 'break-word',
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}